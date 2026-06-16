---
name: homey-cli
description: >-
  Operate the Homey smart-home hub from the command line via the Homey CLI
  (`homey api ...`). Use when the user wants to query or troubleshoot a Homey,
  especially Energy monitoring — live power draw, kWh reports, energy costs,
  dynamic electricity prices — through commands like `homey api energy
  get-live-report`, `get-report-day`, `get-reports-available`. Also covers the
  generic `homey api schema`, `homey api raw`, and `homey api diagnose` helpers
  for any of Homey's 40+ API managers (devices, flow, zones, insights, etc.).
---

# Homey CLI

Drive a real Homey (Pro / Bridge / Cloud) from the terminal. Every Homey API
manager is reachable through `homey api <manager> <operation>`; each operation
maps to an HTTP method + path. The CLI's strengths for an agent are **read-only
introspection** and **energy troubleshooting**.

> Scope of this skill: a worked **Energy-monitoring troubleshooting playbook**
> plus general orientation on `homey api`. For the full energy command catalog
> see [reference/energy-commands.md](reference/energy-commands.md); for the
> generic API surface (all managers, `schema`/`raw`/`diagnose`) see
> [reference/homey-api.md](reference/homey-api.md).

## Prerequisites — check these first

```bash
homey --version          # CLI installed? (developed against 4.3.0)
homey whoami             # logged in? else: homey login  (login is interactive)
homey list               # which Homeys are known; note id, platform, software
homey select current     # is a Homey already selected?
homey select --id <id>   # select non-interactively (bare `homey select` prompts)
```

A Homey MUST be selected before `homey api` works — or pass `--homey-id <id>`
to individual `homey api` calls. For automation prefer the non-interactive
forms above (`homey login` and a bare `homey select` both prompt); pick an id
from `homey list --json`. See [reference/homey-api.md](reference/homey-api.md)
for the full session/selection table.

`homey list` shows each Homey's `Platform` (`local` = Homey Pro / mini /
Self-Hosted; `cloud` = Homey Cloud) — some operations are cloud-only or
local-only. If a command later fails with a discovery/connection error, run
`homey api diagnose`.

## Mental model of `homey api`

- **manager → operation = method + path.** Example: `homey api energy
  get-live-report` performs `GET /live` on the Energy manager.
- **Discover, don't guess.** `homey api schema --manager energy` lists every
  operation with its method, path, required params, scopes, and platform.
- **Shared options on every operation:** `--json` (machine-readable output —
  use this when you'll parse the result), `--timeout <ms>`, `--homey-id <id>`
  (target a specific cached Homey instead of the selected one), and **token
  mode** (`--token` with `--address http://<ip>` or `--homey-id`) to hit a
  local Homey directly.
- **`--jq <expr>` requires the `jq` binary** to be installed and on PATH. It is
  often NOT present (e.g. on a fresh Windows box). If `--jq` returns
  `"The jq binary is required ..."`, drop `--jq`, use `--json`, and filter the
  output yourself — or install jq (Windows: `winget install jqlang.jq`;
  macOS: `brew install jq`; Linux: `apt install jq`).
- **Escape hatch:** `homey api raw -X <METHOD> --path /api/manager/<m>/<path>`
  for anything without a dedicated subcommand.

## Energy troubleshooting playbook

Read operations are safe to run freely. Work top-down:

**1. Confirm the Homey is reachable.**
```bash
homey api diagnose
```

**2. Read live power draw** (instantaneous watts per zone & device):
```bash
homey api energy get-live-report --json
```
Shape: `{ zoneName, totalConsumed{W,cost}, totalCumulative{W,cost},
totalGenerated{W,cost}, items[] }`. Each `items[]` entry is a `zone` or
`device` with `values{ W, cost }`.

Interpret the signals:
- **`W: null`** on a device → no power measurement reaching Homey (device
  offline, missing `measure_power`/metering capability, or not reporting).
- **`cost: null`** in the live report → no electricity price source configured
  yet. Live cost is often `null` even when historical reports have prices;
  confirm with the report + currency checks below before concluding it's broken.
- **`approximated`** on a device → the value is estimated, not metered.

Inspect a single zone or device:
```bash
homey api energy get-live-report --zone <zoneId> --json
```

**3. Confirm historical data exists** before asking for a report:
```bash
homey api energy get-reports-available        # lists availableDays / weeks / ...
```

**4. Pull a historical report.** `get-report-day` **requires `--date`**
(`YYYY-MM-DD`, pick one from step 3); week/month/year take the corresponding
period param:
```bash
homey api energy get-report-day --date 2026-06-15 --json
```
Shape: per-resource (`electricity`, and where present `gas`/`water`) totals
like `importedPeriod`, `exportedPeriod`, `generatedPeriod`, `consumedPeriod`,
battery/EV-charger fields, plus a `devices` breakdown grouped by
`imported`/`exported`/`generated`/`consumed`, each device carrying
`{ name, total, period, price }`. A populated `price` here confirms cost
tracking works even if the live report showed `cost: null`.

**5. Verify price/currency configuration** when costs look wrong or missing:
```bash
homey api energy get-currency                      # e.g. "SEK"
homey api energy get-electricity-price-type        # fixed vs dynamic
homey api energy get-option-electricity-price-fixed
homey api energy fetch-dynamic-electricity-prices  # current dynamic prices
```

## Safety: read vs. write

The commands above are all **read-only (GET)** and safe. The Energy manager
also exposes **state-changing** operations — they alter the user's Homey
configuration or delete data. **Always confirm with the user before running
any of these:**

- `set-*` / `unset-*` (e.g. `set-option-electricity-price-fixed`,
  `set-electricity-price-type`, `set-dynamic-prices-electricity-zone`,
  `set-dynamic-electricity-price-user-costs`) — change price settings.
- `reset-report-day-categories` — `PUT /report/day/reset/categories`.
- `delete-reports` — `DELETE /reports`, **destroys historical energy data**.

The full read/write split is in
[reference/energy-commands.md](reference/energy-commands.md).

## Beyond energy

The same patterns work for any manager — `devices`, `flow`, `zones`,
`insights`, `system`, etc. Start with `homey api schema --manager <name>` to
discover operations. See [reference/homey-api.md](reference/homey-api.md).
