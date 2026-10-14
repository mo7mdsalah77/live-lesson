// Plays the game headlessly: steer, honk, crash until game over. Run: NODE_PATH=../node_modules node tests/e2e.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 390, height: 780 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve(__dirname, '../www/index.html')); await p.waitForTimeout(300);
  await p.mouse.click(195, 400);
  if ((await p.evaluate(() => window.__osta.state)) !== 'play') throw new Error('did not start');
  await p.keyboard.press('Space');                          // honk
  let s = 'play', t0 = Date.now();
  while (s === 'play' && Date.now() - t0 < 60000) {          // drive straight, never steering: must crash out eventually
    await p.waitForTimeout(400); s = await p.evaluate(() => window.__osta.state);
  }
  console.log('ended in state:', s, 'fare:', await p.evaluate(() => window.__osta.fare), 'lives:', await p.evaluate(() => window.__osta.lives));
  if (s !== 'over') throw new Error('expected game over');
  await p.mouse.click(195, 400); if ((await p.evaluate(() => window.__osta.state)) !== 'play') throw new Error('restart failed');
  console.log('errors:', errs.filter(e => !/fonts\.googleapis|ERR_|Failed to load resource/.test(e)));
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
