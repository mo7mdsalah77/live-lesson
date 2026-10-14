# مهرّج البالونات / Balloon Clowns

An original take on the classic arcade seesaw-clown game. One clown stands on a seesaw end; slide the seesaw under his falling partner so he lands on the *other* end and launches the standing clown into rows of drifting balloons. Gold balloons are worth 100, clearing a wave gives a bonus and speeds the next one up. Three lives. Arabic (default) and English.

Controls: drag anywhere / arrow keys to slide the seesaw, Esc to pause.
Run: open `www/index.html`. Tests: `node --test tests/logic.test.cjs`; bot playthrough: `NODE_PATH=../node_modules node tests/e2e.cjs`.
Android: same Capacitor packaging as `../mafia-game` (`webDir: www`).
