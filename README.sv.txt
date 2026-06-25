Ta in din Nibe värmepump i Homey Energy och se exakt vart dina kilowattimmar tar vägen.

Appen ansluter till din Nibe värmepump via myUplink-molnet och lägger till den i Homey som två separata förbrukarenheter — Värme och Varmvatten — så att Homey Energy kan följa effekt och kostnad för varje kategori var för sig. Ingen extra hårdvara behövs; du loggar helt enkelt in med ditt myUplink-konto vid parkoppling.

Det här får du:

• Värme och Varmvatten som två enheter, var och en med egen aktuell effekt (W) och ackumulerad förbrukning (kWh), avstämd mot värmepumpens egen energimätare.
• Full kostnadsuppdelning i Homey Energy, även med dynamiska elpriser.
• Liveavläsningar: inomhus-, utomhus-, framlednings-, returlednings- och beräknad framledningstemperatur, varmvattentemperatur, kompressorfrekvens, pumphastighet, luftflöde, tillsatseffekt och drifttider samt aktuell prioritet.
• Styrning från Homey: inomhustemperatur (måltemperatur), varmvattenboost och (på pumpar som stöder det) ventilationsboost och ventilationsläge.
• En Flow-åtgärd "Boosta varmvatten" så att du kan värma extra varmvatten enligt schema eller utlösare.

Vissa funktioner kräver en myUplink Premium-prenumeration på pumpen.

Installation: parkoppla enheten i Homey och logga in med ditt myUplink-konto. För att kunna ändra inställningar på pumpen måste du ge skrivåtkomst vid inloggning.

Appen är inte ansluten till, godkänd av eller stödd av Nibe eller myUplink.

---

Mer om hur appen delar upp värme- och varmvattenenergi

En värmepump producerar inte värme och varmvatten samtidigt — den växlar mellan dem. Nibe-pumpar rapporterar detta som ett driftsprioritetsvärde som uppdateras i realtid via myUplink-molnet. Appen läser av detta värde varje minut tillsammans med pumpens totala aktuella effektuttag.

Driftsprioritetens värden är:

  0 — Av / standby
  1 — Uppvärmning
  2 — Kyla
  3 — Varmvatten
  4 — Pool
  6 — Förvärmning

När prioriteten är 3 (Varmvatten) tillskrivs den aktuella effekten Varmvattenenheten. För alla övriga prioriteter — inklusive Av/standby, där ventilationsfläkten, cirkulationspumparna och elektroniken fortfarande drar effekt — tillskrivs effekten Värmeenheten. Det innebär att de två andelarna alltid summerar till exakt 100 % av vad pumpen faktiskt förbrukade.

Varje minut växer respektive enhets meter_power (kWh) med den energi som tillskrivits den under intervallet, vilket ger mjuk upplösning under en kWh. Var femte minut läser appen pumpens egen kumulativa energimätare (som bara stegar i hela kWh) och använder den ackumulerade effektandelen från det fönstret för att fördela den verkliga ökningen mellan de två enheterna. Om integrationen halkat efter — till exempel för att eltillsatsen synts i den verkliga mätaren men inte i effektavläsningen — drar femminutersankaret upp mätaren till det korrekta totalet. Mätaren minskar aldrig, så båda enheterna förblir monotona och avstämda mot pumpens fakturerade totala förbrukning.

I praktiken: när varmvattencisternen behöver laddas visar Varmvattenenheten i Homey Energy pumpens fulla effekt och dess kWh-räknare ökar. Så snart cisternen är laddad och pumpen växlar tillbaka till rumsuppvärmning tar Värmeenheten över. Homey Energy kan sedan redovisa kostnad per kategori, kombinera med dynamiska elpriser och driva valfria Flow-automatiseringar som du bygger ovanpå.
