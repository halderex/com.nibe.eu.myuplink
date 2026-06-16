'use strict';

const { OAuth2Device } = require('homey-oauth2app');
const MyUplinkOAuth2Client = require('../../lib/MyUplinkOAuth2Client');

/**
 * How a myUplink parameter maps to a Homey capability (both directions).
 *   kind:     "number" (real value °C/W/kWh), "bool" (on/off enum), "enum" (multi-value enum)
 *   scale:    converts the API's raw min/max bounds to real units for clamping writes
 *   rawMin/rawMax: raw (unscaled) bounds from the API, used to clamp writable numbers
 * Both reads and writes use the real/display value (e.g. 22.0 for 22 °C).
 */
function pointMap(capability, {
  kind = 'number', scale = 1.0, writable = false, rawMin = null, rawMax = null,
} = {}) {
  return {
    capability, kind, scale, writable, rawMin, rawMax,
  };
}

// myUplink parameterId -> capability mapping for directly-read points (temps + controls). See
// docs/myuplink-api-responses.md. Power (22130) and the cumulative meter (28393) are NOT here:
// they're split per category into the derived measure_power / accumulated meter_power below.
const POINT_MAP = {
  4: pointMap('measure_temperature.outdoor'), // Current outdoor temperature (BT1)
  48351: pointMap('measure_temperature'), // Indoor temperature (Climate system 1)
  32628: pointMap('measure_temperature.hotwater'), // Hot water temperature
  8: pointMap('measure_temperature.supply'), // Supply line (BT2)
  // Writable controls:
  47751: pointMap('target_temperature', {
    kind: 'number', scale: 0.1, writable: true, rawMin: 50, rawMax: 350,
  }), // Room setpoint
  7086: pointMap('hot_water_boost', { kind: 'bool', writable: true }), // More hot water (on/off)
  8121: pointMap('ventilation_boost', { kind: 'bool', writable: true }), // Increased ventilation
  3830: pointMap('ventilation_mode', { kind: 'enum', writable: true }), // Ventilation mode (0–4)
};

// parameterId for the duration-based hot-water boost Flow action (Off/3/6/12/24/48 h).
const HOT_WATER_BOOST_DURATION_POINT = '4564';

// Capabilities the API only allows writing with a myUplink Premium subscription. Each maps to
// the availableFeatures flag (from GET /v2/devices/{id}) reporting whether this device/account
// supports it; the capability is only exposed when the flag is true.
const PREMIUM_GATED_CAPABILITIES = {
  hot_water_boost: 'boostHotWater',
  ventilation_boost: 'boostVentilation',
  ventilation_mode: 'setVentilationMode',
};

// Operating priority (param 14950): {0=Off, 1=Heating, 2=Cooling, 3=Hot water, 4=Pool,
// 5=Pool 2, 6=Pre-heating}. Only "3" is hot water; everything else (heating, pre-heating, and —
// crucially — Off/standby) is non-production base load: on an exhaust-air S735 the ventilation
// fan, circulation pumps and electronics draw power 24/7.
const HOTWATER_PRIORITIES = new Set([3]);

// Each pump is paired as two consumer devices distinguished by data.role, so Homey Energy can
// cost heating and hot water separately. Each role gets a focused capability set, its own device
// class, and a `matches(priority)` predicate selecting the power that counts as "its" consumption.
// Heating deliberately matches the COMPLEMENT of hot water (incl. idle/standby), so the two shares
// always sum to 1 — the meters then reconcile to the pump's true total and nothing is dropped.
const ROLES = {
  heating: {
    class: 'heatpump',
    matches: (priority) => !HOTWATER_PRIORITIES.has(priority), // heating + base/idle load
    capabilities: [
      'measure_temperature',
      'measure_temperature.outdoor',
      'measure_temperature.supply',
      'measure_power',
      'meter_power',
      'target_temperature',
      'ventilation_boost',
      'ventilation_mode',
    ],
  },
  hotwater: {
    class: 'boiler',
    matches: (priority) => HOTWATER_PRIORITIES.has(priority),
    capabilities: [
      'measure_temperature.hotwater',
      'measure_power',
      'meter_power',
      'hot_water_boost',
    ],
  },
};
const ALL_ROLE_CAPABILITIES = [...new Set([
  ...ROLES.heating.capabilities, ...ROLES.hotwater.capabilities,
])];

