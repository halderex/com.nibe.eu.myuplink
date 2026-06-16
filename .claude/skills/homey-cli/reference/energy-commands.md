# `homey api energy` — command reference

Complete catalog of the Energy manager, captured from `homey api energy --help`
and `homey api energy schema`. CLI name → HTTP method + path. All commands
accept the shared options (`--json`, `--timeout`, `--homey-id`, token mode,
`--jq` if the `jq` binary is installed); only operation-specific params are
listed below.

Run `homey api energy schema` for the authoritative, always-current table on a
given Homey.

## Read operations (safe — GET)

Scope: `homey.energy.readonly` (except `get-state`, which is
`homey.system.readonly`).

| CLI command | Method + path | Params | Platform |
|---|---|---|---|
| `get-live-report` | `GET /live` | `--zone <zoneId>` (optional) | both |
| `get-state` | `GET /state` | — | both |
| `get-report-day` | `GET /report/day` | `--date YYYY-MM-DD` **(required)**, `--cache` | both |
| `get-report-week` | `GET /report/week` | period param, `--cache` | both |
| `get-report-month` | `GET /report/month` | period param, `--cache` | both |
| `get-report-year` | `GET /report/year` | period param, `--cache` | both |
| `get-reports-available` | `GET /reports/available` | — | both |
| `get-currency` | `GET /currency` | — | both |
| `get-electricity-price-type` | `GET /price/electricity/type` | — | both |
| `get-option-electricity-price-fixed` | `GET /option/electricityPriceFixed` | — | both |
| `get-option-gas-price-fixed` | `GET /option/gasPriceFixed` | — | both |
| `get-option-water-price-fixed` | `GET /option/waterPriceFixed` | — | both |
| `get-option-electricity-price-dynamic-preferred-interval` | `GET /option/electricityPriceDynamicPreferredInterval` | — | cloud |
| `fetch-dynamic-electricity-prices` | `GET /price/electricity/dynamic` | — | both |
| `get-dynamic-electricity-price-user-costs` | `GET /price/electricity/dynamic/user-costs` | — | both |
| `get-dynamic-prices-electricity-zones` | `GET /price/electricity/dynamic/zones` | — | both |
| `get-dynamic-prices-electricity-zone` | `GET /price/electricity/dynamic/zone` | — | both |

> Note: `get-report-day` always needs `--date`. Pick a date from
> `get-reports-available` (`availableDays`). Run `homey api energy
> get-report-day --help` to see the exact period param names for week/month/year.

## Write / destructive operations — confirm with the user first

Scope: `homey.energy`. These change the user's Homey configuration or delete
data. **Do not run without explicit confirmation.**

| CLI command | Method + path | Effect |
|---|---|---|
| `set-option-electricity-price-fixed` | `PUT /option/electricityPriceFixed` | Set fixed electricity price |
| `unset-option-electricity-price-fixed` | `DELETE /option/electricityPriceFixed` | Clear fixed electricity price |
| `set-option-gas-price-fixed` | `PUT /option/gasPriceFixed` | Set fixed gas price |
| `unset-option-gas-price-fixed` | `DELETE /option/gasPriceFixed` | Clear fixed gas price |
| `set-option-water-price-fixed` | `PUT /option/waterPriceFixed` | Set fixed water price |
| `unset-option-water-price-fixed` | `DELETE /option/waterPriceFixed` | Clear fixed water price |
| `set-option-electricity-price-dynamic-preferred-interval` | `PUT /option/electricityPriceDynamicPreferredInterval` | Set dynamic price interval (cloud) |
| `unset-option-electricity-price-dynamic-preferred-interval` | `DELETE /option/electricityPriceDynamicPreferredInterval` | Clear dynamic price interval (cloud) |
| `set-electricity-price-type` | `PUT /price/electricity/:type` | Switch fixed ↔ dynamic pricing |
| `set-dynamic-electricity-price-user-costs` | `PUT /price/electricity/dynamic/user-costs` | Set user surcharges/costs |
| `unset-dynamic-electricity-price-user-costs` | `DELETE /price/electricity/dynamic/user-costs` | Clear user surcharges/costs |
| `set-dynamic-prices-electricity-zone` | `PUT /price/electricity/dynamic/zone` | Set the dynamic-price bidding zone |
| `reset-report-day-categories` | `PUT /report/day/reset/categories` | Reset day-report category data |
| `delete-reports` | `DELETE /reports` | **Permanently deletes historical energy reports** |

## Output shapes

### `get-live-report` (`GET /live`) — instantaneous power
```jsonc
{
  "zoneId": "be81a9c4-...",
  "zoneName": "Hemma",
  "zoneIcon": "home",
  "totalConsumed":   { "W": 1.4,  "cost": null },
  "totalCumulative": { "W": 2230, "cost": null },
  "totalGenerated":  { "W": null, "cost": null },
  "items": [
    { "type": "zone",   "id": "...", "name": "Bil", "icon": "carport",
      "values": { "W": 0, "cost": null } },
    { "type": "device", "id": "...", "name": "Homey Bridge",
      "iconObj": { "id": "...", "url": "/api/icon/..." }, "color": "#333333",
      "values": { "W": 1.4 }, "approximated": null }
  ]
}
```
- `W` is live watts; `cost` is live cost/hour (often `null` until a price
  source is configured).
- `W: null` → no live measurement for that device.
- `approximated` (on devices) → estimated rather than metered.

### `get-report-day` (`GET /report/day`) — historical kWh + cost
```jsonc
{
  "id": "2aa9a263-...",
  "electricity": {
    "importedPeriod": 25.99,        // kWh imported in the period
    "exportedPeriod": null,
    "generatedPeriod": null,
    "consumedPeriod": 5.89,
    "batteryChargedPeriod": null,
    "batteryDischargedPeriod": null,
    "evChargerChargedPeriod": 0,
    "evChargerDischargedPeriod": null,
    "devices": {
      "imported": {
        "85543ced-...": { "name": "Total effekt", "total": 39928.18,
                          "period": 25.99, "price": 22.196275 }
      },
      "exported": { /* per-device, may be null */ },
      "generated": {},
      "consumed": {
        "97216b9f-...": { "name": "Torktumlare", "total": 5.43,
                          "period": 0.74, "price": 1.025052 }
      }
    }
  }
  // plus "gas" / "water" blocks where applicable
}
```
- Per device: `total` (lifetime), `period` (this report window), `price`
  (cost in the Homey's currency). A populated `price` confirms cost tracking
  works even when the live report shows `cost: null`.
- `get-currency` returns the currency these prices are in (e.g. `SEK`).

### `get-reports-available` (`GET /reports/available`)
```jsonc
{ "availableDays": ["2026-05-16", "2026-05-17", ...] /* + weeks/months/years */ }
```
Use a value from `availableDays` as the `--date` for `get-report-day`.
