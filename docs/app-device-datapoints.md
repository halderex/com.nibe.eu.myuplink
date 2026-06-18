# App device datapoints

What each paired Homey device currently exposes, derived from `ROLES` and `POINT_MAP` in
[`drivers/heatpump/device.js`](../drivers/heatpump/device.js). Each pump pairs as **two devices**
distinguished by `data.role`. Keep this file in sync whenever `ROLES` / `POINT_MAP` change (see the
note in `CLAUDE.md`). For the full list of *available* myUplink points (mapped or not), see
[`myuplink-datapoints.md`](myuplink-datapoints.md).

**Derived** = computed in code, not a 1:1 `POINT_MAP` read:
- `measure_power` — live power 22130, attributed to the role by operating priority 14950
  (hot water = priority 3; heating = everything else, incl. idle/standby base load).
- `meter_power` — grown smoothly by integrating that power each minute, anchored to the real
  cumulative meter 28393 (3 decimals).

**Premium** = only added when the device's `availableFeatures` flag allows it (writes need a
`WRITESYSTEM` token); otherwise the capability is pruned at init.

## 🔥 Heating device (class `heatpump`, icon `assets/heating.svg`)

Listed in device-page (gauge) order — see the `capabilities` array order in
`driver.compose.json`. (Read-only sensors render in this order; interactive controls render in a
separate area.)

| Capability | Param | Title (en / sv) | Unit | Writable | Notes |
|---|---|---|---|---|---|
| `measure_temperature` | 48351 | Indoor / Inomhus | °C | | Climate system 1 |
| `target_temperature` | 47751 | Indoor / Måltemperatur | °C | ✓ | room setpoint (control) |
| `operating_priority` | 55000 | Priority / Prioritet | enum | | custom, info |
| `compressor_frequency` | 5927 | Compressor frequency / Kompressorfrekvens | Hz | | custom, info |
| `measure_temperature.supply` | 8 | Supply / Framledning | °C | | BT2 |
| `measure_temperature.return` | 10 | Return / Returledning | °C | | BT3 |
| `measure_temperature.calculated_supply` | 1708 | Calculated supply / Beräknad framledning | °C | | |
| `measure_temperature.outdoor` | 4 | Outdoor / Utomhus | °C | | BT1 |
| `pump_speed` | 1975 | Pump speed / Pumphastighet | % | | custom, info (GP1) |
| `airflow` | 26945 | Airflow / Luftflöde | m³/h | | custom, info (BP16) |
| `measure_power` | 22130 + 14950 | — | W | | derived (non-hot-water power) |
| `meter_power` | 28393 / 22130 | Consumption / Förbrukning | kWh | | derived, 3 decimals |
| `additional_heat_power` | 1756 | Additional heat power / Tillsatseffekt | kW | | custom, info |
| `add_heat_time_heating` | 26411 | Add. heat time (heating) / Tillsats drifttid (värme) | h | | custom, info |
| `ventilation_boost` | 8121 | (capability) | | ✓ | **Premium** |
| `ventilation_mode` | 3830 | (capability) | | ✓ | **Premium** |

## 💧 Hot-water device (class `boiler`, icon `assets/hotwater.svg`)

| Capability | Param | Title (en / sv) | Unit | Writable | Notes |
|---|---|---|---|---|---|
| `measure_temperature.hotwater` | 32628 | Hot water / Varmvatten | °C | | |
| `hotwater_amount` | 29972 | Hot water amount / Varmvattenmängd | min | | custom, info |
| `measure_power` | 22130 + 14950 | — | W | | derived (priority 3 power) |
| `meter_power` | 28393 / 22130 | Consumption / Förbrukning | kWh | | derived, 3 decimals |
| `add_heat_time_hotwater` | 1865 | Add. heat time (hot water) / Tillsats drifttid (varmvatten) | h | | custom, info |
| `hot_water_boost` | 7086 | (capability) | | ✓ | **Premium** |

Plus the **Boost hot water** Flow action (param 4564) — filtered to devices with `hot_water_boost`,
i.e. the hot-water device.
