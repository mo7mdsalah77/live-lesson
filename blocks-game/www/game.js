(function () {
  var T = window.BlocksLogic, canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
  var W = 360, H = 640, CELL = 25, BX = 14, BY = 54, FONT = '"Cairo", "Segoe UI", Tahoma, system-ui, sans-serif';
  var cw = W, ch = H, dpr = 1, sc = 1, ox = 0, oy = 0;
  var TXT = {
    ar: { title: 'مكعبات', sub: 'اللعبة الكلاسيكية', how: 'كمّل الصفوف عشان تختفي', how2: 'الأزرار أسفل الشاشة · أو الأسهم على الكيبورد', tap: 'اضغط للبدء', score: 'النقاط', level: 'المستوى', lines: 'الصفوف', next: 'التالي', best: 'الأعلى', over: 'انتهت اللعبة', again: 'العب تاني', lang: 'English', paused: 'استراحة', resume: 'اضغط للمتابعة' },
    en: { title: 'Blocks', sub: 'The classic falling-blocks game', how: 'Complete rows to clear them', how2: 'Buttons below · or arrow keys on a keyboard', tap: 'Tap to start', score: 'Score', level: 'Level', lines: 'Lines', next: 'Next', best: 'Best', over: 'Game over', again: 'Play again', lang: 'العربية', paused: 'Break', resume: 'Tap to resume' }
  };
  var lang = (navigator.language || '').toLowerCase().indexOf('ar') === 0 ? 'ar' : 'en'; try { var saved = localStorage.getItem('blocks.lang'); if (saved === 'ar' || saved === 'en') lang = saved; } catch (e) {}
  function t(k) { return TXT[lang][k]; }
  var best = 0; try { best = +localStorage.getItem('blocks.best') || 0; } catch (e) {}

  var state = 'menu', board = T.newBoard(), cur = null, nextType = null, bag = [], score = 0, lines = 0, level = 1, acc = 0, groundT = 0, resets = 0, softHeld = false, clearing = null, flash = 0, parts = [], last = 0;

  function resize() {
    var r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2); cw = r.width || innerWidth; ch = r.height || innerHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); sc = Math.min(cw / W, ch / H); ox = (cw - W * sc) / 2; oy = (ch - H * sc) / 2;
  }
  addEventListener('resize', resize);

  var ac = null, muted = false;
  function audio() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) {} return ac; }
  function tone(f, dur, type, vol, f2) {
    if (muted || !audio()) return; var o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, ac.currentTime);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, ac.currentTime + dur); g.gain.setValueAtTime(vol || 0.05, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
  }

  function draw7() { if (!bag.length) bag = T.makeBag(Math.random); return bag.pop(); }
  function spawnNext() {
    cur = T.spawn(nextType); nextType = draw7(); acc = 0; groundT = 0; resets = 0;
    if (T.collides(board, cur)) over();
  }
  function start() { audio(); state = 'play'; board = T.newBoard(); score = lines = 0; level = 1; bag = []; nextType = draw7(); clearing = null; parts = []; spawnNext(); }
  function over() { state = 'over'; tone(200, 0.6, 'sawtooth', 0.1, 50); if (navigator.vibrate) navigator.vibrate(150); if (score > best) { best = score; try { localStorage.setItem('blocks.best', best); } catch (e) {} } }

  function touchedGround() { return T.collides(board, { type: cur.type, rot: cur.rot, x: cur.x, y: cur.y + 1 }); }
  function reset() { if (touchedGround() && resets < 15) { groundT = 0; resets++; } }
  function move(dx) { if (state !== 'play' || clearing) return; var n = T.tryMove(board, cur, dx, 0); if (n) { cur = n; reset(); tone(260, 0.03, 'square', 0.025); } }
  function rot(dir) { if (state !== 'play' || clearing) return; var n = T.rotate(board, cur, dir); if (n) { cur = n; reset(); tone(420, 0.05, 'triangle', 0.05); } }
  function soft() { if (state !== 'play' || clearing) return; var n = T.tryMove(board, cur, 0, 1); if (n) { cur = n; score += 1; acc = 0; } }
  function hard() { if (state !== 'play' || clearing) return; var d = T.dropDistance(board, cur); cur = { type: cur.type, rot: cur.rot, x: cur.x, y: cur.y + d }; score += 2 * d; tone(140, 0.08, 'square', 0.08, 70); lockPiece(); }
  function lockPiece() {
    T.lock(board, cur); cur = null; var rows = T.fullRows(board);
    if (rows.length) {
      clearing = { rows: rows, t: 0.3 }; score += T.lineScore(rows.length, level); lines += rows.length; level = T.levelFor(lines); tone(500 + rows.length * 120, 0.25, 'triangle', 0.09, 1200 + rows.length * 100);
      rows.forEach(function (r) { for (var c = 0; c < T.COLS; c++) for (var k = 0; k < 2; k++) parts.push({ x: BX + c * CELL + 12, y: BY + r * CELL + 12, vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 160, life: 0.6, c: T.COLORS[board[r][c]] || '#fff' }); });
    } else spawnNext();
  }

  function update(dt) {
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt; }); parts = parts.filter(function (p) { return p.life > 0; });
    if (state !== 'play') return;
    if (clearing) { clearing.t -= dt; if (clearing.t <= 0) { T.removeRows(board, clearing.rows); clearing = null; spawnNext(); } return; }
    if (rep.act) { rep.t -= dt; if (rep.t <= 0) { rep.t = 0.055; run(rep.act); } }
    acc += dt * 1000; var iv = T.gravityMs(level);
    while (acc >= iv) { acc -= iv; var n = T.tryMove(board, cur, 0, 1); if (n) { cur = n; groundT = 0; } else break; }
    if (touchedGround()) { groundT += dt; if (groundT >= 0.5) lockPiece(); } else groundT = 0;
  }

  // ---- drawing
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function text(s, x, y, size, color, align, weight) { ctx.font = (weight || 800) + ' ' + size + 'px ' + FONT; ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.fillText(s, x, y); }
  function cube(x, y, s, color, alpha) {
    ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.fillStyle = color; rr(x + 1, y + 1, s - 2, s - 2, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + 3, y + 3, s - 6, 3); ctx.fillRect(x + 3, y + 3, 3, s - 6); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + 3, y + s - 6, s - 6, 3); ctx.fillRect(x + s - 6, y + 3, 3, s - 6); ctx.globalAlpha = 1;
  }
  var BUTTONS = [
    { id: "left", x: 10, rep: true }, { id: "rot", x: 79 }, { id: "right", x: 148, rep: true }, { id: "soft", x: 217, rep: true }, { id: "hard", x: 286 }
  ];
  var BTN_Y = 578, BTN_W = 64, BTN_H = 52;
  function icon(id, cx, cy) {
    ctx.fillStyle = '#e8f1ff'; ctx.strokeStyle = '#e8f1ff'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (id === 'left') { ctx.beginPath(); ctx.moveTo(cx + 8, cy - 11); ctx.lineTo(cx - 8, cy); ctx.lineTo(cx + 8, cy + 11); ctx.closePath(); ctx.fill(); }
    else if (id === 'right') { ctx.beginPath(); ctx.moveTo(cx - 8, cy - 11); ctx.lineTo(cx + 8, cy); ctx.lineTo(cx - 8, cy + 11); ctx.closePath(); ctx.fill(); }
    else if (id === 'soft') { ctx.beginPath(); ctx.moveTo(cx - 11, cy - 7); ctx.lineTo(cx, cy + 8); ctx.lineTo(cx + 11, cy - 7); ctx.closePath(); ctx.fill(); }
    else if (id === 'hard') { [-9, 3].forEach(function (d) { ctx.beginPath(); ctx.moveTo(cx - 10, cy + d - 3); ctx.lineTo(cx, cy + d + 7); ctx.lineTo(cx + 10, cy + d - 3); ctx.stroke(); }); }
    else { ctx.beginPath(); ctx.arc(cx, cy, 10, -1.2, 4.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + 6, cy - 14); ctx.lineTo(cx + 12, cy - 6); ctx.lineTo(cx + 2, cy - 5); ctx.closePath(); ctx.fill(); }
  }
  function drawPiece(type, rot, px, py, s, alpha) { var m = T.shapeOf(type, rot); for (var r = 0; r < m.length; r++) for (var c = 0; c < m.length; c++) if (m[r][c]) cube(px + c * s, py + r * s, s, T.COLORS[type], alpha); }

  function render(tt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#0f1a2e'; ctx.fillRect(0, 0, cw, ch);
    ctx.translate(ox, oy); ctx.scale(sc, sc); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16253f'); g.addColorStop(1, '#0c1424'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // board
    ctx.fillStyle = 'rgba(5,10,22,.85)'; rr(BX - 4, BY - 4, T.COLS * CELL + 8, T.ROWS * CELL + 8, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(120,160,255,.08)'; ctx.lineWidth = 1; for (var c = 1; c < T.COLS; c++) { ctx.beginPath(); ctx.moveTo(BX + c * CELL, BY); ctx.lineTo(BX + c * CELL, BY + T.ROWS * CELL); ctx.stroke(); } for (var r = 1; r < T.ROWS; r++) { ctx.beginPath(); ctx.moveTo(BX, BY + r * CELL); ctx.lineTo(BX + T.COLS * CELL, BY + r * CELL); ctx.stroke(); }
    for (r = 0; r < T.ROWS; r++) for (c = 0; c < T.COLS; c++) if (board[r][c]) cube(BX + c * CELL, BY + r * CELL, CELL, T.COLORS[board[r][c]]);
    if (clearing) clearing.rows.forEach(function (row) { ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.5 * Math.sin(tt * 40)) + ')'; ctx.fillRect(BX, BY + row * CELL, T.COLS * CELL, CELL); });
    if (cur && state !== 'menu') {
      var d = T.dropDistance(board, cur); T.cells({ type: cur.type, rot: cur.rot, x: cur.x, y: cur.y + d }).forEach(function (cl) { if (cl.y >= 0) { ctx.strokeStyle = T.COLORS[cur.type]; ctx.globalAlpha = 0.5; ctx.lineWidth = 2; rr(BX + cl.x * CELL + 3, BY + cl.y * CELL + 3, CELL - 6, CELL - 6, 4); ctx.stroke(); ctx.globalAlpha = 1; } });
      T.cells(cur).forEach(function (cl) { if (cl.y >= 0) cube(BX + cl.x * CELL, BY + cl.y * CELL, CELL, T.COLORS[cur.type]); });
    }
    parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life / 0.6); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 4, 4); }); ctx.globalAlpha = 1;
    // side panel
    var px = BX + T.COLS * CELL + 12, pw = W - px - 8;
    ctx.fillStyle = 'rgba(255,255,255,.06)'; rr(px, BY - 4, pw, 84, 10); ctx.fill(); text(t('next'), px + pw / 2, BY + 12, 12, '#9fb6e8', 'center', 800);
    if (nextType && state !== 'menu') { var m = T.shapeOf(nextType, 0), s = 15, n = m.length; drawPiece(nextType, 0, px + pw / 2 - n * s / 2, BY + (nextType === 'I' ? 14 : 28) - (nextType === 'I' ? 0 : 0), s); }
    [[t('score'), score], [t('level'), level], [t('lines'), lines], [t('best'), Math.max(best, score)]].forEach(function (it, i) {
      var y = BY + 112 + i * 62; ctx.fillStyle = 'rgba(255,255,255,.06)'; rr(px, y - 20, pw, 52, 10); ctx.fill(); text(it[0], px + pw / 2, y - 3, 12, '#9fb6e8', 'center', 800); text(String(it[1]), px + pw / 2, y + 22, 20, '#fff', 'center', 900);
    });
    // pause
    ctx.fillStyle = 'rgba(255,255,255,.1)'; rr(px, BY + 370, pw, 40, 10); ctx.fill(); ctx.fillStyle = '#e8f1ff'; ctx.fillRect(px + pw / 2 - 8, BY + 380, 5, 20); ctx.fillRect(px + pw / 2 + 3, BY + 380, 5, 20);
    // buttons
    BUTTONS.forEach(function (b) { var on = rep.act === b.id || pressed === b.id; ctx.fillStyle = on ? '#3a5db8' : '#233a66'; rr(b.x, BTN_Y, BTN_W, BTN_H, 14); ctx.fill(); icon(b.id, b.x + BTN_W / 2, BTN_Y + BTN_H / 2); });
    BUTTONS.length && icon; // keep reference
    if (state === 'menu') overlay(function () {
      text(t('title'), W / 2, 230, 56, '#4ecdf0', 'center', 900); text(t('sub'), W / 2, 262, 16, '#fff', 'center', 700);
      [['I', 120], ['T', 150], ['S', 180], ['L', 210]].forEach(function (p, i) { drawPiece(p[0], 0, 62 + i * 62, 300, 14); });
      text(t('how'), W / 2, 380, 17, '#c9d8ff', 'center', 800); text(t('how2'), W / 2, 404, 13, '#9fb6e8', 'center', 600);
      if (best) text(t('best') + ': ' + best, W / 2, 440, 17, '#ffd23f', 'center', 800); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tt * 4); text(t('tap'), W / 2, 492, 26, '#fff', 'center', 900); ctx.globalAlpha = 1; text(t('lang'), W - 12, H - 12, 14, 'rgba(255,255,255,.75)', 'right', 800);
    });
    else if (state === 'over') overlay(function () {
      text(t('over'), W / 2, 240, 38, '#ff8a8a', 'center', 900); text(String(score), W / 2, 310, 60, '#fff', 'center', 900); text(t('best') + ': ' + best, W / 2, 346, 18, '#ffd23f', 'center', 800);
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tt * 4); text(t('again'), W / 2, 420, 28, '#fff', 'center', 900); ctx.globalAlpha = 1; text(t('lang'), W - 12, H - 12, 14, 'rgba(255,255,255,.75)', 'right', 800);
    });
    else if (state === 'paused') overlay(function () { text('☕ ' + t('paused'), W / 2, 300, 36, '#ffd23f', 'center', 900); text(t('resume'), W / 2, 340, 18, '#fff', 'center', 700); });
  }
  function overlay(fn) { ctx.fillStyle = 'rgba(8,14,30,.84)'; ctx.fillRect(0, 0, W, H - 70 + 70); fn(); }

  // ---- input
  var rep = { act: null, t: 0, id: null }, pressed = null;
  function run(a) { if (a === 'left') move(-1); else if (a === 'right') move(1); else if (a === 'soft') soft(); else if (a === 'rot') rot(1); else if (a === 'hard') hard(); }
  function toGame(e) { var r = canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) - ox) / sc, y: ((e.clientY - r.top) - oy) / sc }; }
  canvas.addEventListener('pointerdown', function (e) {
    var p = toGame(e); audio();
    if (state === 'paused') { state = 'play'; return; }
    if (state === 'menu' || state === 'over') { if (p.x > W - 110 && p.y > H - 40) { lang = lang === 'ar' ? 'en' : 'ar'; try { localStorage.setItem('blocks.lang', lang); } catch (x) {} document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; } else start(); return; }
    var px = BX + T.COLS * CELL + 12; if (p.x > px && p.y > BY + 370 && p.y < BY + 410) { state = 'paused'; return; }
    for (var i = 0; i < BUTTONS.length; i++) { var b = BUTTONS[i]; if (p.x >= b.x && p.x <= b.x + BTN_W && p.y >= BTN_Y - 6 && p.y <= BTN_Y + BTN_H + 8) {
      pressed = b.id; run(b.id); if (b.rep) { rep = { act: b.id, t: 0.17, id: e.pointerId }; } try { canvas.setPointerCapture(e.pointerId); } catch (x) {} return; } }
    if (p.y < BTN_Y - 10) { if (p.x < W / 2) rot(1); else rot(1); }     // tapping the board rotates, as on most phone versions
  });
  function release(e) { if (rep.id === e.pointerId) rep = { act: null, t: 0, id: null }; pressed = null; }
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowLeft') move(-1); else if (k === 'ArrowRight') move(1); else if (k === 'ArrowDown') soft(); else if (k === 'ArrowUp' || k === 'x') rot(1); else if (k === 'z') rot(-1);
    else if (k === ' ') { if (state === 'play') hard(); else if (state === 'paused') state = 'play'; else start(); e.preventDefault(); }
    else if ((k === 'p' || k === 'Escape') && (state === 'play' || state === 'paused')) state = state === 'play' ? 'paused' : 'play';
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].indexOf(k) >= 0) e.preventDefault();
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden && state === 'play') state = 'paused'; });

  function loop(ts) { var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; update(dt); render(ts / 1000); requestAnimationFrame(loop); }
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  resize(); requestAnimationFrame(loop);
  window.__blocks = { get state() { return state; }, get score() { return score; }, get lines() { return lines; }, get cur() { return cur; }, get board() { return board; }, start: start };   // test hook
})();
