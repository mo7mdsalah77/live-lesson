// Plays with a simple bot that tracks the falling clown's landing spot. Run: NODE_PATH=../node_modules node tests/e2e.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 360, height: 640 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve(__dirname, '../www/index.html')); await p.waitForTimeout(300);
  await p.mouse.click(180, 320);
  if ((await p.evaluate(() => window.__clown.state)) !== 'play') throw new Error('did not start');
  // Bot: put the correct end of the seesaw under the clown. Stand side L -> clown must land on right end (seesawX + 50).
  const t0 = Date.now(); let maxScore = 0;
  while (Date.now() - t0 < 25000) {
    const s = await p.evaluate(() => ({ f: window.__clown.flyer && { x: window.__clown.flyer.x, vx: window.__clown.flyer.vx, vy: window.__clown.flyer.vy, y: window.__clown.flyer.y }, st: window.__clown.stand, score: window.__clown.score, state: window.__clown.state }));
    maxScore = Math.max(maxScore, s.score); if (s.state !== 'play') break;
    if (s.f) {
      const tFall = s.f.vy > 0 ? Math.max(0, (544 - s.f.y) / Math.max(s.f.vy, 200)) : 0.6;   // rough time to the board
      const landX = s.f.x + s.f.vx * Math.min(tFall, 0.6), cx = s.st === 'L' ? landX - 50 : landX + 50;
      await p.mouse.move(Math.max(66, Math.min(294, cx)), 600);
    }
    await p.waitForTimeout(30);
  }
  console.log('bot score:', maxScore, 'state:', await p.evaluate(() => window.__clown.state));
  if (maxScore < 30) throw new Error('bot should pop balloons');
  console.log('errors:', errs.filter(e => !/fonts\.googleapis|ERR_|Failed to load resource/.test(e)));
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
