'use strict';

const crypto = require('crypto');
const { OAuth2Client } = require('homey-oauth2app');

// myUplink's Cloudflare front-end returns 1010 ("browser signature banned") for the default
// Node/urllib User-Agent, so a custom one is sent on every request — including the token
// endpoint, which bypasses onRequestHeaders.
const USER_AGENT = 'com.nibe.eu.myuplink/0.1.0';

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Shared myUplink API client built on homey-oauth2app. The library owns token storage, refresh
 * and rotation; this subclass adds PKCE (S256, not native to the library), the custom
 * User-Agent, and the myUplink data endpoints.
 */
class MyUplinkOAuth2Client extends OAuth2Client {

  static API_URL = 'https://api.myuplink.com';
  static TOKEN_URL = 'https://api.myuplink.com/oauth/token';
  static AUTHORIZATION_URL = 'https://api.myuplink.com/oauth/authorize';
  // offline_access is required to receive a refresh token.
  static SCOPES = ['READSYSTEM', 'WRITESYSTEM', 'offline_access'];
  // Must match the redirect URI registered at dev.myuplink.com (note the trailing slash — the
  // library default omits it).
  static REDIRECT_URL = 'https://callback.athom.com/oauth2/callback/';

  // Sensors report this when no value is available.
  static SENSOR_ABSENT = -32768;

  /* ── PKCE (RFC 7636, S256) ── */

  onHandleAuthorizationURL({ scopes, state } = {}) {
    // The same client instance builds the authorize URL and later exchanges the code during a
    // pair session, so holding the verifier on the instance is sufficient.
    this._codeVerifier = base64url(crypto.randomBytes(48));
    const challenge = base64url(
      crypto.createHash('sha256').update(this._codeVerifier).digest(),
    );
    const url = super.onHandleAuthorizationURL({ scopes, state });
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}code_challenge=${challenge}&code_challenge_method=S256`;
  }

  async onGetTokenByCode({ code }) {
    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('client_id', this._clientId);
    body.append('client_secret', this._clientSecret);
    body.append('code', code);
    body.append('redirect_uri', this._redirectUrl);
    if (this._codeVerifier) body.append('code_verifier', this._codeVerifier);

    const response = await fetch(this._tokenUrl, {
      method: 'POST',
      body,
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!response.ok) return this.onHandleGetTokenByCodeError({ response });

    this._token = await this.onHandleGetTokenByCodeResponse({ response });
    return this.getToken();
  }

  async onRefreshToken() {
    const token = this.getToken();
    if (!token || !token.isRefreshable()) {
      throw new Error('Token cannot be refreshed — please re-pair this device.');
    }

    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    body.append('client_id', this._clientId);
    body.append('client_secret', this._clientSecret);
    body.append('refresh_token', token.refresh_token);

    const response = await fetch(this._tokenUrl, {
      method: 'POST',
      body,
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!response.ok) return this.onHandleRefreshTokenError({ response });

    this._token = await this.onHandleRefreshTokenResponse({ response });
    this.save();
    return this.getToken();
  }

  /* ── Requests ── */

  async onRequestHeaders({ headers }) {
    const base = await super.onRequestHeaders({ headers });
    return { ...base, 'User-Agent': USER_AGENT };
  }

  async onHandleNotOK({ body, status, statusText }) {
    const text = typeof body === 'string' ? body : JSON.stringify(body || {});
    const err = new Error(`API request failed (${status} ${statusText || ''}): ${text}`);
    err.status = status;
    return err;
  }

  async onGetOAuth2SessionInformation() {
    const systems = await this.getSystemsMe().catch(() => null);
    const first = systems && Array.isArray(systems.systems) ? systems.systems[0] : null;
    return {
      id: (first && first.systemId) || String(Date.now()),
      title: (first && first.name) || 'myUplink',
    };
  }

  /* ── Data ── */

  /** List the systems (and their devices) the authenticated user owns. */
  async getSystemsMe() {
    return this.get({ path: '/v2/systems/me' });
  }

  /** Get a device's metadata, including availableFeatures (which operations it supports). */
  async getDevice(deviceId) {
    return this.get({ path: `/v2/devices/${encodeURIComponent(deviceId)}` });
  }

  /**
   * Get data points for a device. Pass `language` (e.g. "sv") to localize parameter names, and
   * `parameters` (array of parameterIds) to fetch only those via the ?parameters= filter.
   */
  async getPoints(deviceId, { language, parameters } = {}) {
    const query = parameters && parameters.length ? { parameters: parameters.join(',') } : undefined;
    const headers = language ? { 'Accept-Language': language } : undefined;
    return this.get({
      path: `/v2/devices/${encodeURIComponent(deviceId)}/points`,
      query,
      headers,
    });
  }

  /**
   * Write one or more data points ({parameterId: value}) to a device. Values are the
   * real/display values (e.g. 22 for 22 °C). Requires a WRITESYSTEM token.
   */
  async setPoints(deviceId, values) {
    const json = {};
    for (const [key, value] of Object.entries(values)) json[String(key)] = value;
    return this.patch({ path: `/v2/devices/${encodeURIComponent(deviceId)}/points`, json });
  }

  /** Extract a numeric value from a point, or null if absent. */
  static pointValue(point) {
    const value = point ? point.value : undefined;
    if (value === undefined || value === null || value === MyUplinkOAuth2Client.SENSOR_ABSENT) {
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

}

module.exports = MyUplinkOAuth2Client;
