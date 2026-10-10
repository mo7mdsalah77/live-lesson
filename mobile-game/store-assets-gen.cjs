// Renders launcher icons and Play Store graphics from inline SVG with Chromium.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ship = (c) => `<path d="M50 14 L76 78 L50 64 L24 78 Z" fill="${c}"/><path d="M50 22 L50 58" stroke="#0b0b2a" stroke-width="3" opacity=".25"/>`;
const star = '<path d="M80 18l3.5 8 8.5.8-6.5 5.7 2 8.5-7.5-4.5-7.5 4.5 2-8.5-6.5-5.7 8.5-.8z" fill="#ffd84a"/>';
const svg = (inner, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">${bg ? `<rect width="100" height="100" fill="#12124a"/>` : ''}${inner}</svg>`;
const full = svg(ship('#4af2c8') + star, true);
const fg = svg(`<g transform="translate(16.5 16.5) scale(.67)">${ship('#4af2c8')}${star}</g>`, false);
const round = `<div style="width:100%;height:100%;border-radius:50%;overflow:hidden">${full}</div>`;
(async () => {
  const exe = process.env.CHROME_PATH || undefined;
  const b = await chromium.launch({ executablePath: exe });
  const shot = async (html, w, h, out, transparent) => {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(`<body style="margin:0;background:transparent">${html}</body>`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await p.screenshot({ path: out, omitBackground: !!transparent }); await p.close();
  };
  const res = path.join(__dirname, 'android/app/src/main/res');
  const dens = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [d, s] of Object.entries(dens)) {
    await shot(full, s, s, `${res}/mipmap-${d}/ic_launcher.png`);
    await shot(round, s, s, `${res}/mipmap-${d}/ic_launcher_round.png`, true);
    const f = Math.round(s * 108 / 48);
    await shot(fg, f, f, `${res}/mipmap-${d}/ic_launcher_foreground.png`, true);
  }
  const out = path.join(__dirname, 'store');
  await shot(full, 512, 512, `${out}/icon-512.png`);
  await shot(`<div style="width:1024px;height:500px;background:linear-gradient(#0b0b2a,#1b1b6a);display:flex;align-items:center;justify-content:center;gap:40px;font:bold 96px system-ui;color:#4af2c8"><div style="width:300px;height:300px">${full}</div>STAR DODGE</div>`, 1024, 500, `${out}/feature-graphic-1024x500.png`);
  await b.close();
})();
