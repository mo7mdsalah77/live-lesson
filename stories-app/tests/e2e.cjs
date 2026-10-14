// Drives the app with a fake speech engine: library, auto-narration to the end screen, back button behaviour, read mode, native plugin path.
// Run: NODE_PATH=../node_modules node tests/e2e.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
  const errs = [];
  const url = 'file://' + require('path').resolve(__dirname, '../www/index.html');
  const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => {
    window.__spoken = [];
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speak(u) { window.__spoken.push({ text: u.text, lang: u.lang, rate: u.rate }); setTimeout(() => { u.onboundary && u.onboundary({ charIndex: 0 }); u.onend && u.onend(); }, 60); }, cancel() {}, addEventListener() {},
      getVoices() { return [{ lang: 'ar-EG', name: 'Arabic (Egypt)', voiceURI: 'eg' }, { lang: 'ar-SA', name: 'Arabic (Saudi)', voiceURI: 'sa' }]; } } });
  });
  await p.goto(url); await p.waitForTimeout(300);
  if ((await p.$$eval('.card', e => e.length)) < 20) throw new Error('expected 20+ cards');
  if (await p.$('[data-a=dialect]')) throw new Error('the dialect switch must be gone');
  if ((await p.textContent('body')).includes('مصري')) throw new Error('Egyptian option still shown');
  await p.click('[data-a=kind][data-v=nights]'); if ((await p.$$eval('.card', e => e.length)) !== 4) throw new Error('nights filter'); await p.click('[data-a=kind][data-v=all]');

  // auto-narration to the end: one utterance per page plus the moral, uses the MSA voice (ar-SA), then the end screen
  await p.click('[data-a=open][data-v=lionmouse]'); await p.click('[data-a=begin][data-v="auto:lionmouse"]');
  await p.waitForFunction(() => window.__hw.finished, null, { timeout: 20000 });
  const sp = await p.evaluate(() => window.__spoken);
  if (sp.length !== 7) throw new Error('expected 7 utterances, got ' + sp.length);
  if (!sp.every(s => s.lang === 'ar-SA')) throw new Error('should use the ar-SA voice, got ' + sp.map(s => s.lang));
  if (!/العبرة/.test(sp[6].text)) throw new Error('moral not narrated');
  const end = await p.textContent('#page'); if (!/النهاية/.test(end) || !end.includes('حكايات أخرى') || !end.includes('الحكاية التالية')) throw new Error('end screen missing: ' + end);
  console.log('auto narration + end screen ok');

  // phone back button: end screen -> library (not out of the app); sheet -> library
  await p.goBack(); await p.waitForTimeout(150);
  if ((await p.evaluate(() => window.__hw.story)) !== null || !(await p.$('.grid'))) throw new Error('back from the end screen should return to the library');
  if (!(await p.url()).includes('index.html')) throw new Error('back left the app page');
  await p.click('[data-a=open][data-v=hare]'); if (!(await p.$('.sheet'))) throw new Error('sheet should open');
  await p.goBack(); await p.waitForTimeout(150); if (await p.$('.sheet')) throw new Error('back should close the sheet'); if (!(await p.$('.grid'))) throw new Error('library should stay');
  await p.click('[data-a=open][data-v=hare]'); await p.click('[data-a=begin][data-v="read:hare"]');
  await p.goBack(); await p.waitForTimeout(150); if (!(await p.$('.grid'))) throw new Error('back from the reader should return to the library');
  await p.click('[data-a=open][data-v=hare]'); await p.click('[data-a=closeSheet]'); await p.waitForTimeout(150); if (await p.$('.sheet')) throw new Error('close button should close the sheet');
  // the on-screen home button and the end-screen buttons go through the same history
  await p.click('[data-a=open][data-v=hare]'); await p.click('[data-a=begin][data-v="read:hare"]'); await p.click('[data-a=home]'); await p.waitForTimeout(150);
  if (!(await p.$('.grid'))) throw new Error('home button should return to the library');
  console.log('back button ok');

  // read mode: no automatic speech, vocalised text, next/prev, "listen" button, next story from the end screen
  await p.evaluate(() => { window.__spoken.length = 0; });
  await p.click('[data-a=open][data-v=hare]'); await p.click('[data-a=begin][data-v="read:hare"]');
  if ((await p.evaluate(() => window.__spoken.length)) !== 0) throw new Error('read mode must not speak by itself');
  if (!/أَرْنَبٌ/.test(await p.textContent('#txt'))) throw new Error('expected vocalised text');
  await p.click('#next'); await p.click('#next'); if ((await p.evaluate(() => window.__hw.page)) !== 2) throw new Error('next failed'); await p.click('#prev');
  if ((await p.evaluate(() => window.__hw.page)) !== 1) throw new Error('prev failed');
  await p.click('#play'); await p.waitForTimeout(300); const sp2 = await p.evaluate(() => window.__spoken); if (sp2.length < 1) throw new Error('listen button');
  await p.screenshot({ path: process.env.SHOT || '/tmp/claude-0/stories-reader.png' });
  while ((await p.evaluate(() => window.__hw.page)) < 5) await p.click('#next');
  await p.click('#next'); if (!(await p.evaluate(() => window.__hw.finished))) throw new Error('"النهاية" button should open the end screen');
  await p.click('[data-a=nextStory]'); if ((await p.evaluate(() => window.__hw.story)) === 'hare' || (await p.evaluate(() => window.__hw.page)) !== 0) throw new Error('next story should start at page 1');
  await p.goBack(); await p.waitForTimeout(150); if (!(await p.$('.grid'))) throw new Error('back after "next story" should return to the library');

  // every story opens and its pages render
  const ids = await p.$$eval('.card', els => els.map(e => e.dataset.v));
  for (const id of ids) { await p.click(`[data-a=open][data-v=${id}]`); await p.click(`[data-a=begin][data-v="read:${id}"]`); const n = await p.$$eval('.dots i', e => e.length); while ((await p.evaluate(() => window.__hw.page)) < n - 1) await p.click('#next'); if (!(await p.textContent('#page')).includes('العبرة')) throw new Error(id + ' last page lacks the moral'); await p.click('[data-a=home]'); await p.waitForTimeout(60); }
  console.log('all', ids.length, 'stories render to the last page');
  await p.close();

  // native Android plugin path (what the APK uses)
  const p2 = await b.newPage({ viewport: { width: 390, height: 800 } });
  p2.on('pageerror', e => errs.push('native: ' + e.message));
  await p2.addInitScript(() => {
    window.__nspoken = [];
    window.Capacitor = { isNativePlatform: () => true, Plugins: { TextToSpeech: {
      getSupportedVoices: () => Promise.resolve({ voices: [{ voiceURI: 'x', name: 'Other', lang: 'en-US' }, { voiceURI: 'v1', name: 'Arabic', lang: 'ar-SA' }] }),
      speak: (o) => { window.__nspoken.push(o); return new Promise(r => setTimeout(r, 80)); }, stop: () => Promise.resolve() } } };
  });
  await p2.goto(url); await p2.waitForTimeout(400);
  await p2.click('[data-a=open][data-v=fox]'); await p2.click('[data-a=begin][data-v="auto:fox"]');
  await p2.waitForFunction(() => window.__hw.finished, null, { timeout: 20000 });
  const ns = await p2.evaluate(() => window.__nspoken);
  if (ns.length !== 6) throw new Error('native: expected 6 utterances (5 pages + moral), got ' + ns.length);
  if (ns[0].lang !== 'ar-SA' || ns[0].voice !== 1) throw new Error('native: should pick the Arabic voice, got ' + JSON.stringify(ns[0]));
  console.log('native TTS path ok');
  const real = errs.filter(e => !/fonts\.googleapis|ERR_|Failed to load resource/.test(e)); console.log('errors:', real);
  if (real.length) process.exit(1);
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
