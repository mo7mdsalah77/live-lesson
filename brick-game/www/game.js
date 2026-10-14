(function () {
  var B = window.BrickLogic, canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
  var cw = 360, ch = 640, dpr = 1, sc = 1, ox = 0, oy = 0, FONT = '"Cairo", "Segoe UI", Tahoma, system-ui, sans-serif';
  var TXT = {
    ar: { title: 'طوب ومسطرة', sub: 'كسّر الطوب بالكورة', how: 'حرّك المسطرة بصباعك', how2: 'اضغط لإطلاق الكورة · التقط الهدايا المتساقطة', tap: 'اضغط للبدء', score: 'النقاط', level: 'المرحلة', best: 'الأعلى', over: 'خلصت الكور!', again: 'العب تاني', lang: 'English', paused: 'استراحة', resume: 'اضغط للمتابعة', launch: 'اضغط لإطلاق الكورة', bonus: 'بونص', wide: 'مسطرة أطول!', multi: 'كور كتير!', slow: 'كورة بطيئة', life: 'حياة زيادة!' },
    en: { title: 'Bricks & Ruler', sub: 'Smash the bricks with the ball', how: 'Slide the ruler with your finger', how2: 'Tap to launch the ball · catch falling gifts', tap: 'Tap to start', score: 'Score', level: 'Level', best: 'Best', over: 'Out of balls!', again: 'Play again', lang: 'العربية', paused: 'Break', resume: 'Tap to resume', launch: 'Tap to launch', bonus: 'Bonus', wide: 'Longer ruler!', multi: 'Multi-ball!', slow: 'Slow ball', life: 'Extra life!' }
  };
  var lang = 'ar'; try { lang = localStorage.getItem('brick.lang') === 'en' ? 'en' : 'ar'; } catch (e) {}
  function t(k) { return TXT[lang][k]; }
  var best = 0; try { best = +localStorage.getItem('brick.best') || 0; } catch (e) {}

  var state = 'menu', score = 0, lives = 3, level = 1, bricks = [], balls = [], powers = [], parts = [], floats = [], banner = null;
  var paddle = { x: 180, w: 84 }, targetX = 180, fx = { wide: 0, slow: 0 }, shake = 0, last = 0, held = 0, trail = [];

  function resize() {
    var r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2); cw = r.width || innerWidth; ch = r.height || innerHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); sc = Math.min(cw / B.W, ch / B.H); ox = (cw - B.W * sc) / 2; oy = (ch - B.H * sc) / 2;
  }
  addEventListener('resize', resize);

  var ac = null, muted = false;
  function audio() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) {} return ac; }
  function tone(f, dur, type, vol, f2) {
    if (muted || !audio()) return; var o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, ac.currentTime);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, ac.currentTime + dur); g.gain.setValueAtTime(vol || 0.06, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
  }

  function newBall() { balls = [{ x: paddle.x, y: B.PADDLE_Y - B.BALL_R, vx: 0, vy: 0, stuck: true, off: 0 }]; trail = []; }
  function start() {
    audio(); state = 'play'; score = 0; lives = 3; level = 1; bricks = B.buildLevel(1); powers = []; parts = []; floats = []; fx.wide = fx.slow = 0; paddle.w = 84; newBall(); banner = { text: t('level') + ' 1', t: 1.2 };
  }
  function over() { state = 'over'; if (score > best) { best = score; try { localStorage.setItem('brick.best', best); } catch (e) {} } }
  function speed() { return B.speedFor(level) * (fx.slow > 0 ? 0.72 : 1); }
  function launch() {
    balls.forEach(function (b) { if (b.stuck) { b.stuck = false; var a = (Math.random() - 0.5) * 0.5; b.vx = Math.sin(a) * speed(); b.vy = -Math.cos(a) * speed(); tone(520, 0.08, 'triangle', 0.08); } });
  }
  function burst(x, y, c, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = 50 + Math.random() * 150; parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.55, c: c }); } }
  function say(s, x, y, c) { floats.push({ text: s, x: x, y: y, t: 1, c: c || '#fff' }); }
  function givePower(type) {
    tone(900, 0.12, 'sine', 0.1, 1400); say(t(type), paddle.x, B.PADDLE_Y - 30, '#ffd23f');
    if (type === 'wide') fx.wide = 12; else if (type === 'slow') fx.slow = 8; else if (type === 'life') lives = Math.min(5, lives + 1);
    else if (type === 'multi') { var add = []; balls.forEach(function (b) { if (b.stuck) return; [-0.5, 0.5].forEach(function (rot) { var c = Math.cos(rot), s = Math.sin(rot); add.push({ x: b.x, y: b.y, vx: b.vx * c - b.vy * s, vy: b.vx * s + b.vy * c, stuck: false }); }); }); balls = balls.concat(add.slice(0, 6)); }
  }
  function loseBall() {
    lives--; tone(220, 0.4, 'sawtooth', 0.12, 70); shake = 0.35; if (navigator.vibrate) navigator.vibrate(120); fx.wide = 0; fx.slow = 0; powers = [];
    if (lives <= 0) over(); else newBall();
  }

  function stepBall(b, dt) {
    var sp = Math.hypot(b.vx, b.vy), want = speed(); if (sp > 0) { b.vx *= want / sp; b.vy *= want / sp; sp = want; }
    var steps = Math.max(1, Math.ceil(sp * dt / 4)), h = dt / steps;
    for (var i = 0; i < steps; i++) {
      b.x += b.vx * h; b.y += b.vy * h;
      if (b.x < B.BALL_R) { b.x = B.BALL_R; b.vx = Math.abs(b.vx); } else if (b.x > B.W - B.BALL_R) { b.x = B.W - B.BALL_R; b.vx = -Math.abs(b.vx); }
      if (b.y < B.BALL_R + 50) { b.y = B.BALL_R + 50; b.vy = Math.abs(b.vy); }
      if (b.vy > 0 && b.y + B.BALL_R >= B.PADDLE_Y && b.y - B.BALL_R <= B.PADDLE_Y + B.PADDLE_H && Math.abs(b.x - paddle.x) <= paddle.w / 2 + B.BALL_R) {
        var r = B.paddleBounce(b.x, paddle.x, paddle.w, want); b.vx = r.vx; b.vy = r.vy; b.y = B.PADDLE_Y - B.BALL_R; tone(300, 0.05, 'triangle', 0.09);
      }
      for (var k = 0; k < bricks.length; k++) {
        var br = bricks[k]; if (br.hp <= 0) continue; var axis = B.circleRect(b.x, b.y, B.BALL_R, br); if (!axis) continue;
        if (axis === 'x') { b.vx = -b.vx; b.x += Math.sign(b.vx) * 1.5; } else { b.vy = -b.vy; b.y += Math.sign(b.vy) * 1.5; }
        var pts = B.hitBrick(br);
        if (br.solid) tone(160, 0.05, 'square', 0.06);
        else {
          tone(380 + (br.y - B.TOP) * -1.5 + 200, 0.06, 'square', 0.06);
          if (pts > 10) { score += pts; burst(br.x + B.BW / 2, br.y + B.BH / 2, br.color, 10); say('+' + pts, br.x + B.BW / 2, br.y, '#fff'); var d = B.maybeDrop(Math.random); if (d) powers.push({ x: br.x + B.BW / 2, y: br.y, type: d }); }
          else score += pts;
        }
        break;
      }
    }
  }

  function update(dt) {
    shake = Math.max(0, shake - dt);
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; p.life -= dt; }); parts = parts.filter(function (p) { return p.life > 0; });
    floats.forEach(function (f) { f.t -= dt; f.y -= 34 * dt; }); floats = floats.filter(function (f) { return f.t > 0; }); if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
    if (state !== 'play') return;
    fx.wide = Math.max(0, fx.wide - dt); fx.slow = Math.max(0, fx.slow - dt);
    if (held) targetX = Math.max(paddle.w / 2, Math.min(B.W - paddle.w / 2, targetX + held * 480 * dt));
    var pw = fx.wide > 0 ? 136 : 84; paddle.w += (pw - paddle.w) * Math.min(1, dt * 8);
    paddle.x += (Math.max(paddle.w / 2, Math.min(B.W - paddle.w / 2, targetX)) - paddle.x) * Math.min(1, dt * 28);
    balls.forEach(function (b) { if (b.stuck) { b.x = paddle.x + b.off; b.y = B.PADDLE_Y - B.BALL_R; } else stepBall(b, dt); });
    if (balls.length && !balls[0].stuck) { var m = balls[0]; trail.push({ x: m.x, y: m.y }); if (trail.length > 8) trail.shift(); }
    balls = balls.filter(function (b) { return b.stuck || b.y < B.H + 20; }); if (!balls.length && state === 'play') loseBall();
    powers.forEach(function (p) { p.y += 130 * dt; if (p.y > B.PADDLE_Y - 6 && p.y < B.PADDLE_Y + 24 && Math.abs(p.x - paddle.x) < paddle.w / 2 + 14) { p.got = true; givePower(p.type); } });
    powers = powers.filter(function (p) { return !p.got && p.y < B.H + 20; });
    if (B.remaining(bricks) === 0) { var bonus = 100 + 25 * level; score += bonus; level++; bricks = B.buildLevel(level); powers = []; newBall(); banner = { text: t('level') + ' ' + level + ' · ' + t('bonus') + ' +' + bonus, t: 1.8 }; tone(660, 0.15, 'triangle', 0.1, 1320); }
  }

  // ---- drawing
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function text(s, x, y, size, color, align, weight) { ctx.font = (weight || 800) + ' ' + size + 'px ' + FONT; ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.fillText(s, x, y); }
  function drawBrick(b) {
    ctx.fillStyle = b.color; rr(b.x + 1, b.y + 1, B.BW - 2, B.BH - 2, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.28)'; rr(b.x + 3, b.y + 2, B.BW - 6, 4, 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(b.x + 3, b.y + B.BH - 5, B.BW - 6, 3);
    if (b.solid) { ctx.fillStyle = 'rgba(255,255,255,.35)'; [[8, 9], [B.BW - 8, 9]].forEach(function (d) { ctx.beginPath(); ctx.arc(b.x + d[0], b.y + d[1], 1.8, 0, 7); ctx.fill(); }); }
    else if (b.max > 1) { ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1; ctx.strokeRect(b.x + 3.5, b.y + 3.5, B.BW - 7, B.BH - 7); text(String(b.hp), b.x + B.BW / 2, b.y + 14, 11, 'rgba(0,0,0,.55)', 'center', 900); }
  }
  function drawRuler() {
    var x = paddle.x - paddle.w / 2, y = B.PADDLE_Y, w = paddle.w, h = B.PADDLE_H;
    var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffe58a'); g.addColorStop(1, '#e0b54a'); ctx.fillStyle = g; rr(x, y, w, h, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,0,.75)'; ctx.lineWidth = 1; for (var i = 0, tx = x + 4; tx < x + w - 3; i++, tx += 5) { ctx.beginPath(); ctx.moveTo(tx, y); ctx.lineTo(tx, y + (i % 5 === 0 ? 7 : 4)); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + 2, y + h - 3, w - 4, 1.5);
  }
  function drawPower(p) {
    var c = { wide: '#4ecdc4', multi: '#ff9f43', slow: '#6bb7ff', life: '#ff5a6e' }[p.type], ic = { wide: '↔', multi: '✦', slow: '🐢', life: '❤' }[p.type];
    ctx.fillStyle = c; rr(p.x - 15, p.y - 9, 30, 18, 9); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5; ctx.stroke(); text(ic, p.x, p.y + 5, 13, '#fff', 'center', 900);
  }
  function render(tt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#0e1330'; ctx.fillRect(0, 0, cw, ch);
    var sx = shake ? (Math.random() - 0.5) * 8 * shake : 0; ctx.translate(ox + sx, oy); ctx.scale(sc, sc); ctx.beginPath(); ctx.rect(0, 0, B.W, B.H); ctx.clip();
    var g = ctx.createLinearGradient(0, 0, 0, B.H); g.addColorStop(0, '#161d4a'); g.addColorStop(1, '#0b0f2b'); ctx.fillStyle = g; ctx.fillRect(0, 0, B.W, B.H);
    ctx.strokeStyle = 'rgba(120,140,255,.07)'; ctx.lineWidth = 1; for (var gx = 0; gx <= B.W; gx += 30) { ctx.beginPath(); ctx.moveTo(gx, 50); ctx.lineTo(gx, B.H); ctx.stroke(); } for (var gy = 50; gy <= B.H; gy += 30) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(B.W, gy); ctx.stroke(); }
    ctx.fillStyle = 'rgba(120,140,255,.25)'; ctx.fillRect(0, 48, B.W, 2);
    bricks.forEach(function (b) { if (b.hp > 0) drawBrick(b); });
    powers.forEach(drawPower); drawRuler();
    trail.forEach(function (p, i) { ctx.globalAlpha = i / 18; ctx.fillStyle = '#9fc4ff'; ctx.beginPath(); ctx.arc(p.x, p.y, B.BALL_R * (i / 10), 0, 7); ctx.fill(); }); ctx.globalAlpha = 1;
    balls.forEach(function (b) { var gl = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, 16); gl.addColorStop(0, 'rgba(160,200,255,.55)'); gl.addColorStop(1, 'rgba(160,200,255,0)'); ctx.fillStyle = gl; ctx.fillRect(b.x - 16, b.y - 16, 32, 32); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, B.BALL_R, 0, 7); ctx.fill(); });
    parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life / 0.55); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 4, 4); }); ctx.globalAlpha = 1;
    floats.forEach(function (f) { ctx.globalAlpha = Math.min(1, f.t * 2); text(f.text, f.x, f.y, 15, f.c, 'center', 900); }); ctx.globalAlpha = 1;
    if (state !== 'menu') {
      text(t('score') + ' ' + score, 14, 34, 20, '#fff', 'left', 900); text(t('level') + ' ' + level, B.W / 2 + 16, 34, 15, '#9fb0ff', 'center', 800);
      var hs = ''; for (var i = 0; i < lives; i++) hs += '❤️'; ctx.font = '800 15px ' + FONT; ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.fillText(hs, B.W - 14, 33);
      if (fx.wide > 0 || fx.slow > 0) text((fx.wide > 0 ? '↔ ' + Math.ceil(fx.wide) : '') + ' ' + (fx.slow > 0 ? '🐢 ' + Math.ceil(fx.slow) : ''), 14, 48, 11, '#4ecdc4', 'left', 800);
      if (state === 'play' && balls.length && balls[0].stuck) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tt * 5); text(t('launch'), B.W / 2, 470, 18, '#ffd23f', 'center', 800); ctx.globalAlpha = 1; }
    }
    if (banner) { ctx.globalAlpha = Math.min(1, banner.t * 2); text(banner.text, B.W / 2, 400, 28, '#ffd23f', 'center', 900); ctx.globalAlpha = 1; }
    if (state === 'menu') overlay(function () {
      text(t('title'), B.W / 2, 210, 46, '#ffd23f', 'center', 900); text(t('sub'), B.W / 2, 242, 17, '#fff', 'center', 800);
      text(t('how'), B.W / 2, 330, 17, '#c9d2ff', 'center', 800); text(t('how2'), B.W / 2, 356, 13, '#9fb0ff', 'center', 600);
      if (best) text(t('best') + ': ' + best, B.W / 2, 398, 17, '#ffd23f', 'center', 800); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tt * 4); text(t('tap'), B.W / 2, 452, 26, '#fff', 'center', 900); ctx.globalAlpha = 1; text(t('lang'), B.W - 12, B.H - 12, 14, 'rgba(255,255,255,.75)', 'right', 800);
    });
    else if (state === 'over') overlay(function () {
      text(t('over'), B.W / 2, 240, 40, '#ff8a8a', 'center', 900); text(String(score), B.W / 2, 310, 60, '#fff', 'center', 900); text(t('best') + ': ' + best, B.W / 2, 346, 18, '#ffd23f', 'center', 800);
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tt * 4); text(t('again'), B.W / 2, 420, 28, '#fff', 'center', 900); ctx.globalAlpha = 1; text(t('lang'), B.W - 12, B.H - 12, 14, 'rgba(255,255,255,.75)', 'right', 800);
    });
    else if (state === 'paused') overlay(function () { text('☕ ' + t('paused'), B.W / 2, 300, 36, '#ffd23f', 'center', 900); text(t('resume'), B.W / 2, 340, 18, '#fff', 'center', 700); });
  }
  function overlay(fn) { ctx.fillStyle = 'rgba(8,10,34,.72)'; ctx.fillRect(0, 0, B.W, B.H); fn(); }

  // ---- input
  var steer = null;
  function toGame(e) { var r = canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) - ox) / sc, y: ((e.clientY - r.top) - oy) / sc }; }
  function setTarget(p) { targetX = Math.max(paddle.w / 2, Math.min(B.W - paddle.w / 2, p.x)); }
  canvas.addEventListener('pointerdown', function (e) {
    var p = toGame(e); audio();
    if (state === 'play') { steer = e.pointerId; setTarget(p); launch(); try { canvas.setPointerCapture(e.pointerId); } catch (x) {} }
    else if (state === 'paused') state = 'play';
    else if (p.x > B.W - 110 && p.y > B.H - 40) { lang = lang === 'ar' ? 'en' : 'ar'; try { localStorage.setItem('brick.lang', lang); } catch (x) {} document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; }
    else start();
  });
  canvas.addEventListener('pointermove', function (e) { if (state === 'play' && (e.pointerId === steer || e.pointerType === 'mouse')) setTarget(toGame(e)); });
  canvas.addEventListener('pointerup', function (e) { if (e.pointerId === steer) steer = null; });
  addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') held = -1; else if (e.key === 'ArrowRight' || e.key === 'd') held = 1;
    else if (e.key === ' ' || e.key === 'Enter') { if (state === 'play') launch(); else if (state === 'paused') state = 'play'; else start(); e.preventDefault(); }
    else if ((e.key === 'Escape' || e.key === 'p') && state === 'play') state = 'paused';
  });
  addEventListener('keyup', function (e) { if (['ArrowLeft', 'ArrowRight', 'a', 'd'].indexOf(e.key) >= 0) held = 0; });
  document.addEventListener('visibilitychange', function () { if (document.hidden && state === 'play') state = 'paused'; });

  function loop(ts) { var dt = Math.min(0.033, (ts - last) / 1000 || 0); last = ts; update(dt); render(ts / 1000); requestAnimationFrame(loop); }
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  resize(); bricks = B.buildLevel(1); requestAnimationFrame(loop);
  window.__brick = { get state() { return state; }, get score() { return score; }, get lives() { return lives; }, get level() { return level; }, get balls() { return balls; }, get px() { return paddle.x; } };   // test hook
})();
