# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Homey SDK 3 app (Node.js, platform: local) that integrates Nibe heat pumps via the myUplink cloud API. The app runs on Homey Pro and authenticates with myUplink using a per-user OAuth2 authorization-code flow, built on the [`homey-oauth2app`](https://github.com/athombv/node-homey-oauth2app) library.

## Homey CLI commands

```bash
homey app run        # Deploy and run on connected Homey (requires Homey CLI)
homey app build      # Build the app (outputs to .homeybuild/)
homey app validate   # Validate app.json and structure
homey app publish    # Publish to Homey App Store
```

Install the Homey CLI: `npm install -g homey`

## Credentials setup

Create `env.json` in the repo root with the credentials of a **dedicated** myUplink app
registration (dev.myuplink.com) — one created specifically for distribution, **not** tied to a
personal account:

```json
{
  "CLIENT_ID": "...",
  "CLIENT_SECRET": "..."
}
```

Homey injects `env.json` as `Homey.env`; `homey-oauth2app` reads `Homey.env.CLIENT_ID` /
`Homey.env.CLIENT_SECRET` to configure the OAuth2 client. The OAuth **scopes** are not secret and
live in code (`lib/MyUplinkOAuth2Client.js` → `static SCOPES`): `READSYSTEM`, `WRITESYSTEM`,
`offline_access`. `WRITESYSTEM` is required to change settings on the heat pump (target
temperature, hot-water / ventilation boost, etc.) via `PATCH /v2/devices/{id}/points`; drop it to
`READSYSTEM` only if the app should be read-only. Changing the scopes alters the consent screen, so
**existing users must re-pair** to obtain a write-capable token.

`env.json` is the single source of credentials for both local dev and the published build (it's
bundled into the app at publish time). It is gitignored, so the dedicated secret stays out of
source control while still shipping in the bundle — it must exist before `homey app build`/`publish`.

These are the **app's** confidential OAuth client credentials — they *drive* the per-user login,
they are not a user identity. myUplink requires a confidential client: the secret is sent on every
token exchange (as `client_secret_post` form params), so it must be embedded. PKCE (S256) is also
used as defense-in-depth, but does not remove the secret requirement (myUplink advertises no
secret-less client at its token endpoint).

**Why a dedicated registration:** the published app is distributed to every user's Homey Pro, so
the embedded secret is effectively public. Using a separate registration (not your personal/test
app) keeps the blast radius contained and lets you rotate it independently. The fixed
`callback.athom.com` redirect URI prevents a thief from redirecting authorization codes elsewhere.

**Required redirect URI**: in the dedicated app registration (dev.myuplink.com), add
`https://callback.athom.com/oauth2/callback/` to the allowed redirect URIs and grant the
`READSYSTEM` + `WRITESYSTEM` + `offline_access` scopes. Pairing fails without this.

### Publishing & secret handling

The secret ships **inside** the published bundle — there is no Athom-side secret vault. SDK3
apps run locally on each user's Homey Pro, so any runtime secret must be packaged with the app.
This works because **`.gitignore` ≠ `.homeyignore`**: `env.json` is gitignored (kept out of the
public repo) but, since it is *not* listed in `.homeyignore`, `homey app build` / `publish` copy
it into the bundle (verify with `ls .homeybuild/env.json`).

Consequences and rules:

- **Never add `env.json` to `.homeyignore`**, and make sure it exists with the dedicated
  credentials before `homey app publish` — otherwise the published app cannot authenticate.
- **Treat the embedded secret as compromised-by-design** (any user can extract it from their
  Homey or the store build). Containment, not concealment, is the strategy: dedicated registration
  + fixed `callback.athom.com` redirect URI + PKCE.
- **Rotate on abuse:** if myUplink flags the client, rotate the dedicated registration's secret,
  update `env.json`, and republish. Existing users keep working via their own stored tokens; only
  new pairings exercise the new secret.
- **Scopes are baked into the bundle** too (`lib/MyUplinkOAuth2Client.js`) — changing
  `READSYSTEM`/`WRITESYSTEM` later alters the consent screen and forces existing users to re-pair.

## Architecture

Per-user OAuth2 (authorization-code + PKCE) login, driven through Homey's pairing flow via
`homey-oauth2app`. The library owns token storage, refresh, and rotation (tokens live in its own
per-session store keyed by an `OAuth2SessionId`/`OAuth2ConfigId` on each device — not the device
store).

- **`app.js`** — `MyApp extends OAuth2App`. Sets `static OAUTH2_CLIENT = MyUplinkOAuth2Client`;
  the library auto-registers the OAuth2 config from the client's statics + `Homey.env` credentials.
  Registers the `boost_hot_water` Flow action listener. No API calls itself.
- **`env.json`** — bundled dedicated client credentials (`CLIENT_ID`/`CLIENT_SECRET`), gitignored.
- **`lib/MyUplinkOAuth2Client.js`** — `MyUplinkOAuth2Client extends OAuth2Client`, the shared API
  layer. Statics declare `API_URL`/`TOKEN_URL`/`AUTHORIZATION_URL`/`SCOPES`/`REDIRECT_URL`. Adds
  **PKCE S256** (not native to the library: `onHandleAuthorizationURL` injects the `code_challenge`,
  `onGetTokenByCode` sends the `code_verifier`) and the `User-Agent` header (defeats Cloudflare
  1010) on every request, including the token endpoint. Provides `getSystemsMe`, `getDevice`,
  `getPoints(id, {language, parameters})`, `setPoints`. Node's `fetch` + bundled CA store mean no
  custom SSL/CA bundle is needed (the Python runtime's missing CA store is no longer a concern).
- **`drivers/heatpump/driver.js`** — `NibeDriver extends OAuth2Driver`. Pairing/repair are driven
  by the library's built-in `login_oauth2` flow (see `driver.compose.json` pair views).
  `onPairListDevices({ oAuth2Client })` lists the user's devices from `systems/me`.
- **`drivers/heatpump/device.js`** — `NibeDevice extends OAuth2Device`. `onOAuth2Init` polls
  `/points` every 5 min, maps parameter IDs to capabilities (`POINT_MAP`, with per-point kind/scale
  for both read and write), and pushes capability changes back via `setPoints` (using
  `this.oAuth2Client`; the library handles token refresh/rotation transparently). A second 1-min
  poll (`FAST_POLL_INTERVAL_MS`) splits live power (22130) across `measure_power.heating` /
  `measure_power.hotwater` by the pump's operating priority (14950), for cost attribution within
  short spot-tariff windows. Writable controls (target temperature, hot-water/ventilation boost,
  ventilation mode) plus the `boost_hot_water` Flow action need a `WRITESYSTEM` token; a 403
  surfaces a "re-pair" (or Premium) warning.

See `docs/myuplink-api-responses.md` for OAuth endpoints and the points/capability mapping.

## API reference

- **Swagger**: https://api.myuplink.com/swagger/index.html — authoritative reference for all endpoints, request/response schemas, and auth requirements. Consult before planning any API work.
- **Developer docs**: https://dev.myuplink.com/documentation — conceptual documentation, auth flows, and guides.
- **Observed responses**: `docs/myuplink-api-responses.md` — live-captured payloads from a Nibe S735-4, useful for quick field lookups without a network call.

## App metadata

`app.json` is **generated** — do not edit it directly. Edit `.homeycompose/app.json` instead and run `homey app build` to regenerate.

Localization strings go in `locales/en.json`. Version history is tracked in `.homeychangelog.json`.
