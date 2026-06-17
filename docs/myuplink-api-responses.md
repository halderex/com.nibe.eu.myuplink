# myUplink API — Observed Response Shapes

Captured from live calls against a Nibe S735-4 CU EM (serial 06612625239015),
firmware 4.11.5, on 2026-06-13.

---

## OAuth2 endpoints (IdentityServer)

The OIDC discovery document (`/.well-known/openid-configuration`) advertises `/connect/*`
endpoints, but **only the `/oauth/*` paths are live** on the public API:

- Authorize: `GET https://api.myuplink.com/oauth/authorize` (302 redirect to login)
- Token: `POST https://api.myuplink.com/oauth/token` (`/connect/token` returns 404)
- Scopes: `READSYSTEM`, `WRITESYSTEM`, `offline_access` (the last is required for a refresh token)
- Grants in use: `authorization_code` (per-user pairing), `refresh_token`, `client_credentials`
- Token response: `access_token`, `refresh_token`, `expires_in` (3600), `token_type` (Bearer), `scope`

Pairing uses the **authorization-code** flow via Homey's cloud callback. The redirect URI is
fixed to `https://callback.athom.com/oauth2/callback/` and **must be registered** as an
allowed redirect URI in the app at dev.myuplink.com.

**Confidential client + PKCE** (from `/.well-known/openid-configuration`):
- `token_endpoint_auth_methods_supported`: `client_secret_basic`, `client_secret_post` — **no
  `none`**, so myUplink does not support public/secret-less clients. The client secret is
  required (HTTP Basic) on every token exchange; it must be embedded in the published app.
- `code_challenge_methods_supported`: `plain`, `S256` — PKCE is supported. The app sends an
  `S256` `code_challenge` on authorize and the `code_verifier` on exchange as defense-in-depth,
  **in addition to** the Basic secret (myUplink accepts both together). PKCE does not remove the
  secret requirement.

---

## GET /v2/ping

Returns an empty body with HTTP 200. Used as a connectivity check.

---

## GET /v2/systems/me

```json
{
  "page": 1,
  "itemsPerPage": 10,
  "numItems": 1,
  "systems": [
    {
      "systemId": "19057b36-e8ba-42c0-b877-c2bc132d2b74",
      "name": "Norra Häcksjöbäcksvägen 5A",
      "securityLevel": "admin",
      "hasAlarm": false,
      "country": "Sweden",
      "devices": [
        {
          "id": "U252232209908a653-88ba-4e39-b2db-117bbd4cefad",
          "connectionState": "Connected",
          "currentFwVersion": "4.11.5",
          "deviceType": "nibe-n",
          "product": {
            "serialNumber": "06612625239015",
            "name": "S735-4 CU EM 3x400V"
          }
        }
      ]
    }
  ]
}
```

**Key fields used by the app:**
- `systems[].devices[].id` — device ID passed to subsequent calls
- `systems[].devices[].product.name` — human-readable model name

---

## GET /v2/devices/{deviceId}

```json
{
  "id": "U252232209908a653-88ba-4e39-b2db-117bbd4cefad",
  "connectionState": "Connected",
  "firmware": {
    "currentFwVersion": "4.11.5",
    "desiredFwVersion": "4.11.5"
  },
  "product": {
    "serialNumber": "06612625239015",
    "name": "S735-4 CU EM 3x400V"
  },
  "availableFeatures": {
    "settings": true,
    "reboot": true,
    "forcesync": true,
    "forceUpdate": true,
    "requestUpdate": false,
    "resetAlarm": true,
    "triggerEvent": true,
    "getMenu": true,
    "getMenuChain": true,
    "getGuideQuestion": true,
    "sendHaystack": true,
    "setSmartMode": true,
    "setAidMode": true,
    "getZones": true,
    "processIntent": true,
    "boostHotWater": false,
    "boostVentilation": false,
    "getScheduleConfig": true,
    "getScheduleModes": true,
    "getScheduleWeekly": true,
    "getScheduleVacation": true,
    "setScheduleModes": true,
    "setScheduleWeekly": true,
    "setScheduleOverride": true,
    "setScheduleVacation": true,
    "setVentilationMode": false
  }
}
```

**Key fields:**
- `product.name` / `product.serialNumber` — device identity
- `connectionState` — `"Connected"` or `"Disconnected"`
- `firmware.currentFwVersion` — running firmware
- `availableFeatures` — gates which API operations are supported for this device

---

## GET /v2/devices/{deviceId}/points