// Live power, operating priority, and the real cumulative meter (kWh) — used to derive each
// device's per-category measure_power and meter_power.
const POWER_POINT = '22130';
const PRIORITY_POINT = '14950';
const TOTAL_METER_POINT = '28393';

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const FAST_POLL_INTERVAL_MS = 60 * 1000;
// Cap the per-window meter delta we attribute. A real 5-minute increment can't exceed a fraction
// of a kWh; anything larger means a counter reset/rollover or a long restart gap — skip it (just
// re-baseline) rather than dumping a spurious spike into one category. Same upper bound guards the
// power-integration interval (in hours) against restart gaps polluting the attribution ratio.
const SANE_MAX_DELTA_KWH = 5;
const MAX_INTEGRATION_HOURS = 0.5;

/** Convert a myUplink point into the value a Homey capability expects. */
function readCapabilityValue(map, point) {
  const value = MyUplinkOAuth2Client.pointValue(point);
  if (value === null) return null;
  if (map.kind === 'bool') return Boolean(value);
  if (map.kind === 'enum') return String(Math.trunc(value));
  return value; // number — already scaled to real units
}

/** Convert a Homey capability value into the value the myUplink API expects. */
function writeApiValue(map, capabilityValue) {
  if (map.kind === 'bool') return capabilityValue ? 1 : 0;
  if (map.kind === 'enum') return parseInt(capabilityValue, 10);
  let value = Number(capabilityValue);
  if (map.rawMin !== null) {
    value = Math.max(map.rawMin * map.scale, Math.min(map.rawMax * map.scale, value));
  }
  return value;
}

class NibeDevice extends OAuth2Device {

  async onOAuth2Init() {
    this.log('Device onOAuth2Init');
    this._intervalId = null;
    this._powerIntervalId = null;

    this._role = ROLES[this.getData().role] ? this.getData().role : 'heating';
    this._matches = ROLES[this._role].matches;
    // Power integrated (Wh) over the current meter window: total across the pump, and the part
    // spent serving this device's category — their ratio splits the real meter delta.
    this._catWh = 0;
    this._totWh = 0;
    this._lastPriority = null;
    this._lastFastTs = Date.now();

    try {
      const cls = ROLES[this._role].class;
      if (this.getClass() !== cls) await this.setClass(cls);
    } catch (err) {
      this.error(`Could not set device class: ${err}`);
    }

    // Add/remove capabilities to match this role (and Premium availability), so devices self-heal
    // after an app update and Premium-only controls don't show up (and silently 403) without them.
    await this._syncCapabilities(await this._fetchFeatures());

    // Restore the accumulated meter so meter_power stays monotonic across restarts.
    const meterKwh = this.getStoreValue('meterKwh');
    if (typeof meterKwh === 'number' && this.hasCapability('meter_power')) {
      await this.setCapabilityValue('meter_power', meterKwh).catch(() => {});
    }

    // Map each writable capability back to its parameter for the set listeners.
    this._writable = {};
    for (const [pid, map] of Object.entries(POINT_MAP)) {
      if (map.writable) this._writable[map.capability] = { pid, map };
    }
    for (const capability of Object.keys(this._writable)) {
      if (this.hasCapability(capability)) {
        this.registerCapabilityListener(capability, this._makeSetListener(capability));
      }
    }

    await this._poll();
    await this._pollPower();
    this._intervalId = this.homey.setInterval(() => this._poll(), POLL_INTERVAL_MS);
    this._powerIntervalId = this.homey.setInterval(() => this._pollPower(), FAST_POLL_INTERVAL_MS);
  }

  async onOAuth2Uninit() {
    if (this._intervalId) this.homey.clearInterval(this._intervalId);
    if (this._powerIntervalId) this.homey.clearInterval(this._powerIntervalId);
  }

