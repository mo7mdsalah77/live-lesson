// Drives the app with a fake speech engine: library, dialect switch, auto-narration to the end, read mode, progress. Run: NODE_PATH=../node_modules node tests/e2e.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => {
    window.__spoken = [];
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speak(u) { window.__spoken.push({ text: u.text, lang: u.lang, rate: u.rate }); setTimeout(() => { u.onboundary && u.onboundary({ charIndex: 0 }); u.onend && u.onend(); }, 60); }, cancel() {}, addEventListener() {},
      getVoices() { return [{ lang: 'ar-EG', name: 'Arabic (Egypt)', voiceURI: 'eg' }, { lang: 'ar-SA', name: 'Arabic (Saudi)', voiceURI: 'sa' }]; } } });
  });
  await p.goto('file://' + require('path').resolve(__dirname, '../www/index.html')); await p.waitForTimeout(300);
  const cards = await p.$$eval('.card', e => e.length); if (cards < 12) throw new Error('expected 12 cards, got ' + cards);
  // chips filter
  await p.click('[data-a=kind][data-v=nights]'); if ((await p.$$eval('.card', e => e.length)) !== 3) throw new Error('nights filter'); await p.click('[data-a=kind][data-v=all]');
  // Egyptian: auto-narrate "الأسد والفأر" to the end
  await p.click('[data-a=open][data-v=lionmouse]'); await p.click('[data-a=begin][data-v="auto:lionmouse"]');
  await p.waitForFunction(() => window.__hw.ended, null, { timeout: 20000 });
  const sp = await p.evaluate(() => window.__spoken); const pages = 6;
  if (sp.length !== pages + 1) throw new Error('expected ' + (pages + 1) + ' utterances (pages + moral), got ' + sp.length);
  if (!sp.every(s => s.lang === 'ar-EG')) throw new Error('Egyptian should use the ar-EG voice');
  if (!/العبرة/.test(sp[sp.length - 1].text)) throw new Error('moral not narrated');
  if (!/مسك الأسد|هاكلك/.test(sp[1].text)) throw new Error('page 2 should be Egyptian wording');
  console.log('auto narration ok:', sp.length, 'utterances');
  // progress badge + back to library
  await p.click('[data-a=home]'); if (!(await p.textContent('[data-a=open][data-v=lionmouse]')).includes('خلصت')) throw new Error('done badge missing');
  // MSA dialect
  await p.click('[data-a=dialect][data-v=ar]'); await p.evaluate(() => { window.__spoken.length = 0; });
  await p.click('[data-a=open][data-v=hare]'); await p.click('[data-a=begin][data-v="read:hare"]');
  if ((await p.evaluate(() => window.__spoken.length)) !== 0) throw new Error('read mode must not speak by itself');
  const txt0 = await p.textContent('#txt'); if (!/أرنبٌ سريع/.test(txt0)) throw new Error('MSA text expected: ' + txt0);
  await p.click('#next'); await p.click('#next'); if ((await p.evaluate(() => window.__hw.page)) !== 2) throw new Error('next failed'); await p.click('#prev');
  if ((await p.evaluate(() => window.__hw.page)) !== 1) throw new Error('prev failed');
  await p.click('#play'); await p.waitForTimeout(300); const sp2 = await p.evaluate(() => window.__spoken); if (sp2.length < 1 || sp2[0].lang !== 'ar-SA') throw new Error('listen button / MSA voice');
  await p.click('[data-a=size][data-v="1"]');
  await p.screenshot({ path: process.env.SHOT || '/tmp/claude-0/stories-reader.png' });
  // every story opens and renders all of its pages without errors
  await p.click('[data-a=home]');
  const ids = await p.$$eval('.card', els => els.map(e => e.dataset.v));
  for (const id of ids) { await p.click(`[data-a=open][data-v=${id}]`); await p.click(`[data-a=begin][data-v="read:${id}"]`); const n = await p.$$eval('.dots i', e => e.length); while ((await p.evaluate(() => window.__hw.page)) < n - 1) await p.click('#next'); if (!(await p.textContent('#page')).includes('العبرة')) throw new Error(id + ' last page lacks the moral'); await p.click('[data-a=home]'); }
  console.log('all', ids.length, 'stories render to the last page');
  console.log('errors:', errs.filter(e => !/fonts\.googleapis|ERR_|Failed to load resource/.test(e)));
  if (errs.filter(e => !/fonts\.googleapis|ERR_|Failed to load resource/.test(e)).length) process.exit(1);
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
