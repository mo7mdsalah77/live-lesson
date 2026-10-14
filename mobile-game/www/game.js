(function () {
  var L = window.StarLogic;
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  var scale = 1, offX = 0, offY = 0;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    scale = Math.min(canvas.width / L.W, canvas.height / L.H);
    offX = (canvas.width - L.W * scale) / 2; offY = (canvas.height - L.H * scale) / 2;
  }
  addEventListener('resize', resize); resize();

  var best = 0;
  try { best = +localStorage.getItem('stardodge.best') || 0; } catch (e) {}
  var state = 'menu', score = 0, items = [], player = { x: L.W / 2 }, targetX = L.W / 2;
  var spawnTimer = 0, shake = 0, parts = [], stars = [], muted = false, last = 0;
  for (var i = 0; i < 60; i++) stars.push({ x: Math.random() * L.W, y: Math.random() * L.H, s: 0.5 + Math.random() * 1.5 });

  var audio = null;
  function beep(freq, dur, type, vol) {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.15, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
      o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + dur);
    } catch (e) {}
  }

  function start() { state = 'play'; score = 0; items = []; spawnTimer = 0; player.x = targetX = L.W / 2; parts = []; beep(520, 0.12, 'triangle'); }
  function burst(x, y, color, n) {
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, v = 40 + Math.random() * 160;
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6, color: color }); }
  }
  function die() {
    state = 'over'; shake = 0.4; burst(player.x, L.PLAYER_Y, '#ff5a7a', 40); beep(110, 0.5, 'sawtooth', 0.2);
    if (score > best) { best = score; try { localStorage.setItem('stardodge.best', best); } catch (e) {} }
    if (navigator.vibrate) navigator.vibrate(120);
  }

  function pointer(e) {
    var r = canvas.getBoundingClientRect();
    var px = ((e.clientX - r.left) / r.width * canvas.width - offX) / scale;
    targetX = L.clampX(px);
  }
  canvas.addEventListener('pointerdown', function (e) {
    var r = canvas.getBoundingClientRect();
    var px = ((e.clientX - r.left) / r.width * canvas.width - offX) / scale;
    var py = ((e.clientY - r.top) / r.height * canvas.height - offY) / scale;
    if (px > L.W - 56 && py < 56) { muted = !muted; return; }
    if (state !== 'play') { if (state === 'menu' || state === 'over') start(); }
    pointer(e);
  });
  canvas.addEventListener('pointermove', function (e) { if (state === 'play') pointer(e); });
  addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') targetX = L.clampX(targetX - 40);
    if (e.key === 'ArrowRight') targetX = L.clampX(targetX + 40);
    if ((e.key === ' ' || e.key === 'Enter') && state !== 'play') start();
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden && state === 'play') state = 'paused'; });

  function update(dt) {
    shake = Math.max(0, shake - dt);
    stars.forEach(function (s) { s.y += s.s * 20 * dt; if (s.y > L.H) { s.y = 0; s.x = Math.random() * L.W; } });
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    if (state !== 'play') return;
    player.x += (targetX - player.x) * Math.min(1, dt * 18);
    var d = L.difficulty(score);
    spawnTimer -= dt;
    if (spawnTimer <= 0) { items.push(L.spawn(Math.random)); spawnTimer = d.spawnEvery; }
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i]; it.y += d.fallSpeed * dt; it.spin += dt * 3;
      if (L.hit(player, it)) {
        if (it.star) { score++; burst(it.x, it.y, '#ffd84a', 12); beep(880 + Math.min(score, 20) * 20, 0.1, 'square', 0.08); items.splice(i, 1); }
        else { die(); return; }
      } else if (it.y > L.H + 40) items.splice(i, 1);
    }
  }

  function drawStar(x, y, r, rot) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) { var a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }
  function text(t, x, y, size, color, align) {
    ctx.font = 'bold ' + size + 'px system-ui, sans-serif'; ctx.fillStyle = color || '#fff'; ctx.textAlign = align || 'center'; ctx.fillText(t, x, y);
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0b0b2a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    var sx = shake ? (Math.random() - 0.5) * 12 : 0;
    ctx.setTransform(scale, 0, 0, scale, offX + sx * scale, offY);
    ctx.fillStyle = '#12124a'; ctx.fillRect(0, 0, L.W, L.H);
    ctx.fillStyle = '#9aa0ff'; stars.forEach(function (s) { ctx.globalAlpha = 0.4 + s.s / 3; ctx.fillRect(s.x, s.y, s.s, s.s); }); ctx.globalAlpha = 1;
    items.forEach(function (it) {
      if (it.star) { ctx.fillStyle = '#ffd84a'; drawStar(it.x, it.y, it.r + 4, it.spin); }
      else { ctx.fillStyle = '#ff5a7a'; ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.spin); ctx.fillRect(-it.r, -it.r, it.r * 2, it.r * 2); ctx.restore(); }
    });
    if (state !== 'over') {
      ctx.fillStyle = '#4af2c8'; ctx.beginPath();
      ctx.moveTo(player.x, L.PLAYER_Y - L.PLAYER_R); ctx.lineTo(player.x + L.PLAYER_R, L.PLAYER_Y + L.PLAYER_R);
      ctx.lineTo(player.x, L.PLAYER_Y + L.PLAYER_R * 0.5); ctx.lineTo(player.x - L.PLAYER_R, L.PLAYER_Y + L.PLAYER_R); ctx.closePath(); ctx.fill();
    }
    parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life / 0.6); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 4, 4); }); ctx.globalAlpha = 1;
    text(String(score), 16, 44, 36, '#fff', 'left');
    text('Best ' + best, 16, 68, 16, '#9aa0ff', 'left');
    text(muted ? 'SOUND OFF' : 'SOUND ON', L.W - 12, 30, 12, '#9aa0ff', 'right');
    if (state === 'menu') {
      text('STAR DODGE', L.W / 2, 230, 44, '#4af2c8');
      text('Drag to steer', L.W / 2, 290, 20); text('Collect stars, dodge red blocks', L.W / 2, 320, 16, '#9aa0ff');
      text('TAP TO START', L.W / 2, 420, 24, '#ffd84a');
    } else if (state === 'over') {
      text('GAME OVER', L.W / 2, 250, 40, '#ff5a7a');
      text('Score ' + score, L.W / 2, 305, 28); text('Best ' + best, L.W / 2, 340, 18, '#9aa0ff');
      text('TAP TO PLAY AGAIN', L.W / 2, 420, 22, '#ffd84a');
    } else if (state === 'paused') {
      text('PAUSED', L.W / 2, 300, 36); text('Tap to resume', L.W / 2, 340, 18, '#ffd84a');
    }
  }
  canvas.addEventListener('pointerup', function () { if (state === 'paused') state = 'play'; });

  function loop(t) {
    var dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    update(dt); draw(); requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
