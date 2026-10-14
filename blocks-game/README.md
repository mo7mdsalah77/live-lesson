# مكعبات / Blocks

The classic falling-blocks puzzle (original name and art). 10x20 board, 7 pieces from a shuffled bag, rotation with wall kicks, ghost piece, next-piece preview, soft and hard drop, 0.5 s lock delay, line-clear flash, scoring 100/300/500/800 x level, a new level every 10 lines. Arabic (default) and English.

Controls: on-screen buttons (left, rotate, right, soft drop, hard drop; hold left/right/down to repeat), tap the board to rotate. Keyboard: arrows, Up/X rotate, Z rotate back, Space hard drop, P pause.
Run: open `www/index.html`. Tests: `node --test tests/logic.test.cjs`; bot playthrough: `NODE_PATH=../node_modules node tests/e2e.cjs`.
Android: same Capacitor packaging as `../mafia-game` (`webDir: www`).
