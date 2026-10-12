# Who is the Imposter? / مين برا السالفة (Mafia)

Pass-the-phone party game for 3–15 players, in Arabic (RTL) and English. The phone deals secret roles and narrates the game.

- **Mafia** (4+ players): Mafia, Doctor (5+), Detective (6+), Citizens. Night/day cycle with discussion timer and voting.
- **Imposter** (3+ players): everyone gets a secret word from a category except the imposter(s). Discuss, vote, reveal.

Open `www/index.html` in a browser. `npm test` style checks: `node --test tests/logic.test.cjs`; full playthrough: `NODE_PATH=../node_modules node tests/e2e.cjs` (needs Playwright + Chromium).
Android packaging works the same way as `../mobile-game` (Capacitor, `webDir: www`).
