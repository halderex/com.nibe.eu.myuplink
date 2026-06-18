# myUplink data points — Nibe S735-4 (live reference)

Captured live from a Nibe **S735-4 CU EM 3x400V** via `GET /v2/devices/{id}/points` on **2026-06-18** (language `en`). 83 points. Values are a single snapshot — treat them as examples, not constants. `scaleValue` is the raw→display factor the API already applies to `value`; `W` = writable (needs `WRITESYSTEM`).

> Regenerate: temporarily log `getPoints(id,{language:"en"})` from the device, run `homey app run`, capture the JSON. See git history of this file.

**Mapped** = the Homey capability this app currently derives from the point (see `drivers/heatpump/device.js`). Blank = not yet used.

| ID | Name | Unit | Type | W | Current | Range /step | Scale | Mapped capability | Enum values | smartHomeCategories |
|---|---|---|---|---|---|---|---|---|---|---|
| 4 | Current outdoor temperature (BT1) | °C | number |  | 21.9°C |  | 0.1 | measure_temperature.outdoor |  | sh-outdoorTemp |
| 8 | Supply line (BT2) | °C | number |  | 38.2°C |  | 0.1 | measure_temperature.supply |  | sh-supplyTemp |
| 10 | Return line (BT3) | °C | number |  | 30.5°C |  | 0.1 | measure_temperature.return |  | sh-returnTemp |
| 11 | Hot water top (BT7) | °C | number |  | 51.7°C |  | 0.1 |  |  | sh-hwTemp |
| 12 | Hot water charging (BT6) | °C | number |  | 28.5°C |  | 0.1 |  |  | sh-hwTemp |
| 15 | Condenser sensor supply line (BT12) | °C | number |  | 39.5°C |  | 0.1 |  |  | sh-supplyTemp |
| 16 | Discharge (BT14) | °C | number |  | 54°C |  | 0.1 |  |  |  |
| 17 | Liquid line (BT15) | °C | number |  | 30.4°C |  | 0.1 |  |  |  |
| 19 | Suction gas (BT17) | °C | number |  | 19.1°C |  | 0.1 |  |  |  |
| 22 | Frånluft (BT20) | °C | number |  | 25.2°C |  | 0.1 |  |  |  |
| 23 | Avluft (BT21) | °C | number |  | 8.4°C |  | 0.1 |  |  |  |
| 44 | Return line (BT62) | °C | number |  | -32768°C |  | 0.1 |  |  | sh-returnTemp |
| 54 | Average temperature (BT1) | °C | number |  | 15.4°C |  | 0.1 |  |  | sh-outdoorTemp |
| 58 | Flow sensor (BF1) | l/min | number |  | 3.8l/min |  | 0.1 |  |  |  |
| 64 | Current (BE3) | A | number |  | 3A |  | 0.1 |  |  |  |
| 65 | Current (BE2) | A | number |  | 1.2A |  | 0.1 |  |  |  |
| 66 | Current (BE1) | A | number |  | 2.9A |  | 0.1 |  |  |  |
| 94 | Low press (BP8) | bar | number |  | 4.5bar |  | 0.01 |  |  |  |
| 605 | Total op. time compr. cooling | h | number |  | 0h | 0–2147483647 /1 | 1 |  |  |  |
| 781 | Degree minutes | DM | number | ✓ | 100DM | -30000–30000 /20 | 0.1 |  |  |  |
| 1708 | Calculated supply climate system 1 | °C | number |  | 20.4°C |  | 0.1 | measure_temperature.calculated_supply |  | sh-supplyTemp |
| 1755 | Total run time additional heat | h | number | ✓ | 7.5h | 0–1000000 /1 | 0.1 |  |  |  |
| 1756 | Power internal additional heat | kW | number |  | 0kW |  | 0.01 | additional_heat_power |  |  |
| 1865 | Op. time el. add. heat for hot water | h | number |  | 1.7h | 0–9999999 /1 | 0.1 | add_heat_time_hotwater |  |  |
| 1959 | Compressor starter |  | number |  | 1789 | -2147483648–2147483647 /1 | 1 |  |  |  |
| 1961 | Total run time compressor | h | number |  | 4607h | -2147483648–2147483647 /1 | 1 |  |  |  |
| 1963 | Total run time compressor hot water | h | number |  | 1194h | -2147483648–2147483647 /1 | 1 |  |  |  |
| 1965 | Operating mode compressor |  | enum |  | On |  | 1 |  | 20=Off, 40=Starting, 60=On, 100=Stopping, 120=Defrosting, 140=Defrosting, 160=Defrosting |  |
| 1975 | Heating medium pump speed (GP1) | % | number |  | 1% |  | 1 | pump_speed |  |  |
| 3830 | Ventilation mode |  | enum | ✓ | Normal (64%) | 0–4 /1 | 1 | ventilation_mode (W) | 0=Normal (64%), 1=Hastighet 1 (0%), 2=Hastighet 2 (30%), 3=Hastighet 3 (80%), 4=Hastighet 4 (100%) |  |
| 4040 | Night cooling 1 |  | enum/bool | ✓ | On | 0–1 /1 | 1 |  | 0=Off, 1=On |  |
| 4041 | Start temperature night cooling 1 | °C | number | ✓ | 25°C | 20–30 /1 | 1 |  |  |  |
| 4564 | More hot water |  | enum | ✓ | Off |  | 1 |  | 0=Off, 2=One-time incr., 3=3 hours, 6=6 hours, 12=12 hours, 24=24 hours, 48=48 hours |  |
| 4789 | Activated (Smart Price Adaption) |  | number | ✓ | 1 | 0–1 /1 | 1 |  |  |  |
| 5927 | Current compressor frequency | Hz | number |  | 25Hz |  | 1 | compressor_frequency |  |  |
| 5952 | Exhaust air fan speed (GQ2) | % | number |  | 65% |  | 1 |  |  |  |
| 6994 | Hi press (BP9) | bar | number |  | 12.5bar |  | 0.01 |  |  |  |
| 7086 | More hot water |  | enum/bool | ✓ | Off |  | 1 | hot_water_boost (W) | 0=Off, 1=On | sh-hwBoost |
| 8080 | Total oper. time compr. heating | h | number |  | 3413h | -2147483648–2147483647 /1 | 1 |  |  |  |
| 8121 | Increased ventilation 1 |  | enum/bool | ✓ | Off |  | 1 | ventilation_boost (W) | 0=Off, 1=On | sh-ventBoost |
| 10613 | Activate SG Ready via API |  | number | ✓ | 0 | 0–1 /1 | 1 |  |  |  |
| 10894 | Hot water start (BT5) | °C | number |  | 46.8°C |  | 0.1 |  |  | sh-hwTemp |
| 10905 | Pump: Heating medium (GP1) |  | enum/bool |  | On |  | 1 |  | 0=Off, 1=On |  |
| 14950 | Operating priority (EB100-EP14) |  | enum |  | Hot water |  | 1 | (drives heating/hotwater split) | 0=Off, 1=Heating, 2=Cooling, 3=Hot water, 4=Pool, 5=Pool 2, 6=Preheating |  |
| 21006 | Diff. pr. airflow (BP15) | Pa | number |  | 14Pa |  | 0.1 |  |  |  |
| 22130 | Instantaneous used power | W | number |  | 368W | 0–9999999 /10 | 1 | measure_power (split) |  |  |
| 25133 | Produced energy - Heating (incl. additional heater) [kWh] | kWh | number |  | 0kWh |  | 0.01 |  |  |  |
| 25134 | Produced energy - Hot water (incl. additional heater) [kWh] | kWh | number |  | 0.16kWh |  | 0.01 |  |  |  |
| 25137 | Used energy - Heating (excl. additional heater) [kWh] | kWh | number |  | 0kWh |  | 0.01 |  |  |  |
| 25138 | Used energy - Hot water (excl. additional heater) [kWh] | kWh | number |  | 0.03kWh |  | 0.01 |  |  |  |
| 25141 | Used energy - Heating (only additional heater) [kWh] | kWh | number |  | 0kWh |  | 0.01 |  |  |  |
| 25142 | Used energy - Hot water (only additional heater) [kWh] | kWh | number |  | 0kWh |  | 0.01 |  |  |  |
| 25154 | Energy log - Produced energy for heating over the past hour | kWh | number |  | 0kWh |  | 0.01 |  |  |  |
| 25155 | Energy log - Produced energy for hot water over the past hour | kWh | number |  | 0.67kWh |  | 0.01 |  |  |  |
| 25158 | Energy log - Used energy for heating over the past hour | kWh | number |  | 0.03kWh |  | 0.01 |  |  |  |
| 25159 | Energy log - Used energy for hot water over the past hour | kWh | number |  | 0.16kWh |  | 0.01 |  |  |  |
| 25162 | Energy log - Used energy by additional heater for heating over the past hour | kWh | number |  | 0kWh |  | 0.01 |  |  |  |
| 25163 | Energy log - Used energy by additional heater for hot water over the past hour | kWh | number |  | 0kWh |  | 0.01 |  |  |  |
| 25165 | Energy log - Current power consumption | kW | number |  | 0.43kW |  | 0.01 |  |  |  |
| 26411 | Op. time el. add. heat for heating | h | number |  | 5.8h | 0–9999999 /1 | 0.1 | add_heat_time_heating |  |  |
| 26945 | Airflow (BP16) | m³/h | number |  | 145.2m³/h |  | 0.1 | airflow |  |  |
| 27233 | Rapid water heating |  | enum/bool | ✓ | Off |  | 1 |  | 0=Off, 1=On |  |
| 27335 | System power consumption | kW | number |  | 0.4kW |  | 0.01 |  |  |  |
| 27378 | Heating, compressor only | kWh | number |  | 6842.9kWh |  | 0.1 |  |  | sh-energyMetered |
| 27379 | Hot water, compressor only | kWh | number |  | 2582.3kWh |  | 0.1 |  |  | sh-energyMetered |
| 27382 | Heating, including int. add. heat | kWh | number |  | 6871.4kWh |  | 0.1 |  |  | sh-energyMetered |
| 27383 | Hot water, including int. add. heat | kWh | number |  | 2594.2kWh |  | 0.1 |  |  | sh-energyMetered |
| 28392 | Tot. production | kWh | number |  | 9266kWh |  | 0.1 |  |  |  |
| 28393 | Tot. consumption | kWh | number |  | 2813kWh |  | 0.1 | meter_power (anchor) |  |  |
| 29699 | Power demand at DOT | kW | number |  | 4.1kW |  | 0.1 |  |  |  |
| 29972 | Hot water amount | min | number |  | 13min |  | 1 | hotwater_amount |  |  |
| 30331 | id:30331 |  | number | ✓ | 0 |  | 1 |  |  |  |
| 30334 | id:30334 |  | number | ✓ | 0 |  | 1 |  |  |  |
| 30335 | id:30335 |  | number | ✓ | 0 |  | 1 |  |  |  |
| 30337 | Smart control |  | enum/bool | ✓ | On | 0–1 /1 | 1 |  | 0=Off, 1=On |  |
| 30338 | Hot water demand |  | enum | ✓ | Medium | 0–2 /1 | 1 |  | 0=Small, 1=Medium, 2=Large |  |
| 32628 | Hot water temperature | °C | number |  | 52°C |  | 0.1 | measure_temperature.hotwater |  |  |
| 33405 | id:33405 |  | enum/bool | ✓ | Off | 0–1 /1 | 1 |  | 0=Off, 1=On |  |
| 47751 | Rumsgivare börvärde: Klimatsystem 1 | °C | number | ✓ | 22°C | 50–350 /5 | 0.1 | target_temperature (W) |  | sh-indoorSpHeat |
| 48351 | Temperatur: Klimatsystem 1 | °C | number |  | 22.9°C |  | 0.1 | measure_temperature |  | sh-indoorTemp |
| 50660 | Temperatur: BT50 | °C | number |  | 22.9°C |  | 0.1 |  |  | sh-indoorTemp |
| 55000 | Priority |  | enum |  | Hot water |  | 1 | operating_priority | 10=Off, 20=Hot water, 25=Ext. hot water, 30=Heating, 40=Pool, 41=Pool 2, 50=Transfer, 60=Cooling |  |
| 56150 | All sub units operating prio |  | number |  | 0 |  | 1 |  |  |  |
