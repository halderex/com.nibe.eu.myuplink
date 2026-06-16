# `homey api` — generic reference

`homey api` talks to a Homey's local/cloud API. A Homey must be selected
(`homey select`) or targeted with `--homey-id`. The CLI groups operations by
**manager**; each operation is an HTTP method + path.

## Session & Homey selection

Top-level commands (outside `homey api`) that set up who you are and which
Homey commands act on:

| Command | Purpose | Notes |
|---|---|---|
| `homey login` | Log in with an Athom account | Opens an OAuth dialog in the browser — interactive |
| `homey logout` | Log out the current user | |
| `homey whoami` | Show the logged-in user | `--json`, `--jq` (e.g. `homey whoami --jq '.email'`) |
| `homey list` | List all known Homeys | `--json`, `--jq` (e.g. `homey list --jq '.[].name'`). Columns: id, name, platform (local/cloud), platform & software version, API version, language, role, region |
| `homey select` | Select the active Homey | **Interactive** when bare. Non-interactive: `homey select --id <HOMEY_ID>` or `homey select --name <NAME>` |
| `homey select current` | Show the currently selected Homey | `homey select current --json` |
| `homey unselect` | Unselect the active Homey | |

For an agent/script, prefer the **non-interactive** forms: pick an id from
`homey list --json`, then `homey select --id <id>` (or pass `--homey-id <id>`
to individual `homey api` calls without selecting at all). Avoid bare
`homey login` / `homey select` in automation — they prompt.

## Helpers

### `homey api schema` — discover operations
```bash
homey api schema                              # human-readable overview of all managers
homey api schema --manager energy             # one manager's operations
homey api schema --operation get-live-report  # find a specific operation
homey api schema --json                        # machine-readable (full tree)
homey api schema --json --jq '.managers | keys'   # needs the jq binary on PATH
```
Output columns: Operation, Method, Path, Required Params, Scopes, Platform
(`cloud` = Homey Cloud; `local` = Homey Pro / mini / Self-Hosted Server;
`both`). The JSON tree is `{"managers": {"ManagerXxx": {id, idCamelCase,
items, operations, availability}}}`, where each operation has `method`, `path`,
`requiredParams`, `scopes`, `platform`.

### `homey api raw` — arbitrary request (escape hatch)
```bash
# GET
homey api raw --path /api/manager/system/ --json

# POST with inline JSON body
homey api raw -X POST --path /api/manager/flow/flow --body '{"name":"Test"}'

# Body from a file
homey api raw -X POST --path /api/manager/flow/flow --body @body.json
```
Options: `-X/--method` (default `GET`), `--path` (required, absolute API path),
`-H/--header name:value` (repeatable), `--body` (JSON string or `@file`),
`--request-json` (default true), `--include` (status line + response headers),
`--verbose` (request diagnostics to stderr), plus the shared options below.

### `homey api diagnose` — connectivity
```bash
homey api diagnose                 # check discovery strategies for selected Homey
homey api diagnose --homey-id <id> --json
```
Use when a command fails to reach the Homey (LAN vs cloud discovery, mDNS, etc.).

## Shared options (on raw + every manager operation)

| Option | Meaning |
|---|---|
| `--json` | Raw JSON output — use when parsing the result |
| `--jq <expr>` | Filter JSON with jq. **Requires the `jq` binary on PATH**; if absent it errors — drop it and parse `--json` instead, or install jq (Windows: `winget install jqlang.jq`; macOS: `brew install jq`; Debian/Ubuntu: `apt install jq`). After a winget install, **restart the terminal** — winget puts `jq.exe` under `%LOCALAPPDATA%\Microsoft\WinGet\Links` and adds that dir to the user PATH, which only new shells inherit |
| `--timeout <ms>` | Request timeout (default 30000) |
| `--homey-id <id>` | Target a specific cached Homey instead of the selected one |
| `--token` | Token mode: connect directly, requires `--address` or `--homey-id` |
| `--address http://<ip>` | Base URL of a local Homey for token mode |

## Managers

Every manager is `homey api <manager>` and supports its own `schema`
subcommand. Discover operations with `homey api schema --manager <name>`.

```
alarms        api           apps          arp           backup
ble           clock         cloud         coprocessor   cron
dashboards    database      devices       devkit        discovery
drivers       energy        energydongle  experiments   flow
flowtoken     geolocation   google-assistant            i18n
icons         images        insights      ledring       logic
matter        mobile        moods         notifications presence
rf            safety        satellites    security      sessions
system        thread        updates       users         vdevice
videos        weather       webserver     zigbee        zones
zwave
```

Energy-related: **`energy`** (live + reports + prices, see
[energy-commands.md](energy-commands.md)) and **`energydongle`** (Homey Energy
Dongle — e.g. `get-option-phase-load-notification-settings`).

Commonly useful for troubleshooting context:
- `devices` — list/inspect devices and their capabilities (e.g. which expose
  `measure_power` / metering).
- `zones` — zone tree (zone ids referenced by the energy live report).
- `insights` — historical logs/metrics per capability.
- `system` — Homey software/state info.
- `flow` — flows and flow cards.

## Path mapping

CLI operation names are kebab-case; the underlying path is shown by `schema`
and in each command's `--help` (e.g. `homey api energy get-live-report` →
`GET /live`, served under the Energy manager). For managers without a
convenient subcommand, use `homey api raw --path /api/manager/<manager>/<path>`.
