# Who is the Imposter? / مين برا السالفة (Mafia)

Pass-the-phone party game for 3–15 players, in Arabic (RTL) and English. The phone deals secret roles and narrates the game.

- **Mafia** (4+ players): Mafia, Doctor (5+), Detective (6+), Citizens. From 6 players you can choose how many Mafia (up to 1 per 3 players). Night/day cycle with timer and voting.
- **Imposter** (3+ players): classic (imposter gets an optional hint: none, category, or category + first letter, and a last-chance guess if caught) or clueless (imposter gets a similar but different word and does not know).

Open `www/index.html` in a browser. `npm test` style checks: `node --test tests/logic.test.cjs`; full playthrough: `NODE_PATH=../node_modules node tests/e2e.cjs` (needs Playwright + Chromium).
Android packaging works the same way as `../mobile-game` (Capacitor, `webDir: www`).
