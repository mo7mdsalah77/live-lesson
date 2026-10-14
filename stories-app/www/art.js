// Cel-shaded cartoon characters, animals and props drawn as SVG (feet at y=0, facing right, ~100 units tall).
// Browser: window.Art.draw(name, {mood, flip}) -> { g: '<g>…</g>', h: 100 }.
(function (root) {
  var OL = ' stroke="rgba(52,26,12,.6)" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"';
  function hex(c) { var n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mix(c, t, a) { var x = hex(c), y = t === 'w' ? [255, 255, 255] : t === 'k' ? [20, 10, 20] : hex(t); return '#' + x.map(function (v, i) { return ('0' + Math.round(v + (y[i] - v) * a).toString(16)).slice(-2); }).join(''); }
  function dk(c, a) { return mix(c, 'k', a == null ? 0.25 : a); }
  function lt(c, a) { return mix(c, 'w', a == null ? 0.3 : a); }
  function E(cx, cy, rx, ry, f, x) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (x === false ? '' : (x || OL)) + '/>'; }
  function R(x, y, w, h, r, f, x2) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + f + '"' + (x2 === false ? '' : (x2 || OL)) + '/>'; }
  function P(d, f, x) { return '<path d="' + d + '" fill="' + f + '"' + (x === false ? '' : (x || OL)) + '/>'; }
  function S(d, c, w, x) { return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (w || 1.4) + '" stroke-linecap="round" stroke-linejoin="round"' + (x || '') + '/>'; }
  function C(cx, cy, r, f, x) { return E(cx, cy, r, r, f, x); }
  function shine(d, a) { return '<path d="' + d + '" fill="rgba(255,255,255,' + (a || 0.25) + ')"/>'; }
  function shadow(d, a) { return '<path d="' + d + '" fill="rgba(30,10,40,' + (a || 0.18) + ')"/>'; }

  // ---------------------------------------------------------------- people
  function eyes(y, dx, mood, c) {
    c = c || '#2a1608'; var o = '';
    if (mood === 'sleep') return S('M' + (-dx - 3.2) + ' ' + y + ' Q' + (-dx) + ' ' + (y + 2.4) + ' ' + (-dx + 3.2) + ' ' + y, '#3a2210', 1.4) + S('M' + (dx - 3.2) + ' ' + y + ' Q' + dx + ' ' + (y + 2.4) + ' ' + (dx + 3.2) + ' ' + y, '#3a2210', 1.4);
    var big = mood === 'scared' || mood === 'surprised' ? 1.18 : 1;
    [-dx, dx].forEach(function (x) { o += '<g class="blink">' + E(x, y, 3.5 * big, 4 * big, '#fff', ' stroke="rgba(52,26,12,.5)" stroke-width=".7"') + C(x + 0.3, y + 0.3, 2.3 * big, c, false) + C(x + 0.3, y + 0.3, 1.1 * big, '#000', false) + C(x + 1.1, y - 0.9, 0.9, '#fff', false) + '</g>'; });
    return o;
  }
  function brows(y, dx, mood, c) {
    c = c || '#2a1608'; var l = mood === 'angry' ? [-1.5, 1.5] : mood === 'sad' || mood === 'scared' ? [1.6, -1.6] : [0, 0], up = mood === 'surprised' || mood === 'scared' ? -2 : 0;
    return S('M' + (-dx - 4) + ' ' + (y + l[0] + up) + ' Q' + (-dx) + ' ' + (y - 1.6 + up) + ' ' + (-dx + 3.6) + ' ' + (y + l[1] + up), c, 1.5) + S('M' + (dx - 3.6) + ' ' + (y + l[1] + up) + ' Q' + dx + ' ' + (y - 1.6 + up) + ' ' + (dx + 4) + ' ' + (y + l[0] + up), c, 1.5);
  }
  function mouth(y, mood, lipC) {
    lipC = lipC || '#7a2a22';
    if (mood === 'sad') return S('M-4 ' + (y + 2) + ' Q0 ' + (y - 2) + ' 4 ' + (y + 2), lipC, 1.5);
    if (mood === 'angry') return S('M-4 ' + (y + 1.4) + ' Q0 ' + (y - 1) + ' 4 ' + (y + 1.4), lipC, 1.6);
    if (mood === 'scared' || mood === 'surprised') return E(0, y + 1, 2.8, 3.6, '#5a1a18', false) + E(0, y + 2.4, 1.6, 1.2, '#e0707a', false);
    if (mood === 'laugh') return P('M-5.5 ' + y + ' Q0 ' + (y + 9) + ' 5.5 ' + y + ' Q0 ' + (y + 2) + ' -5.5 ' + y + 'Z', '#5a1a18', ' stroke="#5a1a18" stroke-width="1"') + P('M-3.6 ' + (y + 3.2) + ' Q0 ' + (y + 7) + ' 3.6 ' + (y + 3.2) + ' Q0 ' + (y + 5.2) + ' -3.6 ' + (y + 3.2) + 'Z', '#e0707a', false);
    if (mood === 'sleep') return S('M-2.5 ' + (y + 1) + ' Q0 ' + (y + 2.4) + ' 2.5 ' + (y + 1), lipC, 1.3);
    return S('M-4.6 ' + y + ' Q0 ' + (y + 4.6) + ' 4.6 ' + y, lipC, 1.6);
  }
  function arm(x1, y1, x2, y2, c, skin, sleeve) {
    var q = 'M' + x1 + ' ' + y1 + ' Q' + ((x1 + x2) / 2 + (x2 > x1 ? 2 : -2)) + ' ' + ((y1 + y2) / 2 + 3) + ' ' + x2 + ' ' + y2;
    return '<path d="' + q + '" stroke="rgba(52,26,12,.6)" stroke-width="9.6" fill="none" stroke-linecap="round"/><path d="' + q + '" stroke="' + c + '" stroke-width="7.6" fill="none" stroke-linecap="round"/>' + C(x2, y2, 3.9, skin);
  }
  function person(o) {
    o = o || {}; var skin = o.skin || '#e0a878', hair = o.hair || '#2a1a10', mood = o.mood || 'happy', robe = o.robe || '#5b8def', sash = o.sash || dk(robe, 0.35), trim = o.trim || lt(robe, 0.45), kind = o.kind || 'long', pose = o.pose || 'down', g = '';
    var fatW = o.wide || 1, skinD = dk(skin, 0.18);
    // back layers: long hair, cape, wings
    if (o.wings) g += '<g opacity=".75">' + P('M-6 -60 Q-44 -96 -34 -40 Q-22 -50 -6 -52Z', 'rgba(210,235,255,.8)', ' stroke="#fff" stroke-width="1"') + P('M6 -60 Q44 -96 34 -40 Q22 -50 6 -52Z', 'rgba(210,235,255,.8)', ' stroke="#fff" stroke-width="1"') + '</g>';
    if (o.cape) g += P('M-15 -60 Q-26 -30 -24 -4 L24 -4 Q26 -30 15 -60Z', o.cape);
    if (o.hs === 'long') g += P('M-17 -80 Q-22 -50 -16 -42 L16 -42 Q22 -50 17 -80Z', hair);
    // legs / shoes
    var hemY = kind === 'dress' ? -4 : kind === 'tunic' ? -24 : -7;
    if (kind === 'tunic' || kind === 'prince') { g += R(-10, -26, 8, 22, 3, o.pants || '#efe3c3') + R(2, -26, 8, 22, 3, o.pants || '#efe3c3'); }
    g += E(-8, -2.6, 7.4, 3.6, o.shoes || '#5a3a22') + E(8, -2.6, 7.4, 3.6, o.shoes || '#5a3a22');
    // body
    if (kind === 'dress') { g += P('M-11 -60 Q-14 -44 -30 -6 Q0 2 30 -6 Q14 -44 11 -60 Q0 -64 -11 -60Z', robe) + shadow('M0 -58 Q14 -44 30 -6 Q14 -2 0 -2Z', 0.14) + P('M-30 -6 Q0 2 30 -6 L28 -2 Q0 6 -28 -2Z', trim) + R(-12, -48, 24, 4.4, 2, sash, false) + shine('M-9 -58 Q-12 -44 -24 -14 Q-16 -40 -7 -58Z', 0.2); }
    else if (kind === 'tunic') { g += P('M-' + 15 * fatW + ' -60 Q-' + 17 * fatW + ' -42 -' + 16 * fatW + ' -24 L' + 16 * fatW + ' -24 Q' + 17 * fatW + ' -42 ' + 15 * fatW + ' -60 Q0 -64 -' + 15 * fatW + ' -60Z', robe) + R(-16 * fatW, -42, 32 * fatW, 5, 2, sash, false) + P('M-' + 16 * fatW + ' -24 L' + 16 * fatW + ' -24 L' + 16 * fatW + ' -21 L-' + 16 * fatW + ' -21Z', trim) + shadow('M2 -58 Q' + 16 * fatW + ' -42 ' + 15 * fatW + ' -24 L2 -24Z', 0.14); }
    else if (kind === 'prince') { g += P('M-15 -60 Q-17 -42 -17 -22 L17 -22 Q17 -42 15 -60 Q0 -64 -15 -60Z', robe) + P('M-3 -60 L0 -22 L3 -60Z', trim) + R(-17, -36, 34, 4, 1, sash, false) + C(0, -44, 1.6, '#ffd34d', false) + C(0, -52, 1.6, '#ffd34d', false) + shadow('M2 -58 Q15 -42 17 -22 L2 -22Z', 0.14); }
    else { g += P('M-' + 14 * fatW + ' -60 Q-' + 16 * fatW + ' -38 -' + 22 * fatW + ' -6 Q0 0 ' + 22 * fatW + ' -6 Q' + 16 * fatW + ' -38 ' + 14 * fatW + ' -60 Q0 -64 -' + 14 * fatW + ' -60Z', robe) + P('M-' + 22 * fatW + ' -6 Q0 0 ' + 22 * fatW + ' -6 L' + 21 * fatW + ' -3 Q0 3 -' + 21 * fatW + ' -3Z', trim) + R(-17 * fatW, -42, 34 * fatW, 5, 2, sash, false) + shadow('M2 -58 Q' + 16 * fatW + ' -38 ' + 22 * fatW + ' -6 Q10 -2 2 -2Z', 0.14) + shine('M-' + 10 * fatW + ' -58 Q-' + 12 * fatW + ' -38 -' + 17 * fatW + ' -12 Q-' + 10 * fatW + ' -38 -' + 7 * fatW + ' -58Z', 0.18) + (o.vest ? P('M-12 -58 L-9 -20 L-15 -20 Q-17 -40 -12 -58Z', o.vest) + P('M12 -58 L9 -20 L15 -20 Q17 -40 12 -58Z', o.vest) : ''); }
    if (o.apron) g += P('M-9 -46 L9 -46 L11 -12 L-11 -12Z', o.apron, ' stroke="rgba(52,26,12,.35)" stroke-width="1"');
    // neck + collar
    g += R(-4.2, -64, 8.4, 7, 3, skinD);
    g += P('M-8 -60 Q0 -54 8 -60 L5 -63 Q0 -59 -5 -63Z', trim, false);
    // arms
    var sl = o.sleeve || robe, sx = 13 * fatW;
    if (pose === 'up') g += arm(-sx, -56, -26, -78, sl, skin) + arm(sx, -56, 26, -78, sl, skin);
    else if (pose === 'wave') g += arm(-sx, -56, -19, -34, sl, skin) + arm(sx, -56, 28, -80, sl, skin);
    else if (pose === 'point') g += arm(-sx, -56, -19, -34, sl, skin) + arm(sx, -56, 36, -58, sl, skin);
    else if (pose === 'hold') g += arm(-sx, -56, -8, -42, sl, skin) + arm(sx, -56, 8, -42, sl, skin);
    else if (pose === 'cover') g += arm(-sx, -56, -6, -72, sl, skin) + arm(sx, -56, 6, -72, sl, skin);
    else g += arm(-sx, -56, -sx - 5, -33, sl, skin) + arm(sx, -56, sx + 5, -33, sl, skin);
    // head
    var hy = -76;
    if (o.head === 'scarf' || o.head === 'hood') g += P('M-19 -76 Q-20 -102 0 -103 Q20 -102 19 -76 Q20 -62 14 -54 L-14 -54 Q-20 -62 -19 -76Z', o.headC || '#d84a64');
    g += C(-15.6, hy + 2, 3.6, skin) + C(15.6, hy + 2, 3.6, skin);
    g += E(0, hy, 16, 17, skin) + shadow('M6 ' + (hy - 15) + ' Q18 ' + hy + ' 8 ' + (hy + 15) + ' Q15 ' + hy + ' 6 ' + (hy - 15) + 'Z', 0.16) + shine('M-11 ' + (hy - 10) + ' Q-14 ' + (hy - 2) + ' -12 ' + (hy + 4) + ' Q-10 ' + (hy - 2) + ' -8 ' + (hy - 9) + 'Z', 0.25);
    g += E(-9.5, hy + 5.4, 3.6, 2.4, 'rgba(255,90,90,.28)', false) + E(9.5, hy + 5.4, 3.6, 2.4, 'rgba(255,90,90,.28)', false);
    g += eyes(hy, 6.2, mood, o.eye) + brows(hy - 7.6, 6.2, mood, o.brow || hair) + E(0.3, hy + 4.8, 2.2, 1.8, skinD, false) + mouth(hy + 10.2, mood, o.lip);
    if (o.glasses) g += C(-6.2, hy, 5.3, 'rgba(200,230,255,.2)', ' stroke="#5a4a3a" stroke-width="1.1"') + C(6.2, hy, 5.3, 'rgba(200,230,255,.2)', ' stroke="#5a4a3a" stroke-width="1.1"') + S('M-1 ' + hy + ' H1', '#5a4a3a', 1);
    // hair front
    var hs = o.hs || 'short';
    if (o.head !== 'scarf' && o.head !== 'hood' && hs !== 'none') {
      if (hs === 'bun') g += C(0, hy - 21, 6, hair);
      g += P('M-16.4 ' + (hy - 2) + ' Q-18 ' + (hy - 20) + ' 0 ' + (hy - 20.5) + ' Q18 ' + (hy - 20) + ' 16.4 ' + (hy - 2) + ' Q12 ' + (hy - 12) + ' 3 ' + (hy - 13) + ' Q-8 ' + (hy - 10) + ' -16.4 ' + (hy - 2) + 'Z', hair) + shine('M-8 ' + (hy - 17) + ' Q-2 ' + (hy - 20) + ' 5 ' + (hy - 18) + ' Q-2 ' + (hy - 16) + ' -8 ' + (hy - 17) + 'Z', 0.3);
    }
    if (o.head === 'scarf' || o.head === 'hood') g += P('M-16 ' + (hy - 6) + ' Q0 ' + (hy - 15) + ' 16 ' + (hy - 6) + ' Q10 ' + (hy - 14) + ' 0 ' + (hy - 14.5) + ' Q-10 ' + (hy - 14) + ' -16 ' + (hy - 6) + 'Z', o.headC || '#d84a64', false);
    if (o.beard === 'full') g += P('M-15 ' + (hy + 2) + ' Q-15 ' + (hy + 22) + ' 0 ' + (hy + 25) + ' Q15 ' + (hy + 22) + ' 15 ' + (hy + 2) + ' Q9 ' + (hy + 11) + ' 0 ' + (hy + 10) + ' Q-9 ' + (hy + 11) + ' -15 ' + (hy + 2) + 'Z', o.beardC || hair) + mouth(hy + 12.6, mood === 'angry' ? 'angry' : 'happy', '#e8a0a0').replace(/stroke="[^"]*"/, 'stroke="#f6c6c6"');
    if (o.beard === 'long') g += P('M-15 ' + (hy + 2) + ' Q-16 ' + (hy + 30) + ' 0 ' + (hy + 38) + ' Q16 ' + (hy + 30) + ' 15 ' + (hy + 2) + ' Q9 ' + (hy + 10) + ' 0 ' + (hy + 9) + ' Q-9 ' + (hy + 10) + ' -15 ' + (hy + 2) + 'Z', o.beardC || hair);
    if (o.beard === 'mustache' || o.beard === 'full' || o.beard === 'long') g += P('M-8 ' + (hy + 8.6) + ' Q-4 ' + (hy + 5) + ' 0.2 ' + (hy + 7.4) + ' Q4 ' + (hy + 5) + ' 8 ' + (hy + 8.6) + ' Q4 ' + (hy + 10.6) + ' 0.2 ' + (hy + 9) + ' Q-4 ' + (hy + 10.6) + ' -8 ' + (hy + 8.6) + 'Z', o.beardC || hair);
    // headwear
    var hc = o.headC || '#c0392b';
    if (o.head === 'turban') g += E(0, hy - 14, 21, 12, hc) + S('M-17 ' + (hy - 14) + ' Q0 ' + (hy - 6) + ' 17 ' + (hy - 14), lt(hc, 0.4), 1.3) + S('M-14 ' + (hy - 20) + ' Q0 ' + (hy - 11) + ' 14 ' + (hy - 20), lt(hc, 0.4), 1.3) + S('M-9 ' + (hy - 24) + ' Q0 ' + (hy - 17) + ' 9 ' + (hy - 24), dk(hc, 0.2), 1.2) + shine('M-16 ' + (hy - 20) + ' Q-8 ' + (hy - 26) + ' 2 ' + (hy - 25) + ' Q-8 ' + (hy - 22) + ' -16 ' + (hy - 16) + 'Z', 0.3) + (o.gem ? C(0, hy - 14, 3.2, '#ffd34d') + C(0, hy - 14, 1.5, o.gem, false) : '');
    if (o.head === 'bigturban') g += E(0, hy - 16, 25, 15, hc) + S('M-21 ' + (hy - 14) + ' Q0 ' + (hy - 4) + ' 21 ' + (hy - 14), lt(hc, 0.4), 1.3) + S('M-17 ' + (hy - 21) + ' Q0 ' + (hy - 10) + ' 17 ' + (hy - 21), lt(hc, 0.4), 1.3) + S('M-11 ' + (hy - 28) + ' Q0 ' + (hy - 19) + ' 11 ' + (hy - 28), dk(hc, 0.2), 1.2) + shine('M-19 ' + (hy - 22) + ' Q-9 ' + (hy - 30) + ' 4 ' + (hy - 29) + ' Q-9 ' + (hy - 25) + ' -19 ' + (hy - 17) + 'Z', 0.3);
    if (o.head === 'fez') g += P('M-11 ' + (hy - 13) + ' L-8 ' + (hy - 29) + ' H8 L11 ' + (hy - 13) + ' Q0 ' + (hy - 9) + ' -11 ' + (hy - 13) + 'Z', hc) + S('M0 ' + (hy - 29) + ' Q10 ' + (hy - 24) + ' 11 ' + (hy - 14), '#222', 1.4) + C(11, hy - 13, 2, '#222', false) + shine('M-8 ' + (hy - 27) + ' L-6 ' + (hy - 15) + ' L-8 ' + (hy - 15) + 'Z', 0.3);
    if (o.head === 'cap') g += P('M-14 ' + (hy - 11) + ' Q0 ' + (hy - 30) + ' 14 ' + (hy - 11) + ' Q0 ' + (hy - 8) + ' -14 ' + (hy - 11) + 'Z', hc) + S('M-12 ' + (hy - 12) + ' Q0 ' + (hy - 9) + ' 12 ' + (hy - 12), dk(hc, 0.3), 1);
    if (o.head === 'crown') g += P('M-13 ' + (hy - 13) + ' L-14 ' + (hy - 28) + ' L-7 ' + (hy - 21) + ' L0 ' + (hy - 31) + ' L7 ' + (hy - 21) + ' L14 ' + (hy - 28) + ' L13 ' + (hy - 13) + ' Q0 ' + (hy - 9) + ' -13 ' + (hy - 13) + 'Z', '#ffcd3c') + C(0, hy - 19, 2.3, o.gem || '#e0245e', false) + C(-8, hy - 17, 1.7, '#3cc7ff', false) + C(8, hy - 17, 1.7, '#3cc7ff', false) + shine('M-11 ' + (hy - 15) + ' L-11 ' + (hy - 24) + ' L-7 ' + (hy - 19) + 'Z', 0.4);
    if (o.head === 'tiara') g += P('M-8 ' + (hy - 15) + ' L-6 ' + (hy - 22) + ' L-2 ' + (hy - 17) + ' L0 ' + (hy - 25) + ' L2 ' + (hy - 17) + ' L6 ' + (hy - 22) + ' L8 ' + (hy - 15) + ' Q0 ' + (hy - 12) + ' -8 ' + (hy - 15) + 'Z', '#ffcd3c') + C(0, hy - 18, 1.8, o.gem || '#e0245e', false);
    if (o.head === 'pointy') g += P('M-16 ' + (hy - 11) + ' L0 ' + (hy - 44) + ' L16 ' + (hy - 11) + ' Q0 ' + (hy - 6) + ' -16 ' + (hy - 11) + 'Z', hc) + S('M-14 ' + (hy - 13) + ' Q0 ' + (hy - 8) + ' 14 ' + (hy - 13), '#ffd34d', 1.6);
    if (o.horns) g += P('M-12 ' + (hy - 14) + ' Q-20 ' + (hy - 30) + ' -8 ' + (hy - 28) + ' Q-14 ' + (hy - 22) + ' -8 ' + (hy - 14) + 'Z', '#efe0b8') + P('M12 ' + (hy - 14) + ' Q20 ' + (hy - 30) + ' 8 ' + (hy - 28) + ' Q14 ' + (hy - 22) + ' 8 ' + (hy - 14) + 'Z', '#efe0b8');
    if (o.staff) g += R(34, -92, 3.4, 90, 1.6, '#8a5a2b') + C(35.7, -94, 5, o.staffC || '#7ae0ff', ' stroke="rgba(52,26,12,.5)" stroke-width="1"');
    if (o.wand) g += S('M20 -44 L38 -66', '#d8b06a', 2.2) + P('M38 -72 L40 -67 L45 -66 L41 -63 L42 -58 L38 -61 L34 -58 L35 -63 L31 -66 L36 -67Z', '#ffe27a', ' stroke="#fff" stroke-width=".6"');
    return g;
  }
  var SK = { tan: '#c98f62', brown: '#a8744c', fair: '#f0c8a0', light: '#e8b88a', warm: '#d9a06f' };
  var PEOPLE = {
    alibaba: { skin: SK.tan, hair: '#2a1a10', beard: 'mustache', head: 'turban', headC: '#e8dcc0', robe: '#7a9a5a', sash: '#8a4a2a', trim: '#d8c9a0', vest: '#8a6a3a' },
    qasim: { skin: SK.tan, hair: '#2a1a10', beard: 'full', head: 'turban', headC: '#7a2fb0', gem: '#2ee6c8', robe: '#e0a82a', sash: '#8e1f2f', trim: '#fff0a0', wide: 1.18 },
    morgiana: { skin: SK.warm, hair: '#2a1a10', hs: 'long', head: 'scarf', headC: '#e0546c', robe: '#e0546c', kind: 'dress', trim: '#f6c46c', sash: '#f6c46c', apron: '#fbf0d8' },
    robber: { skin: SK.brown, hair: '#151010', beard: 'mustache', head: 'turban', headC: '#2a2530', robe: '#3a2b4a', sash: '#c0392b', trim: '#6a5a8a', mood: 'angry' },
    aladdin: { skin: SK.warm, hair: '#1f140c', head: 'fez', headC: '#d0392b', robe: '#2e86c1', kind: 'tunic', sash: '#d0392b', pants: '#f2e6c8', trim: '#f6d98a' },
    aladdinMom: { skin: SK.tan, hair: '#5a4a3a', head: 'scarf', headC: '#7a8f5a', robe: '#8a6a4a', kind: 'dress', trim: '#c9b48a', sash: '#c9b48a' },
    sorcerer: { skin: '#b98d6a', hair: '#2a2430', beardC: '#3a3040', beard: 'long', head: 'pointy', headC: '#3a1560', robe: '#5b2a86', sash: '#d6a02a', trim: '#b080e0', staff: true, staffC: '#a45cff', mood: 'angry' },
    jasmine: { skin: SK.warm, hair: '#120a08', hs: 'long', head: 'tiara', robe: '#1fb5a8', kind: 'dress', trim: '#ffd34d', sash: '#ffd34d' },
    sultan: { skin: SK.light, hair: '#f2f2f2', beardC: '#f2f2f2', beard: 'full', head: 'bigturban', headC: '#f4f1e8', robe: '#8e1f2f', sash: '#ffcd3c', trim: '#ffcd3c', wide: 1.15, cape: '#6a1220' },
    sindbad: { skin: SK.tan, hair: '#2a1a10', beard: 'mustache', head: 'turban', headC: '#2c6fbb', gem: '#e0245e', robe: '#1f9d8b', sash: '#c0392b', trim: '#f6d98a', vest: '#c0392b' },
    sailor: { skin: SK.brown, hair: '#2a1a10', head: 'cap', headC: '#f2ead8', robe: '#4a7aa8', kind: 'tunic', sash: '#8a5a2b', pants: '#6a5a4a' },
    shater: { skin: SK.tan, hair: '#1f140c', head: 'fez', headC: '#d0392b', robe: '#efe6cc', sash: '#2e6f9e', trim: '#2e6f9e', vest: '#2e6f9e', beard: 'mustache' },
    sitt: { skin: SK.light, hair: '#1a0f0c', hs: 'long', head: 'tiara', gem: '#2ee6c8', robe: '#d65a9a', kind: 'dress', trim: '#ffd34d', sash: '#ffd34d' },
    grandma: { skin: SK.light, hair: '#d8d8e0', head: 'scarf', headC: '#8a7aa8', robe: '#7a6a9a', kind: 'dress', trim: '#c8b8e0', sash: '#c8b8e0', glasses: true, apron: '#efe6f2' },
    ogre: { skin: '#8aa86a', hair: '#3a2a1a', hs: 'short', robe: '#6a4a2a', sash: '#3a2a1a', trim: '#8a6a3a', mood: 'angry', horns: true, wide: 1.3, brow: '#2a1a10' },
    goha: { skin: SK.tan, hair: '#8a8a8a', beardC: '#a8a8a8', beard: 'mustache', head: 'bigturban', headC: '#f2f2f2', robe: '#8a6a3a', sash: '#c9a96a', trim: '#d8c090', wide: 1.1 },
    gohaSon: { skin: SK.tan, hair: '#1f140c', head: 'cap', headC: '#f2f2f2', robe: '#4a8abf', kind: 'tunic', sash: '#d8b04a', pants: '#e8dcc0', child: 1 },
    villager: { skin: SK.brown, hair: '#2a1a10', beard: 'mustache', head: 'turban', headC: '#e8dcc0', robe: '#b0805a', sash: '#6a4a2a', trim: '#e0c8a0' },
    villagerW: { skin: SK.tan, hair: '#2a1a10', head: 'scarf', headC: '#4a8a8a', robe: '#4a8a8a', kind: 'dress', trim: '#e0c8a0', sash: '#e0c8a0' },
    hunter: { skin: SK.tan, hair: '#2a1a10', beard: 'mustache', head: 'cap', headC: '#6a5a3a', robe: '#8a7a4a', kind: 'tunic', sash: '#4a3a2a', pants: '#5a4a3a', mood: 'angry' },
    layla: { skin: SK.fair, hair: '#6a3a1a', head: 'hood', headC: '#d62d2d', robe: '#f2f2e8', kind: 'dress', trim: '#d62d2d', sash: '#d62d2d', cape: '#d62d2d', apron: '#fbfbf0', child: 1 },
    mother: { skin: SK.fair, hair: '#6a3a1a', hs: 'bun', robe: '#7aa8d8', kind: 'dress', trim: '#f6f0e0', sash: '#f6f0e0', apron: '#fbfbf0' },
    woodcutter: { skin: SK.light, hair: '#6a3a1a', beard: 'full', head: 'cap', headC: '#3a6a3a', robe: '#b5453a', kind: 'tunic', sash: '#4a3a2a', pants: '#4a5a6a', wide: 1.15 },
    cinderella: { skin: SK.fair, hair: '#e8c25a', hs: 'bun', robe: '#a59a88', kind: 'dress', trim: '#8a7f70', sash: '#8a7f70', apron: '#d8cfc0' },
    cinderellaGown: { skin: SK.fair, hair: '#e8c25a', hs: 'bun', head: 'tiara', gem: '#3cc7ff', robe: '#7fb8f0', kind: 'dress', trim: '#fff', sash: '#fff', wide: 1 },
    stepmother: { skin: SK.light, hair: '#3a2a3a', hs: 'bun', robe: '#7b3f8c', kind: 'dress', trim: '#c98ad8', sash: '#c98ad8', mood: 'angry' },
    sister1: { skin: SK.light, hair: '#8a4a2a', hs: 'long', robe: '#f06fa6', kind: 'dress', trim: '#ffd0e4', sash: '#ffd0e4', mood: 'angry' },
    sister2: { skin: SK.light, hair: '#c98a3a', hs: 'long', robe: '#f0c24a', kind: 'dress', trim: '#fff0b0', sash: '#fff0b0', mood: 'angry' },
    fairy: { skin: SK.fair, hair: '#d8c2f0', hs: 'bun', head: 'tiara', gem: '#c06aff', robe: '#c6a2f0', kind: 'dress', trim: '#fff', sash: '#fff', wings: true, wand: true },
    prince: { skin: SK.fair, hair: '#5a3a1a', head: 'none', robe: '#2f4f9c', kind: 'prince', trim: '#ffd34d', sash: '#ffd34d', pants: '#e8e0f0', cape: '#c0392b' },
    farmer: { skin: SK.tan, hair: '#5a4a3a', head: 'scarf', headC: '#e8dcc0', robe: '#8a6a3a', kind: 'dress', trim: '#d8c090', sash: '#d8c090', apron: '#f0e6c8' },
    shepherd: { skin: SK.warm, hair: '#2a1a10', head: 'cap', headC: '#c9a96a', robe: '#b9a05a', kind: 'tunic', sash: '#6a4a2a', pants: '#8a7a5a', child: 1 },
    fisherman: { skin: SK.brown, hair: '#8a8a8a', beardC: '#8a8a8a', beard: 'full', head: 'cap', headC: '#a89060', robe: '#8a7a5a', kind: 'tunic', sash: '#5a4a3a', pants: '#6a5a4a' },
    goldilocks: { skin: SK.fair, hair: '#f0c84a', hs: 'long', robe: '#6fa8e8', kind: 'dress', trim: '#fff', sash: '#fff', apron: '#fff', child: 1 },
    child: { skin: SK.warm, hair: '#2a1a10', robe: '#e0a82a', kind: 'tunic', sash: '#b07a1a', pants: '#e8dcc0', child: 1 },
    man: { skin: SK.tan, hair: '#2a1a10', beard: 'mustache', head: 'turban', headC: '#e8dcc0', robe: '#7a8fb0', sash: '#5a4a3a' },
    woman: { skin: SK.warm, hair: '#2a1a10', hs: 'long', robe: '#c06aa0', kind: 'dress', trim: '#f0d0e0', sash: '#f0d0e0' }
  };

  function genie(o) {
    o = o || {}; var c = o.color || '#3aa6e8', mood = o.mood || 'happy', g = '';
    g += P('M-10 -48 Q-24 -30 -8 -18 Q8 -8 -2 0 Q18 -10 6 -22 Q22 -34 10 -48Z', 'rgba(' + (o.smoke || '160,215,255') + ',.8)', ' stroke="rgba(255,255,255,.6)" stroke-width="1"');
    g += P('M-16 -66 Q-20 -50 -12 -44 L12 -44 Q20 -50 16 -66Z', c) + P('M-15 -46 Q0 -38 15 -46 L13 -40 Q0 -33 -13 -40Z', '#7a3fc0') + R(-15, -48, 30, 4, 2, '#ffd34d', false);
    g += arm(-15, -62, -9, -50, c, c) + arm(15, -62, 9, -50, c, c) + C(-8, -50, 4.4, c) + C(8, -50, 4.4, c);
    g += E(0, -76, 17, 18, c) + shadow('M6 -91 Q19 -76 8 -61 Q16 -76 6 -91Z', 0.18) + shine('M-11 -86 Q-14 -78 -12 -72 Q-10 -78 -8 -85Z', 0.3);
    g += eyes(-77, 6.4, mood, '#1a3a5a') + brows(-85, 6.4, mood, '#14213a') + mouth(-66, mood === 'happy' ? 'laugh' : mood, '#5a1a30');
    g += P('M-9 -69 Q0 -60 9 -69 Q4 -59 0 -58 Q-4 -59 -9 -69Z', '#14213a') + S('M-8 -68 Q0 -62 8 -68', '#14213a', 1);   // goatee
    g += P('M-4 -92 Q-8 -112 4 -106 Q10 -100 4 -92Z', c, OL) + C(2, -108, 3, '#ffd34d') + R(-15, -94, 30, 5, 2, '#ffd34d') + C(0, -92, 2.4, '#e0245e', false);
    g += C(-18, -74, 2.4, '#ffd34d') + C(18, -74, 2.4, '#ffd34d');
    return g;
  }

  // ---------------------------------------------------------------- animals (side view, facing right)
  function legs(xs, y0, h, c, w) { return xs.map(function (x) { return R(x - (w || 3.6), y0, (w || 3.6) * 2, h, 2.4, c) + E(x + 0.6, y0 + h, (w || 3.6) + 1.2, 2.2, dk(c, 0.35)); }).join(''); }
  function faceSide(x, y, s, mood, noseC) {
    var e = mood === 'sleep' ? S('M' + (x - 2.4 * s) + ' ' + y + ' Q' + x + ' ' + (y + 2) + ' ' + (x + 2.4 * s) + ' ' + y, '#2a1608', 1.3) : '<g class="blink">' + E(x, y, 2.8 * s, 3.2 * s, '#fff', ' stroke="rgba(52,26,12,.5)" stroke-width=".6"') + C(x + 0.5, y + 0.2, 1.8 * s, '#1a0e06', false) + C(x + 1.1, y - 0.6, 0.7 * s, '#fff', false) + '</g>';
    return e;
  }
  function quad(o) {
    var c = o.c, belly = o.belly || lt(c, 0.35), mood = o.mood || 'happy', g = '', bl = o.bl || 26, bh = o.bh || 14, leg = o.leg || 18, by = -(leg + bh - 2), hx = o.hx || (bl + 2), hy = o.hy || (by - 9), hr = o.hr || 12;
    if (o.tail === 'bushy') g += P('M-' + (bl - 2) + ' ' + (by - 2) + ' Q-' + (bl + 22) + ' ' + (by - 22) + ' -' + (bl + 16) + ' ' + (by + 8) + ' Q-' + (bl + 6) + ' ' + (by + 4) + ' -' + (bl - 2) + ' ' + (by + 4) + 'Z', c) + (o.tip ? P('M-' + (bl + 14) + ' ' + (by - 2) + ' Q-' + (bl + 22) + ' ' + (by - 14) + ' -' + (bl + 16) + ' ' + (by + 8) + ' Q-' + (bl + 11) + ' ' + (by + 4) + ' -' + (bl + 8) + ' ' + (by + 1) + 'Z', o.tip) : '');
    else if (o.tail === 'tuft') g += S('M-' + (bl - 2) + ' ' + (by) + ' Q-' + (bl + 12) + ' ' + (by + 6) + ' -' + (bl + 10) + ' ' + (by - 12), dk(c, 0.2), 3) + E(-(bl + 10), by - 14, 4, 6, o.tuft || '#6a3a14');
    else if (o.tail === 'thin') g += S('M-' + (bl - 2) + ' ' + (by + 4) + ' Q-' + (bl + 14) + ' ' + (by + 12) + ' -' + (bl + 16) + ' ' + (by - 6) + ' Q-' + (bl + 17) + ' ' + (by - 12) + ' -' + (bl + 12) + ' ' + (by - 14), dk(c, 0.1), 1.8);
    else if (o.tail === 'puff') g += C(-bl - 2, by + 2, 6, '#fff');
    else if (o.tail === 'curl') g += S('M-' + (bl - 2) + ' ' + (by) + ' q-6 -2 -4 -6 q4 -4 6 0', '#e88aa0', 2);
    else if (o.tail === 'flow') g += P('M-' + (bl - 3) + ' ' + (by - 4) + ' Q-' + (bl + 16) + ' ' + (by - 6) + ' -' + (bl + 12) + ' ' + (by + 22) + ' Q-' + (bl + 4) + ' ' + (by + 8) + ' -' + (bl - 3) + ' ' + (by + 6) + 'Z', o.mane || dk(c, 0.4));
    else g += E(-bl, by + 2, 4, 3, c);
    g += legs([-bl + 7, -bl + 15, bl - 15, bl - 7], by + bh - 4, leg + 4, o.legC || c, o.lw);
    if (o.neck) g += P('M' + (bl - 12) + ' ' + (by - 6) + ' Q' + (bl - 2) + ' ' + (hy + 6) + ' ' + (hx - 8) + ' ' + (hy + 6) + ' L' + (hx + 6) + ' ' + (hy + 12) + ' Q' + (bl + 4) + ' ' + (by + 12) + ' ' + (bl - 6) + ' ' + (by + 12) + 'Z', c);
    g += E(0, by, bl, bh, c) + P('M-' + (bl - 6) + ' ' + (by + 6) + ' Q0 ' + (by + bh + 3) + ' ' + (bl - 6) + ' ' + (by + 6) + ' Q0 ' + (by + bh - 3) + ' -' + (bl - 6) + ' ' + (by + 6) + 'Z', belly, false) + shadow('M' + (-bl + 2) + ' ' + (by + 4) + ' Q0 ' + (by + bh + 5) + ' ' + (bl - 2) + ' ' + (by + 4) + ' Q0 ' + (by + bh - 2) + ' ' + (-bl + 2) + ' ' + (by + 4) + 'Z', 0.15) + shine('M-' + (bl - 8) + ' ' + (by - 8) + ' Q0 ' + (by - bh + 1) + ' ' + (bl - 12) + ' ' + (by - 8) + ' Q0 ' + (by - bh + 6) + ' -' + (bl - 8) + ' ' + (by - 8) + 'Z', 0.22);
    if (o.hump) g += o.hump.map(function (x) { return E(x, by - bh, 9, 10, c) + shine('M' + (x - 5) + ' ' + (by - bh - 4) + ' Q' + x + ' ' + (by - bh - 10) + ' ' + (x + 3) + ' ' + (by - bh - 8) + ' Q' + x + ' ' + (by - bh - 6) + ' ' + (x - 5) + ' ' + (by - bh - 4) + 'Z', 0.25); }).join('');
    if (o.stripes) for (var i = -3; i <= 3; i++) g += S('M' + (i * 6) + ' ' + (by - bh + 1) + ' q2 ' + (bh * 0.7) + ' -1 ' + (bh * 1.1), o.stripes, 2);
    if (o.wool) for (var w = -3; w <= 3; w++) g += C(w * 7, by - 5 + (w % 2) * 3, 8, '#fdfaf2') + C(w * 7, by + 6 - (w % 2) * 2, 7, '#f4efe2');
    if (o.mane) g += C(hx - 2, hy + 2, hr + 8, o.mane) + shadow('M' + (hx + 6) + ' ' + (hy - 16) + ' a18 18 0 0 1 0 36 a14 14 0 0 0 0 -36Z', 0.2);
    if (o.hair) g += P('M' + (hx - 12) + ' ' + (hy - 8) + ' Q' + (hx - 18) + ' ' + (hy + 14) + ' ' + (bl - 12) + ' ' + (by - 4) + ' L' + (bl - 2) + ' ' + (by - 10) + ' Q' + (hx - 6) + ' ' + (hy - 6) + ' ' + (hx - 4) + ' ' + (hy - 14) + 'Z', o.hair);
    // head
    g += E(hx, hy, hr, hr - 1, c) + shine('M' + (hx - 6) + ' ' + (hy - 8) + ' Q' + (hx - 1) + ' ' + (hy - 11) + ' ' + (hx + 4) + ' ' + (hy - 9) + ' Q' + (hx - 1) + ' ' + (hy - 7) + ' ' + (hx - 6) + ' ' + (hy - 8) + 'Z', 0.3);
    var sx = hx + hr * 0.62, sy = hy + 3.6, sl = o.snout || 7;
    g += E(sx + sl * 0.3, sy, sl, sl * 0.72, o.muzzle || belly) + (o.snoutLong ? E(sx + sl * 0.9, sy + 1, sl * 0.9, sl * 0.6, o.muzzle || belly) : '');
    g += E(sx + sl * (o.snoutLong ? 1.7 : 1), sy - 2, 2.4, 1.8, o.nose || '#3a2220', false);
    if (o.ear === 'round') g += C(hx - 5, hy - hr + 1, 4.4, c) + C(hx - 5, hy - hr + 1, 2.2, '#f0a0a0', false) + C(hx + 4, hy - hr + 2, 4, c);
    else if (o.ear === 'point') g += P('M' + (hx - 9) + ' ' + (hy - 6) + ' L' + (hx - 7) + ' ' + (hy - hr - 10) + ' L' + (hx - 1) + ' ' + (hy - hr + 1) + 'Z', c) + P('M' + (hx - 3) + ' ' + (hy - hr + 1) + ' L' + (hx + 3) + ' ' + (hy - hr - 9) + ' L' + (hx + 7) + ' ' + (hy - hr + 4) + 'Z', c) + P('M' + (hx - 7) + ' ' + (hy - hr - 4) + ' L' + (hx - 3) + ' ' + (hy - hr + 1) + ' L' + (hx - 8) + ' ' + (hy - hr + 2) + 'Z', '#f0a0a0', false);
    else if (o.ear === 'long') g += E(hx - 4, hy - hr - 12, 3.6, 13, c) + E(hx - 4, hy - hr - 11, 1.8, 9, '#f0a0a0', false) + E(hx + 4, hy - hr - 10, 3.4, 12, dk(c, 0.1)) + E(hx + 4, hy - hr - 9, 1.6, 8, '#f0a0a0', false);
    else if (o.ear === 'big') g += E(hx - 5, hy - hr - 8, 5, 12, c) + E(hx - 5, hy - hr - 7, 2.6, 8, '#f0a0a0', false) + E(hx + 4, hy - hr - 7, 4.6, 11, dk(c, 0.1));
    else if (o.ear === 'floppy') g += E(hx - 8, hy - 2, 5, 9, dk(c, 0.15)) + P('M' + (hx - 5) + ' ' + (hy - hr + 2) + ' L' + (hx - 2) + ' ' + (hy - hr - 6) + ' L' + (hx + 3) + ' ' + (hy - hr + 3) + 'Z', c);
    g += faceSide(hx + 2, hy - 2, 1.1, mood) + S('M' + (hx - 0.5) + ' ' + (hy - 6.6) + ' q3 ' + (mood === 'angry' ? 2.6 : -1.6) + ' 6.4 0', '#2a1608', 1.2);
    var my = sy + sl * 0.7;
    if (mood === 'angry' || mood === 'scared') g += P('M' + (sx + 1) + ' ' + my + ' Q' + (sx + sl) + ' ' + (my + 4) + ' ' + (sx + sl * 1.6) + ' ' + (my - 1) + ' L' + (sx + sl * 1.5) + ' ' + (my + 3) + ' Q' + (sx + sl) + ' ' + (my + 8) + ' ' + (sx + 1) + ' ' + (my + 2) + 'Z', '#5a1a18', false) + (o.fangs ? P('M' + (sx + 3) + ' ' + (my + 1) + ' l1.6 3.6 l1.6 -3.6Z', '#fff', false) : '');
    else g += S('M' + (sx + 1) + ' ' + my + ' Q' + (sx + sl * 0.9) + ' ' + (my + (mood === 'sad' ? -0.2 : 2.6)) + ' ' + (sx + sl * 1.5) + ' ' + (my + (mood === 'sad' ? 1 : -0.4)), '#4a1a14', 1.1);
    if (o.whisk) g += S('M' + (sx + 3) + ' ' + (sy + 1) + ' l8 -3 M' + (sx + 3) + ' ' + (sy + 2.6) + ' l9 1', '#fff', 0.7);
    if (o.horn) g += P('M' + (hx + 2) + ' ' + (hy - hr) + ' l3 -10 l3 10Z', '#efe0b8');
    return g;
  }

  function bird(o) {
    var c = o.c, mood = o.mood || 'happy', g = '', s = o.s || 1, neck = o.neck || 0, belly = o.belly || lt(c, 0.4);
    // legs
    g += S('M-4 -12 V0 M4 -12 V0', o.legC || '#e8903a', 2.2) + S('M-8 0 H-1 M0 0 H7', o.legC || '#e8903a', 2.2);
    if (o.tail !== false) g += P('M-18 -26 Q-34 -34 -32 -20 Q-26 -22 -16 -18Z', dk(c, 0.2));
    if (neck) g += P('M6 -30 Q' + (14 + neck) + ' ' + (-48 - neck * 2) + ' 10 ' + (-62 - neck * 2) + ' L18 ' + (-62 - neck * 2) + ' Q' + (20 + neck) + ' ' + (-44 - neck) + ' 16 -24Z', c);
    g += E(0, -24, 19, 14, c) + P('M-12 -20 Q0 -6 14 -20 Q0 -12 -12 -20Z', belly, false) + shine('M-12 -32 Q-2 -40 10 -34 Q-2 -34 -12 -32Z', 0.3);
    g += P('M-14 -26 Q-6 -40 8 -24 Q-2 -14 -14 -26Z', dk(c, 0.15)) + S('M-10 -26 Q-2 -32 4 -26', lt(c, 0.3), 1);
    var hx = 14 + neck, hy = -36 - neck * 2.2;
    g += C(hx, hy, o.hr || 10, c) + shine('M' + (hx - 5) + ' ' + (hy - 6) + ' Q' + hx + ' ' + (hy - 9) + ' ' + (hx + 4) + ' ' + (hy - 7) + 'Z', 0.3);
    g += (o.beak === 'duck' ? P('M' + (hx + 7) + ' ' + (hy + 1) + ' Q' + (hx + 20) + ' ' + (hy - 1) + ' ' + (hx + 18) + ' ' + (hy + 5) + ' Q' + (hx + 12) + ' ' + (hy + 7) + ' ' + (hx + 6) + ' ' + (hy + 5) + 'Z', '#ffa733') : P('M' + (hx + 7) + ' ' + (hy - 2) + ' L' + (hx + 17) + ' ' + (hy + 1) + ' L' + (hx + 7) + ' ' + (hy + 4) + 'Z', o.beakC || '#ffb133'));
    g += faceSide(hx + 2, hy - 2, 0.95, mood);
    if (o.crest) g += P('M' + (hx - 4) + ' ' + (hy - 9) + ' Q' + (hx - 2) + ' ' + (hy - 18) + ' ' + (hx + 3) + ' ' + (hy - 10) + ' Q' + (hx + 6) + ' ' + (hy - 17) + ' ' + (hx + 6) + ' ' + (hy - 8) + 'Z', o.crest);
    if (o.wattle) g += E(hx + 6, hy + 7, 2.6, 4, '#e0382a');
    return g;
  }
  function eagle(o) {
    var c = o.c || '#6a4a2a', mood = o.mood || 'happy', g = '';
    g += P('M0 -50 Q-54 -80 -88 -44 Q-70 -46 -62 -34 Q-48 -44 -34 -30 Q-20 -38 0 -34Z', c) + P('M0 -50 Q54 -80 88 -44 Q70 -46 62 -34 Q48 -44 34 -30 Q20 -38 0 -34Z', dk(c, 0.15));
    g += S('M-60 -52 Q-46 -52 -30 -42 M60 -52 Q46 -52 30 -42', lt(c, 0.3), 1.4);
    g += E(0, -34, 14, 22, c) + E(0, -28, 8, 14, lt(c, 0.45), false) + P('M-8 -14 L-12 4 L0 -6 L12 4 L8 -14Z', dk(c, 0.2));
    g += C(0, -62, 11, '#f6f0e0') + P('M-3 -62 L12 -56 L-2 -52Z', '#ffb133') + faceSide(5, -64, 1, mood);
    return g;
  }
  function tortoise(o) {
    var mood = o.mood || 'happy', c = o.c || '#4f9a4a', g = '';
    g += P('M20 -12 Q28 -14 30 -20 L42 -20 Q46 -12 40 -6 Q30 -4 20 -6Z', '#9acd6a') + faceSide(37, -16, 1, mood) + S('M38 -10 q3 2 6 0', '#4a1a14', 1);
    g += R(-18, -8, 9, 8, 4, '#9acd6a') + R(8, -8, 9, 8, 4, '#9acd6a') + P('M-26 -8 L-34 -4 L-24 -4Z', '#9acd6a');
    g += P('M-27 -8 Q-27 -32 0 -32 Q27 -32 27 -8Z', c) + shine('M-18 -14 Q-16 -26 -2 -29 Q-14 -22 -14 -14Z', 0.3) + S('M-18 -20 L-4 -22 L10 -20 L18 -14 M-4 -22 L-2 -8 M10 -20 L12 -8 M-18 -20 L-20 -9', dk(c, 0.35), 1.4) + R(-27, -9, 54, 4, 2, '#d9b96a');
    return g;
  }
  function ant(o) {
    var c = o.c || '#7a3a1a', g = '';
    for (var i = 0; i < 3; i++) g += S('M' + (-6 + i * 6) + ' -14 L' + (-12 + i * 7) + ' -2 M' + (-6 + i * 6) + ' -14 L' + (-2 + i * 7) + ' -1', '#3a1a0a', 1.6);
    g += E(-16, -18, 10, 7, c) + E(0, -16, 6, 5, dk(c, 0.1)) + E(12, -19, 7.4, 7, c) + S('M16 -25 Q20 -34 26 -33 M13 -26 Q15 -36 21 -38', '#3a1a0a', 1.2);
    g += '<g class="blink">' + C(16, -20, 2.2, '#fff', false) + C(16.4, -20, 1.2, '#111', false) + '</g>' + S('M14 -15 Q17 -13 20 -16', '#3a1a0a', 1);
    return g;
  }
  function hopper(o) {
    var c = o.c || '#5ab23a', g = '';
    g += S('M-4 -14 L-18 -30 L-26 -2 M-4 -14 L8 -4 M2 -14 L14 -3', dk(c, 0.2), 3.4) + S('M-26 -2 l-6 0', dk(c, 0.2), 2.4);
    g += P('M-24 -18 Q-6 -34 14 -18 Q4 -8 -24 -18Z', c) + shine('M-16 -22 Q-4 -30 8 -22 Q-4 -24 -16 -22Z', 0.3) + P('M-26 -18 Q-34 -24 -40 -34 Q-28 -28 -22 -20Z', lt(c, 0.2));
    g += E(14, -22, 8, 7.4, c) + '<g class="blink">' + C(17, -25, 2.8, '#fff', false) + C(17.4, -25, 1.5, '#111', false) + '</g>' + S('M20 -28 Q26 -42 34 -44 M16 -29 Q18 -44 26 -48', '#3a5a1a', 1.2) + S('M15 -17 Q19 -15 22 -18', '#2a3a10', 1.1);
    return g;
  }
  function whale(o) {
    var c = o.c || '#4a86c8', mood = o.mood || 'happy', g = '';
    g += P('M-52 -22 Q-70 -50 -58 -58 Q-54 -40 -44 -34Z', c) + P('M-52 -22 Q-72 -8 -62 2 Q-54 -10 -44 -16Z', dk(c, 0.1));
    g += P('M-48 -26 Q-40 -66 6 -58 Q52 -50 56 -26 Q56 0 8 2 Q-40 4 -48 -26Z', c) + P('M-30 -4 Q4 8 50 -6 Q56 -22 52 -26 Q20 -14 -30 -4Z', '#d8eefb', false) + shine('M-30 -50 Q-6 -62 22 -56 Q-6 -54 -30 -50Z', 0.3);
    g += S('M-6 -62 q-6 -14 -14 -16 M-6 -62 q6 -14 14 -16', 'rgba(200,235,255,.9)', 2.4) + '<g class="blink">' + E(36, -28, 4.6, 5, '#fff', false) + C(37, -28, 2.6, '#1a1a2a', false) + C(38, -29, 1, '#fff', false) + '</g>';
    g += S('M42 -16 Q50 -12 54 -20', '#1a3a5a', 1.8) + P('M-6 -22 Q8 -8 26 -20 Q10 -18 -6 -22Z', dk(c, 0.2));
    return g;
  }
  function croc(o) {
    var c = o.c || '#5aa04a', mood = o.mood || 'happy', g = '';
    g += P('M-34 -12 Q-58 -8 -66 -20 Q-50 -16 -36 -22Z', c) + legs([-20, 8], -12, 12, dk(c, 0.1), 3.6);
    g += P('M-36 -14 Q-38 -30 -14 -30 Q10 -30 24 -22 L56 -22 Q62 -20 60 -16 L24 -10 Q10 -6 -14 -8 Q-34 -6 -36 -14Z', c) + P('M-26 -8 Q-4 -4 24 -10 L56 -17 L24 -14 Q-6 -10 -30 -12Z', '#e8e0a0', false) + shine('M-26 -26 Q-6 -30 12 -26 Q-6 -24 -26 -26Z', 0.25);
    g += S('M-26 -29 l3 -4 l3 4 M-14 -30 l3 -4 l3 4 M-2 -30 l3 -4 l3 4', dk(c, 0.2), 1.4) + P('M26 -22 l3 4 l3 -4 l3 4 l3 -4 l3 4 l3 -4 l3 4 l3 -4Z', '#fff', false);
    g += E(22, -28, 4.6, 5.4, '#fff') + '<g class="blink">' + C(23, -28, 2.6, '#c8a010', false) + E(23, -28, 0.9, 2.4, '#000', false) + '</g>' + C(54, -21, 1.2, '#2a3a1a', false);
    return g;
  }
  function monkey(o) {
    var c = o.c || '#8a5a35', mood = o.mood || 'happy', g = '';
    g += S('M-12 -16 Q-34 -10 -28 -34 Q-24 -42 -18 -38', c, 4.4) + S('M-12 -16 Q-34 -10 -28 -34 Q-24 -42 -18 -38', dk(c, 0.3), 1, ' opacity=".5"');
    g += E(-7, -4, 6, 4, dk(c, 0.1)) + E(9, -4, 6, 4, dk(c, 0.1)) + E(0, -24, 14, 16, c) + E(1, -20, 9, 11, '#e8c8a0', false) + arm(-10, -34, -17, -16, c, c) + arm(10, -34, 18, -22, c, c);
    g += C(-15, -50, 5.4, c) + C(-15, -50, 2.8, '#e8c8a0', false) + C(15, -50, 5.4, c) + C(15, -50, 2.8, '#e8c8a0', false) + C(0, -48, 15, c) + E(0, -44, 10, 8.4, '#e8c8a0') + shine('M-9 -57 Q0 -62 8 -57 Q0 -58 -9 -57Z', 0.3);
    g += '<g class="blink">' + C(-5, -50, 2.6, '#fff', false) + C(5, -50, 2.6, '#fff', false) + C(-4.6, -50, 1.4, '#111', false) + C(5.4, -50, 1.4, '#111', false) + '</g>' + C(-1.6, -45, 0.9, '#5a3a1a', false) + C(1.6, -45, 0.9, '#5a3a1a', false) + (mood === 'happy' ? S('M-4 -40 Q0 -36 4 -40', '#5a2a1a', 1.4) : mood === 'laugh' ? P('M-5 -41 Q0 -33 5 -41Z', '#5a1a18', false) : S('M-4 -38 Q0 -42 4 -38', '#5a2a1a', 1.4));
    return g;
  }
  function pigAnimal(o) { return quad({ c: o.c || '#f4a6b8', belly: '#f8c8d2', bl: 22, bh: 14, leg: 12, hx: 24, hy: -30, hr: 12, snout: 6, muzzle: '#ee8aa0', nose: '#b0485e', ear: 'floppy', tail: 'curl', mood: o.mood, lw: 3.4 }) + E(31, -26, 5, 3.8, '#ee8aa0', false) + C(30, -26, 0.9, '#7a2a3a', false) + C(33, -26, 0.9, '#7a2a3a', false); }

  var ANIMALS = {
    lion: function (o) { return quad({ c: '#e0a548', belly: '#f2cf8a', mane: '#8a4b1c', ear: 'round', tail: 'tuft', snout: 6, muzzle: '#f2d6a0', nose: '#6a2a2a', bl: 28, bh: 15, leg: 17, hx: 32, hy: -42, hr: 12, mood: o.mood, fangs: 1 }); },
    horse: function (o) { return quad({ c: o.c || '#8a5a35', belly: lt(o.c || '#8a5a35', 0.2), neck: 1, hair: '#2a1a10', tail: 'flow', ear: 'point', snout: 9, snoutLong: 1, muzzle: lt(o.c || '#8a5a35', 0.25), nose: '#2a1a14', bl: 28, bh: 14, leg: 24, hx: 38, hy: -62, hr: 10, lw: 2.8, legC: dk(o.c || '#8a5a35', 0.05), mood: o.mood }); },
    donkey: function (o) { return quad({ c: '#9a948a', belly: '#d8d2c6', ear: 'big', tail: 'tuft', tuft: '#4a443a', snout: 8, snoutLong: 1, muzzle: '#e8e2d6', nose: '#3a3430', bl: 26, bh: 14, leg: 20, hx: 32, hy: -48, hr: 10, lw: 3, mood: o.mood }); },
    camel: function (o) { return quad({ c: '#d9b070', belly: '#ecd0a0', hump: [-8], tail: 'tuft', tuft: '#8a6a3a', neck: 1, ear: 'round', snout: 6, muzzle: '#ecd0a0', bl: 30, bh: 15, leg: 24, hx: 38, hy: -66, hr: 8, lw: 3, mood: o.mood }); },
    fox: function (o) { return quad({ c: '#e8782a', belly: '#fbe6cc', tail: 'bushy', tip: '#fff', ear: 'point', snout: 8, snoutLong: 1, muzzle: '#fbe6cc', nose: '#222', bl: 22, bh: 12, leg: 15, hx: 26, hy: -33, hr: 10, legC: '#4a2a1a', mood: o.mood }); },
    wolf: function (o) { return quad({ c: '#7a8089', belly: '#c8ccd2', tail: 'bushy', ear: 'point', snout: 9, snoutLong: 1, muzzle: '#b0b6be', nose: '#1a1a1a', bl: 26, bh: 14, leg: 20, hx: 30, hy: -41, hr: 11, mood: o.mood === 'happy' ? 'angry' : o.mood, fangs: 1, legC: '#5a6068' }); },
    bear: function (o) { return quad({ c: o.c || '#8a5a35', belly: lt(o.c || '#8a5a35', 0.25), ear: 'round', tail: 'tuft', tuft: o.c || '#8a5a35', snout: 6, muzzle: '#d8b890', nose: '#1a1010', bl: 26, bh: 18, leg: 14, hx: 28, hy: -38, hr: 13, lw: 4.4, mood: o.mood }); },
    pig: pigAnimal,
    sheep: function (o) { return quad({ c: '#4a3a34', belly: '#4a3a34', wool: true, ear: 'floppy', snout: 5, muzzle: '#5a4a44', nose: '#1a1010', bl: 24, bh: 14, leg: 14, hx: 26, hy: -30, hr: 9, lw: 2.8, legC: '#3a2a24', mood: o.mood }); },
    mouse: function (o) { return quad({ c: '#a8acb8', belly: '#e6e8ee', ear: 'round', tail: 'thin', snout: 4, snoutLong: 1, muzzle: '#e6e8ee', nose: '#e88a9a', bl: 12, bh: 8, leg: 6, hx: 14, hy: -17, hr: 7, lw: 1.8, whisk: 1, mood: o.mood }).replace(/<circle cx="(\d+)" cy="-(\d+)" r="4.4" fill="#a8acb8"/, '<circle cx="$1" cy="-$2" r="5.2" fill="#a8acb8"'); },
    hare: function (o) { return quad({ c: '#e8e0d0', belly: '#fffaf0', ear: 'long', tail: 'puff', snout: 4, muzzle: '#fffaf0', nose: '#e88a9a', bl: 18, bh: 13, leg: 10, hx: 20, hy: -27, hr: 9, lw: 3, whisk: 1, mood: o.mood }); },
    tortoise: tortoise, ant: ant, hopper: hopper, whale: whale, croc: croc, monkey: monkey, eagle: eagle,
    crow: function (o) { return bird({ c: '#3a3a4a', belly: '#4a4a5a', legC: '#222', beakC: '#2a2a2a', mood: o.mood, s: 1 }); },
    dove: function (o) { return bird({ c: '#e6e8f0', belly: '#fff', legC: '#e88a9a', beakC: '#f0a060', mood: o.mood }); },
    duck: function (o) { return bird({ c: '#7a5a3a', belly: '#d8c8a0', beak: 'duck', legC: '#ffa733', mood: o.mood, hr: 10 }); },
    duckling: function (o) { return bird({ c: o.c || '#ffd84a', belly: '#fff0a0', beak: 'duck', legC: '#ffa733', mood: o.mood, hr: 11 }); },
    ugly: function (o) { return bird({ c: '#a8a49c', belly: '#d8d4cc', beak: 'duck', legC: '#c8a060', mood: o.mood === 'happy' ? 'sad' : o.mood, hr: 10 }); },
    swan: function (o) { return bird({ c: '#fbfbff', belly: '#fff', beak: 'duck', beakC: '#ff9a3a', legC: '#444', mood: o.mood, neck: 12, hr: 8 }); },
    rooster: function (o) { return bird({ c: '#d8643a', belly: '#e8a060', crest: '#e0382a', wattle: 1, legC: '#d8a030', mood: o.mood }); }
  };
  var SIZE = { lion: 1, horse: 1.35, donkey: 1.1, camel: 1.5, fox: 0.9, wolf: 1.05, bear: 1, pig: 0.8, sheep: 0.75, mouse: 0.55, hare: 0.65, tortoise: 0.6, ant: 0.75, hopper: 0.8, whale: 1.2, croc: 0.8, monkey: 0.8, eagle: 1.5, crow: 0.8, dove: 0.85, duck: 0.6, duckling: 0.45, ugly: 0.55, swan: 0.8, rooster: 0.7 };

  // ---------------------------------------------------------------- props
  var PROPS = {
    lamp: function () { return '<g><ellipse cx="0" cy="-8" rx="26" ry="14" fill="rgba(255,220,100,.25)"/></g>' + P('M-18 -12 Q-14 -2 0 -2 Q14 -2 20 -12 Q8 -16 -18 -12Z', '#f2c230') + P('M-18 -12 Q-30 -26 -22 -28 Q-26 -18 -12 -14Z', '#f2c230') + P('M20 -12 L32 -18 L30 -14 L22 -10Z', '#f2c230') + P('M-4 -15 Q0 -24 4 -15Z', '#f2c230') + C(-26, -27, 2.4, '#fff3a0', false) + shine('M-10 -10 Q0 -14 12 -11 Q0 -10 -10 -10Z', 0.6) + P('M-3 -4 Q-6 -2 -3 0 L3 0 Q6 -2 3 -4Z', '#d9a010'); },
    chest: function () { return P('M-22 -16 L22 -16 L22 0 L-22 0Z', '#8a5a2b') + P('M-22 -16 Q-22 -32 0 -32 Q22 -32 22 -16Z', '#a56e34') + R(-22, -17, 44, 4, 1, '#ffcd3c') + R(-3, -20, 6, 9, 1.4, '#ffcd3c') + C(-10, -22, 4, '#ffd34d', false) + C(0, -24, 4.6, '#ffe27a', false) + C(9, -21, 3.6, '#ffd34d', false) + shine('M-18 -28 Q-8 -31 4 -30 Q-8 -27 -18 -25Z', 0.3); },
    coins: function () { return [[-14, -3], [-4, -3], [8, -3], [16, -5], [-9, -10], [2, -10], [12, -11], [-2, -17]].map(function (p) { return E(p[0], p[1], 7.4, 3.6, '#ffcd3c') + E(p[0] - 1, p[1] - 1, 4, 1.4, '#fff3a0', false); }).join(''); },
    gems: function () { return P('M-10 -4 L-4 -18 L4 -18 L10 -4 L0 4Z', '#3cc7ff') + P('M-4 -18 L0 -4 L4 -18Z', '#9be4ff', false) + P('M12 -2 L16 -10 L22 -2 L17 3Z', '#e0245e') + P('M-22 -2 L-18 -9 L-13 -2 L-18 3Z', '#7ae04a'); },
    crown: function () { return P('M-12 -2 L-14 -20 L-6 -12 L0 -24 L6 -12 L14 -20 L12 -2Z', '#ffcd3c') + C(0, -12, 2.6, '#e0245e', false) + C(-7, -8, 1.8, '#3cc7ff', false) + C(7, -8, 1.8, '#3cc7ff', false); },
    boat: function () { return P('M-34 -14 L34 -14 Q26 0 14 0 L-14 0 Q-26 0 -34 -14Z', '#8a5a2b') + R(-33, -17, 66, 4, 1, '#a56e34') + R(-1.4, -78, 3, 64, 1, '#6a4a2b') + P('M2 -76 Q34 -52 38 -20 L2 -20Z', '#fbf6e8') + P('M-2 -68 Q-22 -44 -26 -22 L-2 -22Z', '#f2e6cc') + shadow('M2 -50 Q20 -36 38 -20 L2 -20Z', 0.12) + P('M2 -78 l12 4 l-12 4Z', '#e0382a'); },
    jar: function () { return P('M-14 -6 Q-22 -26 -10 -36 L10 -36 Q22 -26 14 -6 Q0 2 -14 -6Z', '#c27a44') + R(-10, -40, 20, 6, 3, '#a8622f') + S('M-16 -24 Q0 -20 16 -24', '#8a4a22', 1.6) + shine('M-12 -30 Q-14 -20 -10 -12 Q-8 -22 -8 -30Z', 0.3); },
    cheese: function () { return P('M-18 -4 L18 -4 L18 -16 L-18 -22Z', '#ffcd4a') + P('M-18 -22 L18 -16 L14 -20 L-14 -26Z', '#ffe27a') + C(-6, -10, 2.4, '#e0a82a', false) + C(8, -9, 3, '#e0a82a', false) + C(-12, -14, 1.6, '#e0a82a', false); },
    basket: function () { return P('M-16 -16 L16 -16 L12 0 L-12 0Z', '#c9964a') + S('M-14 -12 H14 M-12 -7 H12 M-8 -16 V0 M0 -16 V0 M8 -16 V0', '#a8732a', 1.2) + S('M-14 -16 Q0 -38 14 -16', '#a8732a', 2.4) + P('M-8 -17 Q-4 -24 2 -18 Q6 -24 10 -17Z', '#fbf6e8') + C(4, -20, 3, '#e0382a', false); },
    rock: function () { return P('M-30 0 Q-34 -30 -12 -44 Q6 -52 22 -38 Q36 -24 32 0Z', '#8a8680') + P('M-12 -44 Q6 -52 22 -38 Q10 -40 -4 -34Z', '#a8a49e', false) + shadow('M10 -42 Q32 -24 32 0 L10 0Z', 0.2) + S('M-6 -4 Q-4 -22 4 -34', '#5a5650', 1.6); },
    egg: function () { return E(0, -22, 16, 22, '#f2ead0') + E(-5, -30, 4, 8, 'rgba(255,255,255,.5)', false) + C(6, -14, 2.4, '#c8b890', false) + C(-7, -10, 1.8, '#c8b890', false) + C(8, -28, 1.6, '#c8b890', false); },
    slipper: function () { return P('M-14 -4 Q-10 -18 0 -18 L6 -18 Q8 -10 16 -8 Q20 -4 16 0 L-12 0Z', 'rgba(190,230,255,.75)', ' stroke="#fff" stroke-width="1.2"') + P('M-10 -4 Q-6 -14 0 -14', 'rgba(255,255,255,.8)', false) + C(8, -12, 1.4, '#fff', false); },
    pumpkin: function () { return E(0, -14, 18, 14, '#f08a24') + S('M-8 -26 Q-12 -14 -8 -2 M0 -28 V0 M8 -26 Q12 -14 8 -2', '#c8641a', 1.4) + R(-2, -32, 4, 7, 2, '#5a8a2a'); },
    carriage: function () { return C(-20, -9, 10, '#ffcd3c') + C(18, -9, 10, '#ffcd3c') + C(-20, -9, 3.4, '#a8761a', false) + C(18, -9, 3.4, '#a8761a', false) + P('M-30 -14 Q-32 -34 -14 -36 L16 -36 Q34 -34 32 -14Z', '#ffe27a') + P('M-16 -36 Q0 -56 18 -36Z', '#f2c230') + R(-8, -34, 16, 12, 3, '#9be4ff', ' stroke="#b8861a" stroke-width="1"') + C(0, -56, 3, '#fff3a0', false); },
    clock: function () { return C(0, -24, 20, '#fff7e0', ' stroke="#8a5a2b" stroke-width="3"') + S('M0 -24 V-38 M0 -24 H8', '#3a2a14', 2.4) + [0, 1, 2, 3].map(function (i) { return C(i === 1 ? 14 : i === 3 ? -14 : 0, -24 + (i === 0 ? -14 : i === 2 ? 14 : 0), 1.2, '#3a2a14', false); }).join(''); },
    axe: function () { return R(-1.6, -34, 3.2, 34, 1.4, '#8a5a2b') + P('M1 -34 Q14 -34 14 -24 Q8 -22 1 -24Z', '#b8bcc4') + shine('M3 -33 Q10 -33 12 -28 Q6 -29 3 -31Z', 0.5); },
    net: function () { return '<g opacity=".92">' + S('M-34 -6 Q0 -60 34 -6', '#a88a5a', 1.4) + [-24, -12, 0, 12, 24].map(function (x) { return S('M' + x + ' ' + (-8 - 36 * (1 - Math.pow(x / 34, 2))) + ' V-6', '#a88a5a', 1.1); }).join('') + [-14, -24, -34].map(function (y, i) { return S('M-' + (30 - i * 7) + ' ' + y + ' H' + (30 - i * 7), '#a88a5a', 1.1); }).join('') + '</g>'; },
    feather: function () { return P('M-4 -2 Q-14 -22 6 -34 Q4 -16 -4 -2Z', '#8ad0ff') + S('M-4 -2 Q4 -20 6 -34', '#fff', 1); },
    door: function () { return R(-14, -40, 28, 40, 2, '#8a5a2b') + P('M-14 -40 Q0 -54 14 -40Z', '#8a5a2b') + C(8, -20, 1.8, '#ffcd3c', false) + S('M-14 -28 H14 M0 -40 V0', '#6a4020', 1) + R(-18, -2, 36, 3, 1, '#a89a8a'); },
    chalk: function () { return S('M-8 -16 L8 -2 M8 -16 L-8 -2', '#fff', 3.4, ' opacity=".95"'); },
    tree: function () { return P('M-5 0 Q-4 -20 -6 -40 L6 -40 Q4 -20 5 0Z', '#7a4e2a') + C(-16, -52, 18, '#3f9a4a') + C(14, -54, 20, '#4aaa52') + C(0, -68, 20, '#5ab85a') + shine('M-14 -66 Q-6 -78 8 -74 Q-4 -72 -14 -66Z', 0.3) + shadow('M2 -50 Q24 -44 24 -56 Q20 -36 2 -40Z', 0.15); },
    fruittree: function () { return PROPS.tree() + C(-14, -50, 3, '#e0382a', false) + C(8, -60, 3, '#e0382a', false) + C(16, -48, 3, '#e0382a', false) + C(-4, -70, 3, '#e0382a', false); },
    palm: function () { return S('M0 0 Q6 -30 -2 -64', '#8a5a2b', 7) + S('M0 0 Q6 -30 -2 -64', '#a8723a', 4.4) + '<g>' + [[-46,-52,-26],[-38,-76,-30],[-6,-98,0],[34,-82,28],[46,-54,26],[-44,-60,-20],[44,-62,20]].map(function (q) { return P('M-2 -64 Q' + (q[0] / 2) + ' ' + (q[1] - 4) + ' ' + q[0] + ' ' + (q[1] + 14) + ' Q' + (q[0] / 2) + ' ' + (q[1] + 8) + ' -2 -64Z', '#2f9e57'); }).join('') + '</g>' + C(-4, -62, 3, '#6a3a1a', false) + C(2, -61, 3, '#6a3a1a', false); },
    plank: function () { return P('M-30 -4 L30 -8 L32 0 L-28 3Z', '#a8723a') + S('M-24 -2 L24 -5', '#7a4e22', 1.2) + C(-26, -1, 1.2, '#4a2a10', false) + C(28, -3, 1.2, '#4a2a10', false); },
    bush: function () { return C(-12, -10, 12, '#3f9a4a') + C(6, -12, 14, '#4aaa52') + C(20, -8, 10, '#3f9a4a') + shine('M-6 -18 Q2 -26 12 -22 Q2 -22 -6 -18Z', 0.25); },
    strawhouse: function () { return R(-22, -26, 44, 26, 2, '#e8c860') + P('M-30 -26 L0 -56 L30 -26Z', '#c9a030') + S('M-18 -22 V-2 M-8 -22 V-2 M2 -22 V-2 M12 -22 V-2', '#c9a030', 1.4) + R(-6, -18, 12, 18, 6, '#8a5a2b') + R(10, -22, 8, 8, 1, '#9be4ff'); },
    woodhouse: function () { return R(-22, -26, 44, 26, 2, '#a8723a') + P('M-30 -26 L0 -56 L30 -26Z', '#7a4a22') + S('M-22 -20 H22 M-22 -13 H22 M-22 -6 H22', '#7a4a22', 1.2) + R(-6, -18, 12, 18, 6, '#5a3416') + R(10, -22, 8, 8, 1, '#9be4ff'); },
    brickhouse: function () { return R(-22, -26, 44, 26, 2, '#c8503a') + P('M-30 -26 L0 -56 L30 -26Z', '#6a3a2a') + R(8, -62, 7, 14, 1, '#8a4a3a') + S('M-22 -20 H22 M-22 -13 H22 M-22 -6 H22 M-12 -26 V-20 M0 -20 V-13 M-12 -13 V-6 M10 -26 V-20', '#e8d0b8', 1) + R(-6, -18, 12, 18, 6, '#5a3416') + R(10, -22, 8, 8, 1, '#9be4ff'); },
    well: function () { return R(-20, -20, 40, 20, 2, '#a8a49e') + S('M-20 -10 H20 M-8 -20 V0 M8 -20 V-10', '#7a766e', 1.2) + R(-20, -62, 4, 42, 1, '#7a4e2a') + R(16, -62, 4, 42, 1, '#7a4e2a') + P('M-24 -62 L0 -76 L24 -62Z', '#a8723a') + S('M0 -62 V-36', '#d8c8a0', 1.4) + R(-4, -38, 8, 8, 1.4, '#8a5a2b'); },
    bottle: function () { return P('M-10 -4 Q-14 -24 -5 -34 L-5 -46 L5 -46 L5 -34 Q14 -24 10 -4 Q0 2 -10 -4Z', '#d8a020') + R(-6, -52, 12, 7, 2, '#8a5a1a') + shine('M-8 -26 Q-9 -14 -7 -8 Q-5 -18 -5 -26Z', 0.4) + S('M-9 -22 Q0 -18 9 -22', '#a87a10', 1.2); },
    grapes: function () { var s = ''; [[0, -6], [-6, -12], [6, -12], [-10, -19], [0, -19], [10, -19], [-5, -26], [5, -26], [0, -32]].forEach(function (p) { s += C(p[0], p[1], 5.4, '#7a3fc0') + C(p[0] - 1.6, p[1] - 1.8, 1.4, 'rgba(255,255,255,.5)', false); }); return S('M0 -36 Q4 -44 10 -46', '#4a8a2a', 2) + P('M4 -42 Q12 -52 20 -44 Q12 -40 4 -42Z', '#5ab83a') + s; },
    bowl: function () { return P('M-14 -14 Q-12 0 0 0 Q12 0 14 -14Z', '#f2e6cc') + E(0, -14, 14, 4, '#c98a4a') + E(-3, -16, 5, 1.6, '#e8c48a', false) + S('M-4 -22 q-3 -5 0 -9 M4 -22 q3 -5 0 -9', 'rgba(255,255,255,.7)', 1.4); },
    chair: function () { return R(-12, -20, 24, 5, 2, '#a8723a') + R(-12, -42, 5, 24, 2, '#a8723a') + R(-10, -16, 4, 16, 1, '#8a5a2b') + R(6, -16, 4, 16, 1, '#8a5a2b') + R(-8, -40, 18, 3, 1, '#8a5a2b'); },
    bed: function () { return R(-34, -12, 68, 8, 2, '#8a5a2b') + R(-34, -30, 5, 26, 2, '#8a5a2b') + R(-30, -20, 62, 12, 5, '#f2e6cc') + R(-28, -26, 20, 8, 4, '#fff') + P('M-6 -20 Q8 -26 32 -20 L32 -8 L-6 -8Z', '#7aa8d8'); },
    sparkle: function () { return P('M0 -22 L3 -11 L14 -8 L3 -5 L0 6 L-3 -5 L-14 -8 L-3 -11Z', '#fff7b0', ' filter="url(#glow)"'); }
  };
  var PSIZE = { lamp: 0.5, chest: 0.6, coins: 0.4, gems: 0.4, crown: 0.4, boat: 1.3, jar: 0.7, cheese: 0.4, basket: 0.45, rock: 1.1, egg: 0.9, slipper: 0.3, pumpkin: 0.6, carriage: 1, clock: 0.9, axe: 0.7, net: 1.1, feather: 0.5, door: 1, chalk: 0.4, plank: 1, palm: 1.5, tree: 1.6, fruittree: 1.6, bush: 0.6, strawhouse: 1.3, woodhouse: 1.3, brickhouse: 1.4, well: 1.2, bottle: 0.8, grapes: 0.8, bowl: 0.4, chair: 0.7, bed: 0.8, sparkle: 0.4 };

  // draw() returns the asset plus its nominal height h and relative scale k: the scene's size value is "one adult"
  // so every asset keeps natural proportions next to the others (a lion is smaller than a man, a camel taller).
  function draw(name, o) {
    o = o || {};
    if (PEOPLE[name]) { var p = Object.assign({}, PEOPLE[name], o.mood ? { mood: o.mood } : {}, o.pose ? { pose: o.pose } : {}); return { g: person(p), h: 108, k: (p.child ? 0.8 : 1) * (name === 'ogre' ? 1.5 : 1) }; }
    if (name === 'genie') return { g: genie({ mood: o.mood }), h: 112, k: 1.05 };
    if (name === 'jinni') return { g: genie({ mood: o.mood || 'angry', color: '#b0302a', smoke: '120,40,60' }), h: 112, k: 1.8 };
    if (ANIMALS[name]) return { g: ANIMALS[name]({ mood: o.mood }), h: 70, k: SIZE[name] || 1 };
    if (name === 'bearBig') return { g: ANIMALS.bear({ c: '#7a4a28', mood: o.mood }), h: 70, k: 1.15 };
    if (name === 'bearMid') return { g: ANIMALS.bear({ c: '#8a5a35', mood: o.mood }), h: 70, k: 0.9 };
    if (name === 'bearSmall') return { g: ANIMALS.bear({ c: '#a8724a', mood: o.mood }), h: 70, k: 0.55 };
    if (name === 'pigA') return { g: ANIMALS.pig({ c: '#f4a6b8', mood: o.mood }), h: 70, k: 0.8 };
    if (name === 'pigB') return { g: ANIMALS.pig({ c: '#f7b8a0', mood: o.mood }), h: 70, k: 0.8 };
    if (name === 'pigC') return { g: ANIMALS.pig({ c: '#eea0b8', mood: o.mood }), h: 70, k: 0.8 };
    if (PROPS[name]) return { g: PROPS[name](), h: 60, k: PSIZE[name] || 1 };
    return null;
  }
  var api = { draw: draw, names: Object.keys(PEOPLE).concat(['genie', 'jinni', 'bearBig', 'bearMid', 'bearSmall', 'pigA', 'pigB', 'pigC'], Object.keys(ANIMALS), Object.keys(PROPS)) };
  root.Art = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
