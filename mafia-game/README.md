# Who is the Imposter? / مين برا السالفة (Mafia)

Pass-the-phone party game for 3–15 players, in Arabic (RTL) and English. The phone deals secret roles and narrates the game.

- **Mafia** (4+ players): Mafia, Doctor (5+), Detective (6+), Citizens. From 6 players you can choose how many Mafia (up to 1 per 3 players). Night/day cycle with timer and voting.
- **Imposter** (3+ players): classic (imposter gets an optional hint: none, category, or category + first letter, and a last-chance guess if caught) or clueless (imposter gets a similar but different word and does not know).

Open `www/index.html` in a browser. `npm test` style checks: `node --test tests/logic.test.cjs`; full playthrough: `NODE_PATH=../node_modules node tests/e2e.cjs` (needs Playwright + Chromium).
Android packaging works the same way as `../mobile-game` (Capacitor, `webDir: www`).

## Android / Google Play
Same setup as `../mobile-game` (Capacitor 8, target SDK 36, min SDK 24, package `com.mo7mdsalah.imposter`, no permissions). Build locally with `npm ci && npm run build:debug`.
Release: add the four `ANDROID_*` repo secrets (you can reuse the same upload key as Star Dodge, or make a new one), then run the Actions workflow **Android release (Who is the Imposter)** and download the signed `.aab`. Store assets and bilingual listing text are in `store/`; follow the Play Console steps in `store/listing.md` and `../mobile-game/README.md`.
