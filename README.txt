Bring your Nibe heat pump into Homey Energy and see exactly where your kilowatt-hours go.

This app connects to your Nibe heat pump through the myUplink cloud and adds it to Homey as two separate consumer devices — Heating and Hot water — so Homey Energy can track live power and cost for each category on its own. No extra hardware is needed; you simply sign in with your myUplink account during pairing.

What you get:

• Heating and Hot water as two devices, each with its own live power (W) and accumulated consumption (kWh), reconciled against the heat pump's own energy meter.
• Full cost breakdown in Homey Energy, including with dynamic electricity prices.
• Live readings: indoor, outdoor, supply, return and calculated supply temperatures, hot-water temperature, compressor frequency, pump speed, airflow, additional-heat power and run times, and the current operating priority.
• Control from Homey: indoor target temperature, hot-water boost, and (on supported pumps) ventilation boost and ventilation mode.
• A "Boost hot water" Flow action so you can heat extra water on a schedule or trigger.

Some controls require a myUplink Premium subscription on the pump.

Setup: pair the device in Homey and log in with your myUplink account. To change settings on the pump you must grant write access during login.

This app is not affiliated with, endorsed by, or supported by Nibe or myUplink.

---

More details: how the app splits heating and hot-water energy

A heat pump does not produce heating and hot water at the same time — it switches between them. Nibe pumps expose this as an operating priority value, updated in real time via the myUplink cloud. The app reads this value every minute alongside the pump's total live power draw.

The operating priority values are:

  0 — Off / standby
  1 — Heating
  2 — Cooling
  3 — Hot water
  4 — Pool
  6 — Pre-heating

When the priority is 3 (Hot water), the live power is attributed to the Hot water device. For every other priority — including Off/standby, where the ventilation fan, circulation pumps, and electronics still draw power — the power is attributed to the Heating device. This means the two shares always add up to exactly 100 % of what the pump actually consumed.

Every minute, each device's meter_power (kWh) grows by the power it was attributed over that interval, giving smooth, sub-kWh resolution. Every five minutes the app reads the pump's own cumulative energy counter (which only steps in whole kWh increments) and uses the accumulated power ratio from that window to split the real delta between the two devices. If the integration lagged — for example because electric additional heat appeared in the real counter but not in the live power reading — the five-minute anchor pulls the meter up to the correct total. The meter never decreases, so both devices stay monotonic and reconciled with the pump's billed total.

In practice: when the hot-water cylinder needs heating, the Hot water device in Homey Energy shows the pump's full power and its kWh counter grows. As soon as the cylinder is satisfied and the pump switches back to space heating, the Heating device takes over. Homey Energy can then report cost per category, combine with dynamic electricity prices, and power any Flow automation you build on top.
