// Plays full Mafia and Imposter games in headless Chromium. Run: CHROME_PATH=... node tests/e2e.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 390, height: 780 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => localStorage.setItem('imp.lang', '"en"'));
  await p.goto('file://' + require('path').resolve(__dirname, '../www/index.html'));
  const click = (sel) => p.click(sel);
  const fill = async (n) => { for (let i = 0; i < n; i++) { if (!(await p.$(`input[data-i="${i}"]`))) await click('[data-a=add]'); await p.fill(`input[data-i="${i}"]`, 'P' + (i + 1)); } };

  // ---- Mafia, 6 players: deal, then play nights until someone wins
  await click('[data-v=mafia]'); await fill(6); await click('[data-a=begin]');
  for (let i = 0; i < 6; i++) { await click('[data-a=dealShow]'); await click('[data-a=dealNext]'); }
  let rounds = 0;
  while (!(await p.$('[data-a=setup]')) && rounds++ < 12) {
    if (await p.$('[data-a=night]')) { await click('[data-a=night]'); }
    await click('[data-a=stepMafia]');
    // mafia kills first available target
    await click('.grid button'); await click('#confirm');
    // doctor / detective steps (skip or pick)
    for (let s = 0; s < 2; s++) {
      if (await p.$('[data-a=doctorSkip]')) await click('[data-a=doctorSkip]');
      else if (await p.$('#confirm') ) { await click('.grid button'); await click('#confirm'); }
      if (await p.$('[data-a=dawn0]')) await click('[data-a=dawn0]');
      if (await p.$('[data-a=detectiveSkip]')) await click('[data-a=detectiveSkip]');
    }
    await click('[data-a=dawn]');
    if (await p.$('[data-a=end]')) { await click('[data-a=end]'); break; }
    await click('[data-a=discuss]'); await click('[data-a=vote]');
    await click('.grid button'); await click('#confirm');   // vote out first alive player
    if (await p.$('[data-a=end]')) { await click('[data-a=end]'); break; }
    // loop: next is the night button ('[data-a=night]')
  }
  const endText = await p.textContent('h1');
  console.log('mafia ended:', endText);
  if (!/win/i.test(endText)) throw new Error('Mafia game did not reach a winner');

  // ---- Imposter, 4 players
  await click('[data-a=home]'); await click('[data-v=imposter]');
  while ((await p.$$('input[data-i]')).length > 4) await click('[data-a=del]');   // names persist between games
  await p.fill('input[data-i="0"]', 'A'); await p.fill('input[data-i="1"]', 'B'); await p.fill('input[data-i="2"]', 'C'); await p.fill('input[data-i="3"]', 'D');
  await click('[data-a=begin]');
  let imposterSeen = 0;
  for (let i = 0; i < 4; i++) { await click('[data-a=dealShow]'); if ((await p.textContent('#app')).includes('IMPOSTER')) imposterSeen++; await click('[data-a=dealNext]'); }
  if (imposterSeen !== 1) throw new Error('expected exactly one imposter, saw ' + imposterSeen);
  await click('[data-a=impVote]'); await click('.grid button'); await click('#confirm');
  console.log('imposter result:', await p.textContent('h1'));

  // ---- validation: duplicate names rejected
  await click('[data-a=home]'); await click('[data-v=mafia]');
  await p.fill('input[data-i="0"]', 'x'); await p.fill('input[data-i="1"]', 'x'); await click('[data-a=begin]');
  if (!(await p.textContent('#app')).includes('at least')) throw new Error('validation message missing');

  // ---- Arabic RTL
  await click('[data-a=home]'); await click('[data-a=lang]');
  if ((await p.evaluate(() => document.documentElement.dir)) !== 'rtl') throw new Error('not RTL');
  await p.screenshot({ path: process.env.SHOT || '/tmp/claude-0/home-ar.png' });
  console.log('page errors:', errs);
  if (errs.length) process.exit(1);
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
