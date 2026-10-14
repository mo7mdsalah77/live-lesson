// Bot keeps the ruler under the ball. Run: NODE_PATH=../node_modules node tests/e2e.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 360, height: 640 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve(__dirname, '../www/index.html')); await p.waitForTimeout(300);
  await p.mouse.click(180, 320);
  if ((await p.evaluate(() => window.__brick.state)) !== 'play') throw new Error('did not start');
  await p.mouse.click(180, 400);                                     // launch
  const t0 = Date.now(); let maxScore = 0, maxLevel = 1;
  while (Date.now() - t0 < 30000) {
    const s = await p.evaluate(() => ({ b: window.__brick.balls.map(x => ({ x: x.x, y: x.y, vy: x.vy, stuck: x.stuck })), sc: window.__brick.score, st: window.__brick.state, lv: window.__brick.level }));
    maxScore = Math.max(maxScore, s.sc); maxLevel = Math.max(maxLevel, s.lv); if (s.st !== 'play') break;
    const ball = s.b.filter(x => x.vy > 0).sort((a, c) => c.y - a.y)[0] || s.b[0];
    if (ball) { if (ball.stuck) await p.mouse.click(180, 400); await p.mouse.move(Math.max(10, Math.min(350, ball.x + (ball.stuck ? 0 : 12))), 590); }
    await p.waitForTimeout(16);
  }
  console.log('bot score:', maxScore, 'level:', maxLevel, 'state:', await p.evaluate(() => window.__brick.state));
  if (maxScore < 100) throw new Error('bot should break bricks');
  console.log('errors:', errs.filter(e => !/fonts\.googleapis|ERR_|Failed to load resource/.test(e)));
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
