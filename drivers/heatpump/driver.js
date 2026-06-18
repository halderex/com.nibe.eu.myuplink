'use strict';

const { OAuth2Driver } = require('homey-oauth2app');

/**
 * Nibe heat pump driver. Pairing/repair are driven by homey-oauth2app's built-in OAuth2 flow
 * (the login_oauth2 + list_devices + add_devices pair views in driver.compose.json). After
 * login we list the user's devices from /v2/systems/me; tokens are owned by the OAuth2 session,
 * not the device store.
 */
class NibeDriver extends OAuth2Driver {

  async onPairListDevices({ oAuth2Client }) {
    const systems = await oAuth2Client.getSystemsMe();

    // Each pump is exposed as two consumer devices — Heating and Hot water — so Homey's Energy
    // can attribute cost per category (it only costs a device's primary measure/meter_power, not
    // sub-capabilities). They share the same myUplink device id; `role` keeps their data unique.
    const roles = [
      { role: 'heating', suffix: this.homey.__('pair.heating'), icon: '/heating.svg' },
      { role: 'hotwater', suffix: this.homey.__('pair.hotwater'), icon: '/hotwater.svg' },
    ];

    const devices = [];
    for (const system of (systems && systems.systems) || []) {
      for (const apiDevice of system.devices || []) {
        if (!apiDevice.id) continue;
        const product = apiDevice.product || {};
        const baseName = product.name || 'Nibe Heat Pump';
        for (const { role, suffix, icon } of roles) {
          devices.push({
            name: `${baseName} — ${suffix}`,
            data: { id: apiDevice.id, role },
            store: { systemId: system.systemId },
            icon, // relative to /drivers/heatpump/assets/ — applied at (re-)pair time
          });
        }
      }
    }
    return devices;
  }

}

module.exports = NibeDriver;