  /* ── Capability provisioning ── */

  /** Return the device's availableFeatures, or null if it can't be fetched. */
  async _fetchFeatures() {
    try {
      const deviceId = this.getData().id;
      const info = await this.oAuth2Client.getDevice(deviceId);
      return info.availableFeatures || {};
    } catch (err) {
      this.error(`Could not fetch device features: ${err}`);
      return null;
    }
  }

  /**
   * Ensure the device's capabilities match its role. Capabilities outside the role's set are
   * removed; capabilities in it are added — except Premium-gated controls, which are added only
   * when their availableFeatures flag is true. When features is null (fetch failed) a gated
   * capability the role wants is left untouched; one the role doesn't want is still removed.
   */
  async _syncCapabilities(features) {
    const desired = new Set(ROLES[this._role].capabilities);
    for (const capability of ALL_ROLE_CAPABILITIES) {
      const featureKey = PREMIUM_GATED_CAPABILITIES[capability];
      let want;
      if (!desired.has(capability)) {
        want = false;
      } else if (featureKey === undefined) {
        want = true;
      } else if (features === null) {
        continue; // can't determine Premium availability — leave a wanted gated capability as-is
      } else {
        want = Boolean(features[featureKey]);
      }

      const has = this.hasCapability(capability);
      try {
        if (want && !has) {
          await this.addCapability(capability);
          this.log(`Added capability: ${capability}`);
        } else if (!want && has) {
          await this.removeCapability(capability);
          this.log(`Removed capability: ${capability}`);
        }
      } catch (err) {
        this.error(`Could not update capability ${capability}: ${err}`);
      }
    }
  }

  _logDebug(msg) {
    try {
      if (this.homey.settings.get('debugLogging')) this.log(`[debug] ${msg}`);
    } catch (err) {
      // ignore
    }
  }

  /* ── Reading ── */

  async _poll() {
    try {
      const deviceId = this.getData().id;
      const language = this.homey.i18n.getLanguage();
      const points = await this.oAuth2Client.getPoints(deviceId, { language });

      let updated = 0;
      let totalPoint = null;
      for (const point of points) {
        if (String(point.parameterId) === TOTAL_METER_POINT) totalPoint = point;
        const map = POINT_MAP[String(point.parameterId)];
        if (!map || !this.hasCapability(map.capability)) continue;
        const value = readCapabilityValue(map, point);
        if (value !== null) {
          await this.setCapabilityValue(map.capability, value);
          this._logDebug(`${map.capability} = ${value} (parameterId ${point.parameterId})`);
          updated += 1;
        }
      }

      await this._accumulateMeter(totalPoint);

      this._logDebug(`Poll complete: ${points.length} points received, ${updated} capabilities updated`);
      await this.setAvailable();
    } catch (err) {
      this.error(`Poll failed: ${err}`);
      await this.setUnavailable(this.homey.__('device.unavailable'));
    }
  }

  /**
   * Attribute the real cumulative meter's (28393) increase since the last poll to this device's
   * category, splitting it by the share of pump energy spent serving that category during the
   * window (power-weighted via the fast poll). Keeps meter_power accurate and reconciled with the
   * pump's true total.
   */
  async _accumulateMeter(totalPoint) {
    const total = MyUplinkOAuth2Client.pointValue(totalPoint);
    if (total === null) return;

    const last = this.getStoreValue('lastTotal');
    let meterKwh = this.getStoreValue('meterKwh');
    if (typeof meterKwh !== 'number') meterKwh = 0;

    if (typeof last === 'number') {
      const delta = total - last;
      if (delta > 0 && delta < SANE_MAX_DELTA_KWH) {
        const share = this._totWh > 0
          ? this._catWh / this._totWh
          : (this._matches(this._lastPriority) ? 1 : 0);
        meterKwh += delta * share;
        await this.setStoreValue('meterKwh', meterKwh);
        if (this.hasCapability('meter_power')) await this.setCapabilityValue('meter_power', meterKwh);
        this._logDebug(`Meter: Δ=${delta.toFixed(3)}kWh share=${share.toFixed(3)} -> ${meterKwh.toFixed(3)}kWh`);
      } else if (delta !== 0) {
        this._logDebug(`Meter: ignoring delta ${delta} (reset/rollover/gap), re-baselining`);
      }
    } else if (this.hasCapability('meter_power') && this.getCapabilityValue('meter_power') === null) {
      // First reading on a new device — establish the baseline and seed meter_power so Homey
      // registers it as a meter right away (the first real delta lands on the next poll).
      await this.setStoreValue('meterKwh', meterKwh);
      await this.setCapabilityValue('meter_power', meterKwh);
    }

    await this.setStoreValue('lastTotal', total);
    // Reset the window so the next delta is split by fresh power integration.
    this._catWh = 0;
    this._totWh = 0;
  }

