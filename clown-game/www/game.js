(function () {
  var C = window.ClownLogic, canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
  var cw = 360, ch = 640, dpr = 1, sc = 1, ox = 0, oy = 0, FONT = '"Cairo", "Segoe UI", Tahoma, system-ui, sans-serif';
  var TXT = {
    ar: { title: 'مهرّج البالونات', sub: 'العب بأرجوحة السيرك', how: 'حرّك الأرجوحة تحت المهرّج وهو نازل', how2: 'اهبط على الطرف التاني عشان يطير زميله ويفرقع البالونات', tap: 'اضغط للبدء', score: 'النقاط', wave: 'الجولة', best: 'الأعلى', over: 'انتهى العرض!', again: 'عرض تاني', lang: 'English', paused: 'استراحة', resume: 'اضغط للمتابعة', bonus: 'بونص الجولة', gold: 'بالونة ذهبية!', oops: 'يا خسارة!' },
    en: { title: 'Balloon Clowns', sub: 'Seesaw circus fun', how: 'Slide the seesaw under the falling clown', how2: 'Land on the other end to launch his partner into the balloons', tap: 'Tap to start', score: 'Score', wave: 'Wave', best: 'Best', over: 'Show over!', again: 'Another show', lang: 'العربية', paused: 'Intermission', resume: 'Tap to resume', bonus: 'Wave bonus', gold: 'Golden balloon!', oops: 'Oops!' }
  };
  var lang = 'ar'; try { lang = localStorage.getItem('clown.lang') === 'en' ? 'en' : 'ar'; } catch (e) {}
  function t(k) { return TXT[lang][k]; }
  var best = 0; try { best = +localStorage.getItem('clown.best') || 0; } catch (e) {}

  var state = 'menu', score = 0, lives = 3, waveNo = 1, wave, seeX = 180, targetX = 180, seeVel = 0, stand = 'L', standBounce = 0;
  var flyer = null, respawn = 0, tilt = -0.2, parts = [], floats = [], shake = 0, last = 0, held = 0, banner = null;

  function resize() {
    var r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2); cw = r.width || innerWidth; ch = r.height || innerHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    sc = Math.min(cw / C.W, ch / C.H); ox = (cw - C.W * sc) / 2; oy = (ch - C.H * sc) / 2;
  }
  addEventListener('resize', resize);

  // ---- audio
  var ac = null, muted = false;
  function audio() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) {} return ac; }
  function tone(f, dur, type, vol, f2) {
    if (muted || !audio()) return; var o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, ac.currentTime);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, ac.currentTime + dur); g.gain.setValueAtTime(vol || 0.1, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
  }
  function pop(gold) { tone(gold ? 1200 : 700 + Math.random() * 300, 0.08, 'square', 0.08, 200); }
  function boing() { tone(180, 0.35, 'triangle', 0.2, 620); }
  function sad() { tone(330, 0.25, 'sawtooth', 0.12, 250); setTimeout(function () { tone(250, 0.35, 'sawtooth', 0.12, 120); }, 220); }

  // ---- flow
  function start() {
    audio(); state = 'play'; score = 0; lives = 3; waveNo = 1; wave = C.newWave(1, Math.random); seeX = targetX = C.W / 2; stand = 'L'; parts = []; floats = [];
    flyer = { x: C.W / 2 + 40, y: 120, vx: 0, vy: 0, ang: 0, spin: 3 }; respawn = 0; banner = { text: t('wave') + ' 1', t: 1.4 };
  }
  function over() { state = 'over'; if (score > best) { best = score; try { localStorage.setItem('clown.best', best); } catch (e) {} } }
  function spawnFaller() { flyer = { x: 70 + Math.random() * 220, y: -30, vx: (Math.random() - 0.5) * 40, vy: 0, ang: 0, spin: 3 }; }
  function confetti(x, y, color, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = 60 + Math.random() * 160; parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.7, c: color }); } }
  function say(text, x, y, c) { floats.push({ text: text, x: x, y: y, t: 1, c: c || '#fff' }); }
  function loseLife(x) {
    lives--; sad(); shake = 0.4; if (navigator.vibrate) navigator.vibrate(120); say(t('oops'), Math.max(40, Math.min(320, x)), C.PLANE_Y - 40, '#ff8a8a'); flyer = null;
    if (lives <= 0) over(); else respawn = 1.1;
  }

  function update(dt) {
    shake = Math.max(0, shake - dt); standBounce += dt;
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt; }); parts = parts.filter(function (p) { return p.life > 0; });
    floats.forEach(function (f) { f.t -= dt; f.y -= 36 * dt; }); floats = floats.filter(function (f) { return f.t > 0; });
    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
    var tl = stand === 'L' ? -0.2 : 0.2; tilt += (tl - tilt) * Math.min(1, dt * 14);
    if (state !== 'play') return;
    if (held) targetX = Math.max(C.HALF, Math.min(C.W - C.HALF, targetX + held * 420 * dt));
    var nx = seeX + Math.max(-700 * dt, Math.min(700 * dt, targetX - seeX)); seeVel = (nx - seeX) / Math.max(dt, 0.001); seeX = nx;
    C.moveBalloons(wave, dt);
    if (!flyer) { respawn -= dt; if (respawn <= 0) spawnFaller(); return; }
    var f = flyer, prevY = f.y; f.vy += C.G * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.ang += f.spin * dt;
    if (f.x < 14) { f.x = 14; f.vx = Math.abs(f.vx); } if (f.x > C.W - 14) { f.x = C.W - 14; f.vx = -Math.abs(f.vx); }
    C.popAt(wave, f.x, f.y, 15).forEach(function (b) { score += b.pts; pop(b.gold); confetti(b.x, b.y, b.color, b.gold ? 22 : 10); say('+' + b.pts, b.x, b.y, b.gold ? '#ffd23f' : '#fff'); if (b.gold) say(t('gold'), C.W / 2, 220, '#ffd23f'); });
    if (C.cleared(wave)) { var bn = C.waveBonus(waveNo); score += bn; waveNo++; wave = C.newWave(waveNo, Math.random); banner = { text: t('wave') + ' ' + waveNo + ' · +' + bn, t: 1.8 }; }
    if (f.vy > 0 && prevY < C.PLANE_Y && f.y >= C.PLANE_Y) {
      var L = C.landing(f.x, seeX, stand);
      if (L.result === 'good') {
        var l = C.launch(stand, L.accuracy, seeVel), side = stand;
        flyer = { x: C.endX(seeX, side), y: C.PLANE_Y - 4, vx: l.vx, vy: l.vy, ang: 0, spin: side === 'L' ? 7 : -7 };      // standing clown is launched
        stand = side === 'L' ? 'R' : 'L'; boing(); confetti(L.target, C.PLANE_Y, '#ffe9a8', 6); if (L.accuracy > 0.85) say('★', L.target, C.PLANE_Y - 30, '#ffd23f');
      } else loseLife(f.x);
    } else if (f.y > C.H + 40) loseLife(f.x);
  }

  // ---- drawing
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function text(s, x, y, size, color, align, weight) { ctx.font = (weight || 800) + ' ' + size + 'px ' + FONT; ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.fillText(s, x, y); }

  function drawTent() {
    var g = ctx.createLinearGradient(0, 0, 0, C.H); g.addColorStop(0, '#4a1024'); g.addColorStop(1, '#2a0914'); ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.H);
    for (var i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,240,220,.07)' : 'rgba(255,60,90,.10)'; ctx.beginPath(); ctx.moveTo(C.W / 2, -40); ctx.lineTo(i * 30 - 0, C.H); ctx.lineTo(i * 30 + 30, C.H); ctx.fill(); }
    ctx.fillStyle = '#ffd23f'; for (var s = 0; s < 9; s++) { ctx.beginPath(); ctx.arc(20 + s * 40, 30, 22, 0, Math.PI); ctx.fill(); ctx.fillStyle = s % 2 ? '#ffd23f' : '#ff5a6e'; }
    ctx.fillStyle = '#c89a5b'; ctx.fillRect(0, C.BOARD_Y + 30, C.W, C.H); ctx.fillStyle = '#b3884c'; for (var k = 0; k < 18; k++) ctx.fillRect(k * 22 + (k % 2) * 6, C.BOARD_Y + 40 + (k % 3) * 20, 10, 3);
  }
  function drawBalloon(b) {
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(b.x, b.y + C.BALLOON_R); ctx.lineTo(b.x + 2, b.y + C.BALLOON_R + 12); ctx.stroke();
    ctx.fillStyle = b.color; ctx.beginPath(); ctx.ellipse(b.x, b.y, C.BALLOON_R * 0.92, C.BALLOON_R, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(b.x - 4, b.y - 5, 3.2, 5, -0.5, 0, 7); ctx.fill();
    if (b.gold) { text('★', b.x, b.y + 5, 14, '#fff3b0', 'center', 900); }
  }
  function drawClown(x, y, ang, scale, mood) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(scale, scale);
    ctx.fillStyle = '#ff5a6e'; ctx.beginPath(); ctx.ellipse(-8, 20, 9, 5, 0, 0, 7); ctx.ellipse(8, 20, 9, 5, 0, 0, 7); ctx.fill();            // shoes
    ctx.fillStyle = '#4ecdc4'; rr(-11, -4, 22, 24, 8); ctx.fill(); ctx.fillStyle = '#ffd23f'; [[-5, 4], [5, 10], [-4, 14]].forEach(function (d) { ctx.beginPath(); ctx.arc(d[0], d[1], 2.6, 0, 7); ctx.fill(); });   // suit
    ctx.fillStyle = '#7b6cff'; ctx.beginPath(); ctx.arc(-14, -14, 7, 0, 7); ctx.arc(14, -14, 7, 0, 7); ctx.fill();                                // hair
    ctx.fillStyle = '#fff1e0'; ctx.beginPath(); ctx.arc(0, -12, 11, 0, 7); ctx.fill();                                                          // face
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-4, -15, 1.7, 0, 7); ctx.arc(4, -15, 1.7, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff2e4d'; ctx.beginPath(); ctx.arc(0, -11, 3.6, 0, 7); ctx.fill();                                                         // nose
    ctx.strokeStyle = '#d6203c'; ctx.lineWidth = 1.8; ctx.beginPath(); if (mood === 'sad') ctx.arc(0, -3, 4, Math.PI * 1.15, Math.PI * 1.85); else ctx.arc(0, -8, 5, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = '#ff5a6e'; ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(0, -37); ctx.lineTo(6, -22); ctx.fill();                          // hat
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(0, -37, 2.8, 0, 7); ctx.fill(); ctx.restore();
  }
  function drawSeesaw() {
    ctx.save(); ctx.translate(seeX, C.BOARD_Y); ctx.fillStyle = '#7a4a22'; ctx.beginPath(); ctx.moveTo(-22, 30); ctx.lineTo(0, -2); ctx.lineTo(22, 30); ctx.fill();
    ctx.rotate(tilt); ctx.fillStyle = '#e2a653'; rr(-C.HALF, -8, C.HALF * 2, 12, 6); ctx.fill(); ctx.fillStyle = '#ff5a6e'; rr(-C.HALF, -8, 18, 12, 6); ctx.fill(); rr(C.HALF - 18, -8, 18, 12, 6); ctx.fill(); ctx.restore();
  }
  function render(tt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#2a0914'; ctx.fillRect(0, 0, cw, ch);
    var sx = shake ? (Math.random() - 0.5) * 10 * shake : 0; ctx.translate(ox + sx, oy); ctx.scale(sc, sc); ctx.beginPath(); ctx.rect(0, 0, C.W, C.H); ctx.clip();
    drawTent();
    if (wave) wave.balloons.forEach(function (b) { if (b.alive) drawBalloon(b); });
    drawSeesaw();
    var sit = tilt, side = stand, dx = side === 'L' ? -C.END : C.END, ey = C.BOARD_Y + dx * Math.sin(sit), ex = seeX + dx * Math.cos(sit);
    drawClown(ex, ey - 22 - Math.max(0, Math.sin(standBounce * 6)) * 2, 0, 1, 'happy');
    if (flyer) drawClown(flyer.x, flyer.y, flyer.ang, 1, flyer.vy > 0 && flyer.y > 300 ? 'sad' : 'happy');
    parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life / 0.7); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 4, 4); }); ctx.globalAlpha = 1;
    floats.forEach(function (f) { ctx.globalAlpha = Math.min(1, f.t * 2); text(f.text, f.x, f.y, 20, f.c, 'center', 900); }); ctx.globalAlpha = 1;
    // HUD
    if (state !== 'menu') {
      text(t('score') + ' ' + score, 14, 62, 20, '#fff', 'left', 900); text(t('wave') + ' ' + waveNo, C.W / 2, 62, 16, '#ffe9a8', 'center', 800);
      var ls = ''; for (var i = 0; i < 3; i++) ls += i < lives ? '🤡' : '·'; ctx.font = '800 20px ' + FONT; ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.fillText(ls, C.W - 14, 62);
    }
    if (banner) { ctx.globalAlpha = Math.min(1, banner.t * 2); text(banner.text, C.W / 2, 300, 34, '#ffd23f', 'center', 900); ctx.globalAlpha = 1; }
    if (state === 'menu') overlay(function () {
      text(t('title'), C.W / 2, 220, 44, '#ffd23f', 'center', 900); text(t('sub'), C.W / 2, 252, 17, '#fff', 'center', 800);
      text(t('how'), C.W / 2, 330, 17, '#ffe9a8', 'center', 800); text(t('how2'), C.W / 2, 356, 13, '#f3cfd6', 'center', 600);
      if (best) text(t('best') + ': ' + best, C.W / 2, 398, 17, '#ffd23f', 'center', 800);
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tt * 4); text(t('tap'), C.W / 2, 452, 26, '#fff', 'center', 900); ctx.globalAlpha = 1; text(t('lang'), C.W - 12, C.H - 12, 14, 'rgba(255,255,255,.75)', 'right', 800);
    });
    else if (state === 'over') overlay(function () {
      text(t('over'), C.W / 2, 240, 40, '#ff8a8a', 'center', 900); text(String(score), C.W / 2, 310, 60, '#fff', 'center', 900); text(t('best') + ': ' + best, C.W / 2, 346, 18, '#ffd23f', 'center', 800);
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tt * 4); text(t('again'), C.W / 2, 420, 28, '#fff', 'center', 900); ctx.globalAlpha = 1; text(t('lang'), C.W - 12, C.H - 12, 14, 'rgba(255,255,255,.75)', 'right', 800);
    });
    else if (state === 'paused') overlay(function () { text('☕ ' + t('paused'), C.W / 2, 300, 36, '#ffd23f', 'center', 900); text(t('resume'), C.W / 2, 340, 18, '#fff', 'center', 700); });
  }
  function overlay(fn) { ctx.fillStyle = 'rgba(30,6,16,.7)'; ctx.fillRect(0, 0, C.W, C.H); fn(); }

  // ---- input
  var steer = null;
  function toGame(e) { var r = canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) - ox) / sc, y: ((e.clientY - r.top) - oy) / sc }; }
  function setTarget(p) { targetX = Math.max(C.HALF, Math.min(C.W - C.HALF, p.x)); }
  canvas.addEventListener('pointerdown', function (e) {
    var p = toGame(e); audio();
    if (state === 'play') { steer = e.pointerId; setTarget(p); try { canvas.setPointerCapture(e.pointerId); } catch (x) {} }
    else if (state === 'paused') state = 'play';
    else if (p.x > C.W - 110 && p.y > C.H - 40) { lang = lang === 'ar' ? 'en' : 'ar'; try { localStorage.setItem('clown.lang', lang); } catch (x) {} document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; }
    else start();
  });
  canvas.addEventListener('pointermove', function (e) { if (state === 'play' && (e.pointerId === steer || e.pointerType === 'mouse')) setTarget(toGame(e)); });
  canvas.addEventListener('pointerup', function (e) { if (e.pointerId === steer) steer = null; });
  addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') held = -1; else if (e.key === 'ArrowRight' || e.key === 'd') held = 1;
    else if (e.key === ' ' || e.key === 'Enter') { if (state === 'paused') state = 'play'; else if (state !== 'play') start(); }
    else if ((e.key === 'Escape' || e.key === 'p') && state === 'play') state = 'paused';
  });
  addEventListener('keyup', function (e) { if (['ArrowLeft', 'ArrowRight', 'a', 'd'].indexOf(e.key) >= 0) held = 0; });
  document.addEventListener('visibilitychange', function () { if (document.hidden && state === 'play') state = 'paused'; });

  function loop(ts) { var dt = Math.min(0.033, (ts - last) / 1000 || 0); last = ts; update(dt); render(ts / 1000); requestAnimationFrame(loop); }
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  resize(); wave = C.newWave(1, Math.random); requestAnimationFrame(loop);
  window.__clown = { get state() { return state; }, get score() { return score; }, get lives() { return lives; }, get seeX() { return seeX; }, get flyer() { return flyer; }, get stand() { return stand; }, start: start };   // test hook
})();
