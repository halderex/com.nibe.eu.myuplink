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

    const devices = [];
    for (const system of (systems && systems.systems) || []) {
      for (const apiDevice of system.devices || []) {
        if (!apiDevice.id) continue;
        const product = apiDevice.product || {};
        devices.push({
          name: product.name || 'Nibe Heat Pump',
          data: { id: apiDevice.id },
          store: { systemId: system.systemId },
        });
      }
    }
    return devices;
  }

}

module.exports = NibeDriver;
