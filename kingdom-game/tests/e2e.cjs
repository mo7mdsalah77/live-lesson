// Plays the first minutes of the game in headless Chromium. Run: NODE_PATH=../node_modules node tests/e2e.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 390, height: 780 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { if (!localStorage.getItem('realmrush.lang')) localStorage.setItem('realmrush.lang', '"en"'); });
  await p.addInitScript(() => { if (sessionStorage.getItem('topup')) { sessionStorage.removeItem('topup'); const k = 'realmrush.save.v1', g = JSON.parse(localStorage.getItem(k)); g.res = { food: 900, wood: 900, stone: 900, gold: 300 }; localStorage.setItem(k, JSON.stringify(g)); } });
  await p.goto('file://' + require('path').resolve(__dirname, '../www/index.html'));
  const click = (s) => p.click(s);
  const say = async (m) => console.log(m);
  const rush = async () => { if (await p.$('[data-act=rush]')) await click('[data-act=rush]'); await p.waitForTimeout(1100); };

  // Town hall -> level 2
  await click('[data-v=hall]'); await click('[data-act=upgrade]'); await rush();
  if (!(await p.textContent('#view')).includes('Lv 2')) throw new Error('hall not level 2');
  // Barracks
  await click('[data-v=barracks]'); await click('[data-act=upgrade]'); await rush();
  // Top up resources through the save file (waiting for production would take minutes), then reload
  await p.evaluate(() => sessionStorage.setItem('topup', '1'));   // applied by the init script below on the next load
  await p.reload(); await p.waitForTimeout(300);
  // Train infantry + archers
  await click('[data-v=army]'); await click('[data-act=batch][data-v="inf:5"]'); await click('[data-act=train][data-v=inf]'); await rush();
  await click('[data-act=batch][data-v="arc:5"]'); await click('[data-act=train][data-v=arc]'); await rush();
  const army = await p.textContent('#view'); if (!/Infantry · 10/.test(army) || !/Archers · 10/.test(army)) throw new Error('troops missing: ' + army.slice(0, 200));
  // Attack camp 1
  await click('[data-v=map]'); await click('[data-act=attack][data-v="1"]');
  const rep = await p.textContent('#modal'); say('battle: ' + rep.slice(0, 60));
  if (!/Victory/.test(rep)) throw new Error('should win camp 1: ' + rep);
  await click('[data-act=close]');
  if (!(await p.textContent('#view')).includes('Cleared')) throw new Error('camp 1 not marked cleared');
  // persistence
  await p.reload(); await p.waitForTimeout(300);
  await click('[data-v=map]'); if (!(await p.textContent('#view')).includes('Cleared')) throw new Error('save lost');
  // heroes + Arabic
  await click('[data-v=heroes]'); await click('[data-act=lang]');
  if ((await p.evaluate(() => document.documentElement.dir)) !== 'rtl') throw new Error('not RTL');
  await p.screenshot({ path: process.env.SHOT || '/tmp/claude-0/kingdom-ar.png' });
  console.log('page errors:', errs); if (errs.length) process.exit(1);
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
