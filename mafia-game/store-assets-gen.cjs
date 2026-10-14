// Renders launcher icons, Play Store graphics and phone screenshots with Chromium.
// Run from the repo root after `npm i`: CHROME_PATH=/path/to/chrome node mafia-game/store-assets-gen.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const emoji = (size, pad) => `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${size}px">🕵️</div>`;
const bg = (inner) => `<div style="width:100%;height:100%;background:radial-gradient(circle at 50% 30%,#4b3a9a,#14102b)">${inner}</div>`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const shot = async (html, w, h, out, transparent) => {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(`<body style="margin:0;background:transparent">${html}</body>`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await p.screenshot({ path: out, omitBackground: !!transparent }); await p.close();
  };
  const res = path.join(__dirname, 'android/app/src/main/res');
  for (const [d, s] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
    await shot(bg(emoji(s * 0.62)), s, s, `${res}/mipmap-${d}/ic_launcher.png`);
    await shot(`<div style="width:100%;height:100%;border-radius:50%;overflow:hidden">${bg(emoji(s * 0.62))}</div>`, s, s, `${res}/mipmap-${d}/ic_launcher_round.png`, true);
    const f = Math.round(s * 108 / 48);
    await shot(emoji(f * 0.42), f, f, `${res}/mipmap-${d}/ic_launcher_foreground.png`, true);
  }
  const out = path.join(__dirname, 'store');
  await shot(bg(emoji(330)), 512, 512, `${out}/icon-512.png`);
  await shot(`<div style="width:1024px;height:500px;background:linear-gradient(#14102b,#3a2a7a);display:flex;align-items:center;justify-content:center;gap:40px;font:bold 80px system-ui;color:#ffb020"><span style="font-size:200px">🕵️</span><div style="text-align:center;line-height:1.2">مين برا السالفة؟<br><span style="font-size:52px;color:#f4f1ff">Who is the Imposter?</span></div></div>`, 1024, 500, `${out}/feature-graphic-1024x500.png`);

  // phone screenshots (1080x1920) of the real game, Arabic and English
  const url = 'file://' + path.join(__dirname, 'www/index.html');
  for (const lang of ['ar', 'en']) {
    const p = await b.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
    await p.addInitScript((l) => { localStorage.setItem('imp.lang', JSON.stringify(l)); localStorage.setItem('imp.names', JSON.stringify(l === 'ar' ? ['سعد','ليلى','عمر','هدى','كريم','نور'] : ['Sam','Lina','Omar','Huda','Karim','Noor'])); }, lang);
    await p.goto(url); const dir = `${out}/screenshots/${lang}/`; fs.mkdirSync(dir, { recursive: true });
    await p.screenshot({ path: dir + '1-home.png' });
    await p.click('[data-v=mafia]'); await p.selectOption('#mc', '2'); await p.screenshot({ path: dir + '2-setup.png' });
    await p.click('[data-a=begin]'); await p.screenshot({ path: dir + '3-pass-the-phone.png' });
    await p.click('[data-a=dealShow]'); await p.screenshot({ path: dir + '4-secret-role.png' });
    await p.close();
  }
  await b.close();
})();
