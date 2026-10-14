# مكعبات / Blocks

The classic falling-blocks puzzle (original name and art). 10x20 board, 7 pieces from a shuffled bag, rotation with wall kicks, ghost piece, next-piece preview, soft and hard drop, 0.5 s lock delay, line-clear flash, scoring 100/300/500/800 x level, a new level every 10 lines. Arabic (default) and English.

Controls: on-screen buttons (left, rotate, right, soft drop, hard drop; hold left/right/down to repeat), tap the board to rotate. Keyboard: arrows, Up/X rotate, Z rotate back, Space hard drop, P pause.
Run: open `www/index.html`. Tests: `node --test tests/logic.test.cjs`; bot playthrough: `NODE_PATH=../node_modules node tests/e2e.cjs`.
Android: same Capacitor packaging as `../mafia-game` (`webDir: www`).

## Android APK (English + Arabic)
Package `com.mo7mdsalah.blocks`, no permissions, works offline. The app name and the game follow the phone language (Arabic or English) and the in-game button switches between them.
`.github/workflows/android-apk-blocks.yml` builds an installable debug APK on every push that touches `blocks-game/` and publishes it as a GitHub pre-release (`blocks-apk-<run>`). Download `blocks.apk` on the phone and allow "install unknown apps" for the browser. For Google Play use the signed-AAB flow in `../mafia-game/README.md`.
