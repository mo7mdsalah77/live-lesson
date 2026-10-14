// Renders launcher icons, store icon and phone screenshots. Run from the repo root:
// CHROME_PATH=/opt/pw-browsers/chromium NODE_PATH=node_modules node stories-app/store-assets-gen.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const art = require('./www/art.js');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const genie = art.draw('genie', { mood: 'happy' }).g;
  const stars = [[14, 18, 2], [86, 14, 1.6], [80, 40, 1.2], [18, 52, 1.4], [50, 8, 1.4], [90, 70, 1.4]].map(s => `<circle cx="${s[0]}" cy="${s[1]}" r="${s[2]}" fill="#fff4b8"/>`).join('');
  const moon = '<path d="M30 14 a14 14 0 1 0 12 22 a11 11 0 1 1 -12 -22z" fill="#ffd34d"/>';
  const scene = `${stars}${moon}<g transform="translate(52 88) scale(.58)">${genie}</g>`;
  const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><defs><radialGradient id="g" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#4a45b8"/><stop offset="1" stop-color="#1b1a4a"/></radialGradient></defs><rect width="100" height="100" fill="url(#g)"/>${scene}</svg>`;
  const fg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><g transform="translate(15 17) scale(.7)">${moon}<g transform="translate(40 76) scale(.5)">${genie}</g></g></svg>`;
  const round = `<div style="width:100%;height:100%;border-radius:50%;overflow:hidden">${full}</div>`;
  const shot = async (html, w, h, out, tr) => { const p = await b.newPage({ viewport: { width: w, height: h } }); await p.setContent(`<body style="margin:0;background:transparent">${html}</body>`); fs.mkdirSync(path.dirname(out), { recursive: true }); await p.screenshot({ path: out, omitBackground: !!tr }); await p.close(); };
  const res = path.join(__dirname, 'android/app/src/main/res');
  for (const [d, s] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
    await shot(full, s, s, `${res}/mipmap-${d}/ic_launcher.png`); await shot(round, s, s, `${res}/mipmap-${d}/ic_launcher_round.png`, true);
    const f = Math.round(s * 108 / 48); await shot(fg, f, f, `${res}/mipmap-${d}/ic_launcher_foreground.png`, true);
  }
  await shot(full, 512, 512, path.join(__dirname, 'store/icon-512.png'));
  await b.close();
})();
