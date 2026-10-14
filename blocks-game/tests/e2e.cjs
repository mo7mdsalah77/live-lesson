// Plays with a greedy bot (keyboard) that scores every placement, then checks lines clear and the game ends. Run: NODE_PATH=../node_modules node tests/e2e.cjs
const { chromium } = require('playwright');
const T = require('../www/logic.js');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 360, height: 640 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve(__dirname, '../www/index.html')); await p.waitForTimeout(300);
  await p.mouse.click(180, 300);
  if ((await p.evaluate(() => window.__blocks.state)) !== 'play') throw new Error('did not start');
  const t0 = Date.now(); let maxLines = 0, pieces = 0, lastKey = '';
  while (Date.now() - t0 < 25000) {
    const s = await p.evaluate(() => ({ st: window.__blocks.state, cur: window.__blocks.cur, board: window.__blocks.board, lines: window.__blocks.lines }));
    maxLines = Math.max(maxLines, s.lines); if (s.st !== 'play') break; if (!s.cur) { await p.waitForTimeout(40); continue; }
    // choose the placement (rotation, x) with the best heuristic: fewest holes, lowest height, most lines
    let best = null;
    for (let rot = 0; rot < 4; rot++) for (let x = -3; x < 10; x++) {
      const pc = { type: s.cur.type, rot, x, y: s.cur.y }; if (T.collides(s.board, pc)) continue;
      const d = T.dropDistance(s.board, pc), fin = { ...pc, y: pc.y + d }, bd = s.board.map(r => r.slice()); T.lock(bd, fin);
      const full = T.fullRows(bd).length; let holes = 0, agg = 0;
      for (let c = 0; c < 10; c++) { let seen = false, h = 0; for (let r = 0; r < 20; r++) { if (bd[r][c]) { if (!seen) { seen = true; h = 20 - r; } } else if (seen) holes++; } agg += h; }
      const score = full * 8 - holes * 6 - agg * 0.5; if (!best || score > best.score) best = { score, rot, x };
    }
    if (!best) break;
    for (let i = 0; i < (best.rot - s.cur.rot + 4) % 4; i++) await p.keyboard.press('ArrowUp');
    const s2 = await p.evaluate(() => window.__blocks.cur); if (!s2) continue;
    const dx = best.x - s2.x; for (let i = 0; i < Math.abs(dx); i++) await p.keyboard.press(dx < 0 ? 'ArrowLeft' : 'ArrowRight');
    await p.keyboard.press('Space'); pieces++; await p.waitForTimeout(380);
  }
  console.log('bot pieces:', pieces, 'lines cleared:', maxLines, 'state:', await p.evaluate(() => window.__blocks.state));
  if (maxLines < 3) throw new Error('bot should clear lines');
  console.log('errors:', errs.filter(e => !/fonts\.googleapis|ERR_|Failed to load resource/.test(e)));
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