Returns an array of ~83 data points. Optional `?parameters=4,8,32628` filters by id.

```json
[
  {
    "category": "S735-4 CU EM 3x400V",
    "parameterId": "4",
    "parameterName": "Current outdoor temperature (BT1)",
    "parameterUnit": "°C",
    "writable": false,
    "timestamp": "2026-06-14T14:07:41+02:00",
    "value": 18.2,
    "strVal": "18.2°C",
    "smartHomeCategories": ["sh-outdoorTemp"],
    "minValue": null,
    "maxValue": null,
    "stepValue": 1.0,
    "enumValues": [],
    "scaleValue": "0.1",
    "zoneId": null
  }
]
```

**Notes:**
- `value` is a JSON **number already scaled to real units** (18.2 °C) — no client scaling needed.
- The unit is `parameterUnit` (not `unit`).
- Absent sensors report the sentinel `-32768`; treat as no value.
- `writable: true` points can be set via `PATCH /v2/devices/{id}/points` (`MyUplinkOAuth2Client.setPoints`,
  requires a `WRITESYSTEM` token). Body is a JSON object mapping parameterId → the **real/display**
  value, i.e. the same scale as GET `value` (e.g. `{"47751": 22}` for 22 °C, `{"7086": 1}` for on).
  The write endpoint validates against the *real* range, so sending the raw register value (220)
  is rejected with `400 … value outside of a valid min-max range`. Note `minValue`/`maxValue`/
  `stepValue` in the GET response are **raw** (e.g. 50/350/5 for 47751) — multiply by `scaleValue`
  (0.1) to get the real bounds (5/35/0.5) used for clamping.

**Parameter IDs mapped to Homey capabilities** (`drivers/heatpump/device.js` `POINT_MAP`):

| parameterId | Name | Unit | Capability |
|---|---|---|---|
| 4 | Current outdoor temperature (BT1) | °C | `measure_temperature.outdoor` |
| 32628 | Hot water temperature | °C | `measure_temperature.hotwater` |
| 8 | Supply line (BT2) | °C | `measure_temperature.supply` |
| 22130 | Instantaneous used power | W | `measure_power` (split per category — see below) |
| 28393 | Tot. consumption | kWh | `meter_power` (split per category — see below) |

**Per-category split into two devices** (`measure_power` / `meter_power` on each of the Heating
and Hot-water devices): the pump exposes only a single live power reading (**22130**) and a single
real cumulative meter (**28393**, kWh) — no per-category breakdown. Each pump is paired as **two
Homey consumer devices** (`data.role` = `heating` / `hotwater`) so Homey Energy can cost them
separately; `device.js` derives each device's energy from the operating priority **14950**
(`{0=Off, 1=Heating, 2=Cooling, 3=Hot water, 4=Pool, 5=Pool 2, 6=Pre-heating}`): hot water counts
priority = 3, and **heating counts everything else** — heating/pre-heating *and* Off/standby. The
heating role is deliberately the complement of hot water so the two always sum to 100%: the
pump's continuous base load (the S735's exhaust-air ventilation fan, circulation pumps and
electronics run even at priority Off) is attributed to heating rather than dropped.

- **Live power** (`measure_power`): a 1-minute poll (`FAST_POLL_INTERVAL_MS`, fetched via
  `?parameters=22130,14950`) sets each device's `measure_power` to 22130 when the pump is serving
  that device's category, else 0. It also integrates 22130 over elapsed time into per-window
  accumulators (total vs this category).
- **Energy** (`meter_power`): grown **smoothly** by the 1-minute poll — each interval adds the
  category's integrated power (`power × dt`) in kWh, giving sub-kWh resolution. The real meter
  **28393 only steps in whole kWh**, so relying on its delta alone produced useless 1 kWh
  stairsteps; instead the 5-minute poll uses 28393 as an **anchor**: it attributes 28393's
  increase to the device's category (power-weighted share — heating is the complement of hot
  water, so the two shares sum to 1 and cover the pump's full consumption incl. idle/standby) into
  a `trueKwh` total, and pulls `meter_power` *up* to it if the power integration lagged (e.g.
  electric additional heat that shows in 28393 but not in 22130). It never decreases, so
  `meter_power` stays monotonic and reconciled with the pump's billed total. `meterKwh`, `trueKwh`
  and the last 28393 reading are persisted to the device store across restarts. The flat
  per-category kWh counters (25137/25138) refresh only every ~20–30 min and are too coarse to use.
