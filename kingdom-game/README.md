# Realm Rush – kingdom strategy game (original, offline)

A mobile-style kingdom builder in the spirit of Kingshot / Whiteout Survival, with its own name, art and rules. English + Arabic (RTL).

- **City:** build and upgrade the Town Hall, Farm, Sawmill, Quarry, Gold Mine, Warehouse and Barracks. One builder queue, real-time timers, offline progress (up to 8 h), storage caps, optional gold "rush" to finish a job now.
- **Army:** train Infantry, Archers and Cavalry at the Barracks. Rock-paper-scissors counters: Infantry > Cavalry > Archers > Infantry.
- **Map:** 30 enemy camps of rising strength. Battles are simulated; 40% of fallen troops are healed; first clears give full rewards, replays 40%.
- **Heroes:** three heroes unlock with the Town Hall and give attack bonuses to their troop type.
- Progress saves automatically on the device. No ads, no network.

Run: open `www/index.html`. Tests: `node --test tests/logic.test.cjs`; full playthrough: `NODE_PATH=../node_modules node tests/e2e.cjs` (Playwright + Chromium).
Not included (needs a server): real-time alliances and PvP against other players.
Android packaging: same Capacitor setup as `../mafia-game` (`webDir: www`).
