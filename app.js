'use strict';

const { OAuth2App } = require('homey-oauth2app');
const MyUplinkOAuth2Client = require('./lib/MyUplinkOAuth2Client');

/**
 * App entry point. homey-oauth2app auto-registers the default OAuth2 config from the client's
 * static API_URL/TOKEN_URL/AUTHORIZATION_URL/SCOPES/REDIRECT_URL and CLIENT_ID/CLIENT_SECRET
 * (read from env.json via Homey.env). All API/HTTP logic lives in MyUplinkOAuth2Client.
 */
class MyApp extends OAuth2App {

  static OAUTH2_CLIENT = MyUplinkOAuth2Client;
  static OAUTH2_DEBUG = false;
  // A myUplink account maps to a single login; no need for multiple concurrent sessions.
  static OAUTH2_MULTI_SESSION = false;

  async onOAuth2Init() {
    this._registerFlowCards();
    this.log('Initialized MyApp — myUplink OAuth2 client configured');
  }

  _registerFlowCards() {
    try {
      const card = this.homey.flow.getActionCard('boost_hot_water');
      card.registerRunListener(async ({ device, duration }) => {
        await device.boostHotWater(duration);
      });
    } catch (err) {
      this.error(`Could not register Flow cards: ${err}`);
    }
  }

}

module.exports = MyApp;