  /**
   * Fast poll: set this device's live measure_power to the pump's power when it's serving this
   * category (else 0), and integrate power over elapsed time into the window accumulators that
   * weight the meter split.
   */
  async _pollPower() {
    try {
      const deviceId = this.getData().id;
      const points = await this.oAuth2Client.getPoints(deviceId, {
        parameters: [POWER_POINT, PRIORITY_POINT],
      });
      const byId = {};
      for (const point of points) byId[String(point.parameterId)] = point;

      const now = Date.now();
      const dtH = (now - this._lastFastTs) / 3600000;
      this._lastFastTs = now;

      const power = MyUplinkOAuth2Client.pointValue(byId[POWER_POINT]);
      if (power === null) return;
      const priorityVal = MyUplinkOAuth2Client.pointValue(byId[PRIORITY_POINT]);
      const priority = priorityVal === null ? null : Math.trunc(priorityVal);
      this._lastPriority = priority;

      const inCategory = this._matches(priority);
      if (dtH > 0 && dtH < MAX_INTEGRATION_HOURS) {
        this._totWh += power * dtH;
        if (inCategory) this._catWh += power * dtH;
      }

      const live = inCategory ? power : 0.0;
      if (this.hasCapability('measure_power')) await this.setCapabilityValue('measure_power', live);
      this._logDebug(`Power poll: total=${power}W priority=${priority} inCategory=${inCategory} -> ${live}W`);
    } catch (err) {
      // Don't flip availability on a transient power-poll error — the main poll owns that.
      this.error(`Power poll failed: ${err}`);
    }
  }

  /* ── Writing ── */

  _makeSetListener(capability) {
    return async (value) => {
      const { pid, map } = this._writable[capability];
      const raw = writeApiValue(map, value);
      this._logDebug(`Set ${capability} -> parameter ${pid} = ${raw}`);
      await this._writePoints({ [pid]: raw });
    };
  }

  /** Trigger a temporary hot-water boost for a preset duration (Flow action). */
  async boostHotWater(durationCode) {
    await this._writePoints({ [HOT_WATER_BOOST_DURATION_POINT]: parseInt(durationCode, 10) });
  }

  async _writePoints(values) {
    const deviceId = this.getData().id;
    try {
      const result = await this.oAuth2Client.setPoints(deviceId, values);
      this._logDebug(`setPoints(${JSON.stringify(values)}) -> ${JSON.stringify(result)}`);
    } catch (err) {
      this.error(`setPoints(${JSON.stringify(values)}) failed: ${err}`);
      const text = String(err);
      if (err.status === 403 || text.includes('(403')) {
        // The API gates some controls behind a Premium subscription (its 403 body says
        // "premium" — note the API's "premuim" typo, so match a prefix).
        if (text.toLowerCase().includes('premi')) {
          await this.setWarning(this.homey.__('device.write_premium'));
          throw new Error('This control requires a myUplink Premium subscription.');
        }
        await this.setWarning(this.homey.__('device.write_forbidden'));
        throw new Error('Write access denied — re-pair this device to grant write permission.');
      }
      throw err;
    }
    try {
      await this.unsetWarning();
    } catch (err) {
      // ignore
    }
  }

}

module.exports = NibeDevice;
