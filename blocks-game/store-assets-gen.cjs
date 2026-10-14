// Renders launcher icons for the Android app. Run from the repo root: CHROME_PATH=/path/to/chrome NODE_PATH=node_modules node blocks-game/store-assets-gen.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const cube = (x, y, c) => `<rect x="${x + 0.6}" y="${y + 0.6}" width="${18.8}" height="${18.8}" rx="4" fill="${c}"/><rect x="${x + 3}" y="${y + 3}" width="14" height="3" fill="#fff" opacity=".35"/><rect x="${x + 3}" y="${y + 14}" width="14" height="3" fill="#000" opacity=".22"/>`;
const pieces = cube(30, 22, '#b66bff') + cube(50, 22, '#b66bff') + cube(10, 42, '#4ecdf0') + cube(30, 42, '#b66bff') + cube(50, 42, '#b66bff') + cube(70, 42, '#ffd23f') + cube(30, 62, '#ff5a6e') + cube(50, 62, '#5ee27a') + cube(70, 62, '#ff9f43');
const svg = (inner, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">${bg ? '<rect width="100" height="100" fill="#0f1a2e"/>' : ''}${inner}</svg>`;
const full = svg(pieces, true), fg = svg(`<g transform="translate(15 15) scale(.7)">${pieces}</g>`, false);
const round = `<div style="width:100%;height:100%;border-radius:50%;overflow:hidden">${full}</div>`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const shot = async (html, w, h, out, tr) => { const p = await b.newPage({ viewport: { width: w, height: h } }); await p.setContent(`<body style="margin:0;background:transparent">${html}</body>`); fs.mkdirSync(path.dirname(out), { recursive: true }); await p.screenshot({ path: out, omitBackground: !!tr }); await p.close(); };
  const res = path.join(__dirname, 'android/app/src/main/res');
  for (const [d, s] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
    await shot(full, s, s, `${res}/mipmap-${d}/ic_launcher.png`); await shot(round, s, s, `${res}/mipmap-${d}/ic_launcher_round.png`, true);
    const f = Math.round(s * 108 / 48); await shot(fg, f, f, `${res}/mipmap-${d}/ic_launcher_foreground.png`, true);
  }
  await shot(full, 512, 512, path.join(__dirname, 'store/icon-512.png'));
  await b.close();
})();
