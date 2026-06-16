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

// myUplink parameterId -> capability mapping. See docs/myuplink-api-responses.md.
const POINT_MAP = {
  4: pointMap('measure_temperature.outdoor'), // Current outdoor temperature (BT1)
  48351: pointMap('measure_temperature'), // Indoor temperature (Climate system 1)
  32628: pointMap('measure_temperature.hotwater'), // Hot water temperature
  8: pointMap('measure_temperature.supply'), // Supply line (BT2)
  22130: pointMap('measure_power'), // Instantaneous used power (W)
  28393: pointMap('meter_power'), // Tot. consumption (cumulative kWh)
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

// Instantaneous-power split for per-tariff-window cost attribution. The pump exposes a single
// live power reading (22130) plus its operating priority (14950); we attribute all of the
// instantaneous power to whichever category the pump is currently serving. Approximate, but
// updates every minute — fine-grained enough for 15-minute spot-tariff windows that the flat
// kWh counters (refreshed only every ~20–30 min) are too coarse for.
const POWER_POINT = '22130';
const PRIORITY_POINT = '14950';
const HEATING_PRIORITIES = new Set([1, 6]); // 1=Heating, 6=Pre-heating
const HOTWATER_PRIORITIES = new Set([3]); // 3=Hot water
const MEASURE_POWER_HEATING = 'measure_power.heating';
const MEASURE_POWER_HOTWATER = 'measure_power.hotwater';
// Capabilities computed from POWER_POINT + PRIORITY_POINT (no 1:1 POINT_MAP entry).
const DERIVED_CAPABILITIES = [MEASURE_POWER_HEATING, MEASURE_POWER_HOTWATER];

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const FAST_POLL_INTERVAL_MS = 60 * 1000;

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

    // Add/remove mapped capabilities to match what this device supports, so existing devices
    // self-heal after an app update and Premium-only controls don't show up (and silently 403)
    // on accounts without them.
    await this._syncCapabilities(await this._fetchFeatures());
    // Capabilities derived from the power split aren't in POINT_MAP — ensure they exist so
    // devices paired before this feature self-heal on update.
    await this._ensureDerivedCapabilities();

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
   * Ensure the device's capabilities match what it supports. Sensor/temperature capabilities are
   * always present. Premium-gated controls are added only when their availableFeatures flag is
   * true, and removed otherwise. When features is null (fetch failed) gated capabilities are left
   * untouched.
   */
  async _syncCapabilities(features) {
    const capabilities = [...new Set(Object.values(POINT_MAP).map((m) => m.capability))];
    for (const capability of capabilities) {
      const featureKey = PREMIUM_GATED_CAPABILITIES[capability];
      let desired;
      if (featureKey === undefined) {
        desired = true;
      } else if (features === null) {
        continue;
      } else {
        desired = Boolean(features[featureKey]);
      }

      const has = this.hasCapability(capability);
      try {
        if (desired && !has) {
          await this.addCapability(capability);
          this.log(`Added capability: ${capability}`);
        } else if (!desired && has) {
          await this.removeCapability(capability);
          this.log(`Removed unsupported capability: ${capability}`);
        }
      } catch (err) {
        this.error(`Could not update capability ${capability}: ${err}`);
      }
    }
  }

  /** Add the power-split capabilities if missing (they have no POINT_MAP entry). */
  async _ensureDerivedCapabilities() {
    for (const capability of DERIVED_CAPABILITIES) {
      if (!this.hasCapability(capability)) {
        try {
          await this.addCapability(capability);
          this.log(`Added capability: ${capability}`);
        } catch (err) {
          this.error(`Could not add capability ${capability}: ${err}`);
        }
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
      for (const point of points) {
        const map = POINT_MAP[String(point.parameterId)];
        if (!map || !this.hasCapability(map.capability)) continue;
        const value = readCapabilityValue(map, point);
        if (value !== null) {
          await this.setCapabilityValue(map.capability, value);
          this._logDebug(`${map.capability} = ${value} (parameterId ${point.parameterId})`);
          updated += 1;
        }
      }

      this._logDebug(`Poll complete: ${points.length} points received, ${updated} capabilities updated`);
      await this.setAvailable();
    } catch (err) {
      this.error(`Poll failed: ${err}`);
      await this.setUnavailable(this.homey.__('device.unavailable'));
    }
  }

  /**
   * Fast poll: split the live instantaneous power across heating/hot water by the pump's current
   * operating priority, so cost can be attributed within short tariff windows.
   */
  async _pollPower() {
    try {
      const deviceId = this.getData().id;
      const points = await this.oAuth2Client.getPoints(deviceId, {
        parameters: [POWER_POINT, PRIORITY_POINT],
      });
      const byId = {};
      for (const point of points) byId[String(point.parameterId)] = point;

      const power = MyUplinkOAuth2Client.pointValue(byId[POWER_POINT]);
      if (power === null) return;
      const priorityVal = MyUplinkOAuth2Client.pointValue(byId[PRIORITY_POINT]);
      const priority = priorityVal === null ? null : Math.trunc(priorityVal);

      const heating = HEATING_PRIORITIES.has(priority) ? power : 0.0;
      const hotwater = HOTWATER_PRIORITIES.has(priority) ? power : 0.0;

      if (this.hasCapability('measure_power')) await this.setCapabilityValue('measure_power', power);
      if (this.hasCapability(MEASURE_POWER_HEATING)) await this.setCapabilityValue(MEASURE_POWER_HEATING, heating);
      if (this.hasCapability(MEASURE_POWER_HOTWATER)) await this.setCapabilityValue(MEASURE_POWER_HOTWATER, hotwater);
      this._logDebug(
        `Power poll: total=${power}W priority=${priority} -> heating=${heating}W hotwater=${hotwater}W`,
      );
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
