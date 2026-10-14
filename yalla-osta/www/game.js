(function () {
  var L = window.OstaLogic, canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
  var W = 360, H = 640, dpr = 1, K = 16;

  var TXT = {
    ar: { title: 'يلا يا أسطى', sub: 'سواق ميكروباص على الدائري', how: 'اسحب يميناً ويساراً للتحكم', how2: 'خُد الركاب وتفادى العربيات · كلاكس يفتح لك الطريق', tap: 'اضغط عشان نبدأ', best: 'أعلى أجرة', fare: 'الأجرة', cur: 'ج', kmh: 'كم/س', km: 'كم', over: 'خلص المشوار!', again: 'مشوار تاني', lang: 'English', paused: 'استراحة شاي', resume: 'اضغط للمتابعة', trip: 'المشوار', riders: 'ركاب' },
    en: { title: 'Yalla Osta', sub: 'Microbus driver on the Ring Road', how: 'Drag left and right to steer', how2: 'Pick up riders, dodge traffic, honk to clear the way', tap: 'Tap to start', best: 'Best fare', fare: 'Fare', cur: 'EGP', kmh: 'km/h', km: 'km', over: 'Trip over!', again: 'Another trip', lang: 'العربية', paused: 'Tea break', resume: 'Tap to resume', trip: 'Trip', riders: 'riders' }
  };
  var SAY = {
    ar: { crash: ['يا نهار أبيض!', 'حرام عليك يا أسطى!', 'مش تبص قدامك؟', 'يا ساتر!', 'ربنا يسترها!'], honk: ['ماشي ماشي!', 'حاضر يا باشا!', 'أهو أهو!', 'استنى بس!', 'على جنب يا ريس'], rider: ['على جنب يا أسطى!', 'أجرة يا كابتن!', 'وقف هنا!', 'يا أسطى! يا أسطى!'], pick: ['الله ينور!', 'اتفضل يا باشا', 'ركبنا ركبنا!'], bump: ['آه ضهري!', 'مطب!', 'هدّي يا أسطى!'], sign: ['كشري التحرير', 'فول وطعمية', 'عصير قصب', 'ورشة الأمل', 'مياه وعصائر', 'حلويات الفرح', 'شاي بالنعناع'] },
    en: { crash: ['Oh no!', 'Watch the road, Osta!', 'My car!', 'Ya satir!', 'Seriously?!'], honk: ['Okay okay!', 'Coming, boss!', 'Moving!', 'Hold on!', 'Sorry chief!'], rider: ['Over here, Osta!', 'Fare, captain!', 'Stop here!', 'Osta! Osta!'], pick: ['Bless you!', 'Hop in, boss', 'We are in!'], bump: ['My back!', 'Speed bump!', 'Slow down!'], sign: ['Koshary Tahrir', 'Foul & Falafel', 'Sugarcane juice', 'Hope Garage', 'Water & juices', 'Joy Sweets', 'Mint tea'] }
  };
  var lang = 'ar'; try { lang = localStorage.getItem('osta.lang') === 'en' ? 'en' : 'ar'; } catch (e) {}
  function t(k) { return TXT[lang][k]; }
  function say(kind) { var a = SAY[lang][kind]; return a[Math.floor(Math.random() * a.length)]; }
  var FONT = '"Cairo", "Segoe UI", Tahoma, system-ui, sans-serif';

  var best = 0; try { best = +localStorage.getItem('osta.best') || 0; } catch (e) {}
  var state = 'menu', fare = 0, riders = 0, km = 0, lives = 3, slow = 1, invul = 0, shake = 0, flash = 0, honkCd = 0, spawnT = 0, propT = 0;
  var pu = 0, target = 0, objs = [], props = [], floats = [], playerSay = null, held = 0, buildings = [], last = 0, honkPress = 0;

  function resize() {
    var r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width || innerWidth; H = r.height || innerHeight; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    buildings = []; var x = 0; while (x < W + 40) { var bw = 26 + Math.random() * 40, bh = 30 + Math.random() * 90; buildings.push({ x: x, w: bw, h: bh, s: Math.random() }); x += bw + 2; }
  }
  addEventListener('resize', resize);

  // ----- geometry -----
  function horizon() { return H * 0.36; }
  function sc(d) { return 1 / (1 + d / K); }
  function yAt(d) { return horizon() + (H * 0.97 - horizon()) * sc(d); }
  function RW() { return W * 0.66; }
  function xAt(u, d) { return W / 2 + u * RW() * sc(d); }

  // ----- audio -----
  var ac = null, engine = null, muted = false;
  function audio() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) {} return ac; }
  function tone(f, dur, type, vol, f2) {
    if (muted || !audio()) return; var o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, ac.currentTime);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, ac.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.1, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
  }
  function hornSound() { tone(392, 0.45, 'square', 0.07); tone(494, 0.45, 'square', 0.07); }
  function crashSound() { tone(140, 0.4, 'sawtooth', 0.14, 40); tone(90, 0.5, 'square', 0.1, 30); }
  function engineOn(on) {
    if (!audio() || muted) on = false;
    if (on && !engine) { var o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; g.gain.value = 0.025; o.connect(g); g.connect(ac.destination); o.start(); engine = { o: o, g: g }; }
    if (!on && engine) { try { engine.o.stop(); } catch (e) {} engine = null; }
  }

  // ----- game flow -----
  function start() {
    audio(); state = 'play'; fare = riders = km = 0; lives = 3; slow = 1; invul = 0; shake = flash = 0; honkCd = 0; spawnT = 0.4; pu = target = 0; objs = []; props = []; floats = []; playerSay = null;
    for (var d = 14; d < L.MAXD; d += 12) props.push(makeProp(d));
    for (var k = 0; k < 6; k++) L.spawnRow(Math.random, []).forEach(function (o) { o.d = 40 + k * 12; o.speed = Math.min(o.speed, 55); if (o.type === 'rider') o.say = { text: say('rider'), t: 99 }; objs.push(o); });
    engineOn(true);
  }
  function over() {
    state = 'over'; engineOn(false); if (fare > best) { best = fare; try { localStorage.setItem('osta.best', best); } catch (e) {} }
  }
  function makeProp(d) {
    var r = Math.random(), side = Math.random() < 0.5 ? -1 : 1, type = r < 0.45 ? 'pole' : r < 0.8 ? 'palm' : 'sign';
    return { d: d, side: side, type: type, text: type === 'sign' ? say('sign') : '' };
  }
  function crash() {
    if (invul > 0) return; lives--; slow = 0.4; invul = 1.8; shake = 0.5; flash = 0.35; crashSound(); if (navigator.vibrate) navigator.vibrate(150);
    playerSay = { text: say('crash'), t: 1.6 }; if (lives <= 0) over();
  }
  function honkNow() {
    if (state !== 'play' || honkCd > 0) return; honkCd = 2.2; honkPress = 0.2; hornSound();
    L.honk(pu, objs).forEach(function (o) { o.say = { text: say('honk'), t: 1.4 }; });
  }

  function update(dt) {
    shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt); honkPress = Math.max(0, honkPress - dt);
    floats.forEach(function (f) { f.t -= dt; f.y -= 40 * dt; }); floats = floats.filter(function (f) { return f.t > 0; });
    if (playerSay) { playerSay.t -= dt; if (playerSay.t <= 0) playerSay = null; }
    if (state !== 'play') return;
    honkCd = Math.max(0, honkCd - dt); invul = Math.max(0, invul - dt); slow = Math.min(1, slow + dt * 0.4);
    if (held) target = Math.max(-0.9, Math.min(0.9, target + held * dt * 1.7));
    pu += (target - pu) * Math.min(1, dt * 9);
    var v = L.speedAt(km) * slow; km += v / 3600 * 2 * dt;
    if (engine) engine.o.frequency.value = 55 + v * 0.55;
    // spawn
    spawnT -= dt; if (spawnT <= 0) {
      spawnT = L.spawnGap(v);
      var blocked = [0, 1, 2].filter(function (l) { return objs.some(function (o) { return o.d > L.MAXD - 28 && L.laneOf(o.u) === l && !L.TYPES[o.type].pickup && !L.TYPES[o.type].bump; }); });
      L.spawnRow(Math.random, blocked.length >= 2 ? [0, 1, 2] : blocked).forEach(function (o) { o.speed = Math.min(o.speed, v * 0.8); if (o.type === 'rider') o.say = { text: say('rider'), t: 99 }; objs.push(o); });
    }
    propT -= dt * v / 100; if (propT <= 0) { propT = 1.05; props.push(makeProp(L.MAXD)); }
    // move
    objs.forEach(function (o) {
      o.d -= (L.TYPES[o.type].pickup || L.TYPES[o.type].bump ? v * 0.22 : L.approach(v, o.speed)) * dt;
      if (o.target != null) { var dx = o.target - o.u, st = Math.sign(dx) * dt * 0.9; if (Math.abs(dx) <= Math.abs(st)) { o.u = o.target; o.target = null; } else o.u += st; }
      if (o.say && o.say.t < 90) { o.say.t -= dt; if (o.say.t <= 0) o.say = null; }
      if (!o.done && L.hit(pu, o)) {
        o.done = true;
        if (o.type === 'rider') { fare += 10; riders++; floats.push({ text: '+10 ' + t('cur'), x: W / 2, y: yAt(L.PLAYER_D) - 70, t: 1, c: '#ffd84a' }); playerSay = { text: say('pick'), t: 1.3 }; tone(880, 0.12, 'sine', 0.1, 1320); }
        else if (o.type === 'bump') { slow = Math.min(slow, 0.6); shake = 0.25; playerSay = { text: say('bump'), t: 1.2 }; tone(110, 0.2, 'triangle', 0.15, 70); }
        else crash();
      }
    });
    objs = objs.filter(function (o) { return o.d > -4 && !o.gone && !(o.done && (o.type === 'rider')); });
    props.forEach(function (p) { p.d -= v * 0.22 * dt; }); props = props.filter(function (p) { return p.d > -6; });
  }

  // ----- drawing -----
  function mix(a, b, k) { return a.map(function (x, i) { return Math.round(x + (b[i] - x) * k); }); }
  function rgb(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }
  var DAY = { top: [96, 190, 235], bot: [255, 226, 160], road: [78, 80, 90], ground: [214, 184, 120], sun: 1 };
  var DUSK = { top: [88, 52, 128], bot: [255, 140, 70], road: [58, 56, 70], ground: [150, 110, 90] };
  var NIGHT = { top: [8, 10, 30], bot: [34, 36, 82], road: [30, 31, 40], ground: [40, 38, 50] };
  function theme() {
    var n = 0.5 - 0.5 * Math.cos(2 * Math.PI * ((km / 9 + 0.25) % 1)), a, b, k;
    if (n < 0.5) { a = DAY; b = DUSK; k = n * 2; } else { a = DUSK; b = NIGHT; k = (n - 0.5) * 2; }
    return { n: n, top: mix(a.top, b.top, k), bot: mix(a.bot, b.bot, k), road: mix(a.road, b.road, k), ground: mix(a.ground, b.ground, k) };
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function text(s, x, y, size, color, align, weight) { ctx.font = (weight || 800) + ' ' + size + 'px ' + FONT; ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.fillText(s, x, y); }
  function bubble(s, x, y, color) {
    ctx.font = '800 14px ' + FONT; var w = ctx.measureText(s).width + 18, h = 26; x = Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, x));
    ctx.fillStyle = '#fffdf2'; rr(x - w / 2, y - h, w, h, 10); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 5, y - 1); ctx.lineTo(x, y + 7); ctx.lineTo(x + 5, y - 1); ctx.fill();
    ctx.fillStyle = color || '#2b2140'; ctx.textAlign = 'center'; ctx.fillText(s, x, y - 8);
  }

  function drawVan(x, yb, w, body, stripe, kind, back) {
    var h = w * (kind === 'bus' ? 0.95 : 0.8); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, yb, w * 0.58, w * 0.12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#16151c'; rr(x - w * 0.42, yb - w * 0.1, w * 0.2, w * 0.14, 2); ctx.fill(); rr(x + w * 0.22, yb - w * 0.1, w * 0.2, w * 0.14, 2); ctx.fill();   // tyres
    ctx.fillStyle = body; rr(x - w / 2, yb - h, w, h * 0.92, w * 0.1); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)'; rr(x - w / 2, yb - h, w, h * 0.2, w * 0.1); ctx.fill();     // roof shade
    ctx.fillStyle = '#1d2a3a'; rr(x - w * 0.4, yb - h * 0.82, w * 0.8, h * 0.34, w * 0.06); ctx.fill();   // rear window
    ctx.fillStyle = stripe; ctx.fillRect(x - w / 2, yb - h * 0.42, w, h * 0.1);                    // stripe
    var lit = back ? '#ff3b3b' : '#ff6a5a'; ctx.fillStyle = lit; rr(x - w * 0.47, yb - h * 0.3, w * 0.15, h * 0.12, 2); ctx.fill(); rr(x + w * 0.32, yb - h * 0.3, w * 0.15, h * 0.12, 2); ctx.fill();   // tail lights
    ctx.fillStyle = '#f4f4ea'; rr(x - w * 0.16, yb - h * 0.2, w * 0.32, h * 0.1, 1); ctx.fill();   // plate
    return h;
  }
  function drawTuk(x, yb, w) {
    var h = w * 0.95; ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, yb, w * 0.55, w * 0.12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1c9c58'; rr(x - w * 0.5, yb - h * 0.62, w, h * 0.5, w * 0.1); ctx.fill();
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.moveTo(x - w * 0.55, yb - h * 0.6); ctx.lineTo(x - w * 0.4, yb - h); ctx.lineTo(x + w * 0.4, yb - h); ctx.lineTo(x + w * 0.55, yb - h * 0.6); ctx.fill();
    ctx.fillStyle = '#ff3b3b'; ctx.fillRect(x - w * 0.4, yb - h * 0.35, w * 0.14, h * 0.1); ctx.fillRect(x + w * 0.26, yb - h * 0.35, w * 0.14, h * 0.1);
    ctx.fillStyle = '#16151c'; ctx.fillRect(x - w * 0.12, yb - h * 0.1, w * 0.24, h * 0.14); return h;
  }
  var CARS = ['#d94f4f', '#4a7bd9', '#2fb67c', '#e6a23c', '#8a64d6', '#d9d9d9', '#f06fa6', '#3bb7c9'];
  function drawRider(x, yb, w, tt) {
    var s = w || 30; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, yb, s * 0.5, s * 0.12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a6fd8'; rr(x - s * 0.22, yb - s * 1.0, s * 0.44, s * 0.78, 5); ctx.fill();                  // body
    ctx.fillStyle = '#f2c29b'; ctx.beginPath(); ctx.arc(x, yb - s * 1.2, s * 0.22, 0, 7); ctx.fill();               // head
    ctx.strokeStyle = '#f2c29b'; ctx.lineWidth = Math.max(2, s * 0.09); ctx.lineCap = 'round'; var wv = Math.sin(tt * 9) * s * 0.18;
    ctx.beginPath(); ctx.moveTo(x + s * 0.2, yb - s * 0.9); ctx.lineTo(x + s * 0.5 + wv, yb - s * 1.35); ctx.stroke();    // waving arm
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x - s * 0.45, yb - s * 1.4, s * 0.17, 0, 7); ctx.fill(); ctx.fillStyle = '#7a5a00'; ctx.font = '800 ' + Math.max(8, s * 0.2) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('£', x - s * 0.45, yb - s * 1.34);
  }
  function drawBump(o) {
    var y1 = yAt(o.d + 0.9), y2 = yAt(o.d), x1 = xAt(o.u - 0.3, o.d + 0.9), x2 = xAt(o.u + 0.3, o.d + 0.9), x3 = xAt(o.u + 0.3, o.d), x4 = xAt(o.u - 0.3, o.d);
    for (var i = 0; i < 6; i++) { var a = i / 6, b = (i + 1) / 6; ctx.fillStyle = i % 2 ? '#1b1b1b' : '#ffcf33';
      ctx.beginPath(); ctx.moveTo(x1 + (x2 - x1) * a, y1); ctx.lineTo(x1 + (x2 - x1) * b, y1); ctx.lineTo(x4 + (x3 - x4) * b, y2); ctx.lineTo(x4 + (x3 - x4) * a, y2); ctx.fill(); }
  }
  function drawProp(p, th, tt) {
    var d = p.d, s = sc(d), x = xAt(p.side * 1.3, d), y = yAt(d), h = 95 * s * (H / 640);
    if (p.type === 'pole') {
      ctx.strokeStyle = '#6b6b78'; ctx.lineWidth = Math.max(1.5, 5 * s); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h * 1.3); ctx.lineTo(x - p.side * h * 0.35, y - h * 1.38); ctx.stroke();
      var lx = x - p.side * h * 0.35, ly = y - h * 1.38; ctx.fillStyle = th.n > 0.45 ? '#fff3b0' : '#c9c9d4'; ctx.beginPath(); ctx.arc(lx, ly, Math.max(2, 6 * s), 0, 7); ctx.fill();
      if (th.n > 0.45) { var g = ctx.createRadialGradient(lx, ly, 0, lx, ly, h * 0.7); g.addColorStop(0, 'rgba(255,240,170,.45)'); g.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = g; ctx.fillRect(lx - h, ly - h, h * 2, h * 2); }
    } else if (p.type === 'palm') {
      ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = Math.max(2, 7 * s); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + p.side * h * 0.1, y - h * 0.6, x, y - h * 1.1); ctx.stroke();
      ctx.strokeStyle = '#2f8f4e'; ctx.lineWidth = Math.max(2, 5 * s); for (var i = 0; i < 6; i++) { var a = -Math.PI * (0.1 + i * 0.16); ctx.beginPath(); ctx.moveTo(x, y - h * 1.1); ctx.quadraticCurveTo(x + Math.cos(a) * h * 0.5, y - h * 1.1 - Math.sin(a) * h * 0.4, x + Math.cos(a) * h * 0.7, y - h * 1.1 - Math.sin(a) * h * 0.1 + h * 0.2); ctx.stroke(); }
    } else {
      var bw = h * 1.5, bh = h * 0.65; ctx.strokeStyle = '#55555f'; ctx.lineWidth = Math.max(1.5, 4 * s); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h * 0.9); ctx.stroke();
      ctx.fillStyle = '#e8a53c'; rr(x - bw / 2, y - h * 0.9 - bh, bw, bh, 4 * s + 1); ctx.fill();
      if (bh > 14) text(p.text, x, y - h * 0.9 - bh * 0.35, Math.max(8, bh * 0.38), '#3a2000', 'center', 800);
    }
  }

  function render(tt) {
    var th = theme(), hz = horizon();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var sx = shake ? (Math.random() - 0.5) * 14 * shake : 0, sy = shake ? (Math.random() - 0.5) * 10 * shake : 0; ctx.translate(sx, sy);
    var g = ctx.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, rgb(th.top)); g.addColorStop(1, rgb(th.bot)); ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, hz + 20);
    if (th.n > 0.55) { ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, (th.n - 0.55) * 3) + ')'; for (var i = 0; i < 40; i++) { ctx.fillRect((i * 97) % W, (i * 53) % (hz * 0.8), 1.5, 1.5); } }
    var sunY = hz * (0.35 + th.n * 0.6); ctx.fillStyle = th.n > 0.6 ? '#f4f1d8' : '#ffe9a0'; ctx.beginPath(); ctx.arc(W * (th.n > 0.6 ? 0.75 : 0.25), sunY, 26, 0, 7); ctx.fill();
    // skyline
    buildings.forEach(function (b) { ctx.fillStyle = rgb(mix(th.ground, [20, 20, 30], 0.5 + th.n * 0.3)); ctx.fillRect(b.x, hz - b.h, b.w, b.h + 2);
      if (th.n > 0.4) { ctx.fillStyle = 'rgba(255,220,120,' + (th.n - 0.3) + ')'; for (var wy = hz - b.h + 6; wy < hz - 4; wy += 11) for (var wx = b.x + 4; wx < b.x + b.w - 5; wx += 9) if (((wx * 7 + wy * 3 + b.s * 100) | 0) % 3 === 0) ctx.fillRect(wx, wy, 4, 5); } });
    ctx.fillStyle = rgb(th.ground); ctx.fillRect(-20, hz, W + 40, H - hz + 20);
    // road strips (alternate shade scrolls with distance)
    var off = (km * 90) % 8;
    for (var d = L.MAXD; d > 0; d -= 1.5) {
      var y1 = yAt(d), y2 = yAt(d - 1.5), xl1 = xAt(-1, d), xr1 = xAt(1, d), xl2 = xAt(-1, d - 1.5), xr2 = xAt(1, d - 1.5), band = Math.floor((d + off) / 4) % 2;
      ctx.fillStyle = rgb(band ? th.road : mix(th.road, [0, 0, 0], 0.12)); ctx.beginPath(); ctx.moveTo(xl1, y1); ctx.lineTo(xr1, y1); ctx.lineTo(xr2, y2 + 1); ctx.lineTo(xl2, y2 + 1); ctx.fill();
      ctx.fillStyle = band ? '#f2f2f2' : '#d83a3a'; var e1 = 0.05 * sc(d) * RW(), e2 = 0.05 * sc(d - 1.5) * RW();
      ctx.beginPath(); ctx.moveTo(xl1 - e1, y1); ctx.lineTo(xl1, y1); ctx.lineTo(xl2, y2 + 1); ctx.lineTo(xl2 - e2, y2 + 1); ctx.fill(); ctx.beginPath(); ctx.moveTo(xr1, y1); ctx.lineTo(xr1 + e1, y1); ctx.lineTo(xr2 + e2, y2 + 1); ctx.lineTo(xr2, y2 + 1); ctx.fill();
      if (band) { ctx.fillStyle = 'rgba(255,255,255,.7)'; [-0.31, 0.31].forEach(function (lu) { var w1 = 0.012 * sc(d) * RW(), w2 = 0.012 * sc(d - 1.5) * RW(); ctx.beginPath(); ctx.moveTo(xAt(lu, d) - w1, y1); ctx.lineTo(xAt(lu, d) + w1, y1); ctx.lineTo(xAt(lu, d - 1.5) + w2, y2 + 1); ctx.lineTo(xAt(lu, d - 1.5) - w2, y2 + 1); ctx.fill(); }); }
    }
    // things far -> near
    var list = []; objs.forEach(function (o) { list.push({ d: o.d, o: o }); }); props.forEach(function (p) { list.push({ d: p.d, p: p }); }); list.push({ d: L.PLAYER_D, me: true });
    list.sort(function (a, b) { return b.d - a.d; });
    list.forEach(function (it) {
      if (it.p) return drawProp(it.p, th, tt);
      if (it.me) return drawPlayer(tt);
      var o = it.o, s = sc(o.d), x = xAt(o.u, o.d), y = yAt(o.d), w = o.w * RW() * s, top = y;
      if (o.type === 'bump') drawBump(o);
      else if (o.type === 'rider') { drawRider(x, y, RW() * 0.14 * s * 1.6, tt); top = y - RW() * 0.14 * s * 1.6 * 1.5; }
      else if (o.type === 'tuktuk') top = y - drawTuk(x, y, w);
      else { o.color = o.color || CARS[(Math.random() * CARS.length) | 0]; top = y - drawVan(x, y, w, o.type === 'bus' ? '#f4f4ee' : o.color, o.type === 'bus' ? '#e8742a' : 'rgba(255,255,255,.25)', o.type, true); }
      if (th.n > 0.5 && !(o.type === 'bump' || o.type === 'rider')) { var gg = ctx.createRadialGradient(x, y - w * 0.25, 0, x, y - w * 0.25, w * 0.9); gg.addColorStop(0, 'rgba(255,60,60,.35)'); gg.addColorStop(1, 'rgba(255,60,60,0)'); ctx.fillStyle = gg; ctx.fillRect(x - w, y - w * 1.2, w * 2, w * 1.5); }
      if (o.say && o.d < 60 && o.d > 4) bubble(o.say.text, x, top - 6, o.type === 'rider' ? '#2c5bd1' : '#2b2140');
    });
    floats.forEach(function (f) { ctx.globalAlpha = Math.min(1, f.t * 2); text(f.text, f.x, f.y, 26, f.c, 'center', 900); ctx.globalAlpha = 1; });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (flash > 0) { ctx.fillStyle = 'rgba(255,50,50,' + flash + ')'; ctx.fillRect(0, 0, W, H); }
    hud(); overlay(tt);
  }
  function drawPlayer(tt) {
    if (state === 'over') return;
    if (invul > 0 && Math.floor(tt * 14) % 2) return;
    var x = xAt(pu, L.PLAYER_D), y = yAt(L.PLAYER_D), w = L.PLAYER_W * RW() * sc(L.PLAYER_D), bounce = slow < 1 && state === 'play' ? Math.sin(tt * 40) * 2 : 0;
    var h = drawVan(x, y + bounce, w, '#f7f4ea', '#2aa7d8', 'van', true);
    ctx.fillStyle = '#ffe18a'; ctx.font = '900 ' + Math.max(8, w * 0.16) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.fillText(lang === 'ar' ? 'يلا يا أسطى' : 'YALLA OSTA', x, y + bounce - h * 0.58);
    if (playerSay) bubble(playerSay.text, x, y - h - 10, '#b3261e');
  }
  function btnHonk() { return { x: W - 56, y: H - 86 - 0, r: 38 }; }
  function hud() {
    if (state === 'menu') return;
    var v = Math.round(L.speedAt(km) * slow);
    text(String(v), 16, 58, 52, 'rgba(255,255,255,.92)', 'left', 900); text(t('kmh'), 16 + ctx.measureText(String(v)).width + 6, 58, 15, 'rgba(255,255,255,.75)', 'left', 800);
    var pct = Math.min(1, v / 190); ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(16, 68, 120, 7, 4); ctx.fill(); var gr = ctx.createLinearGradient(16, 0, 136, 0); gr.addColorStop(0, '#5ee27a'); gr.addColorStop(0.6, '#ffd84a'); gr.addColorStop(1, '#ff5a4a'); ctx.fillStyle = gr; rr(16, 68, 120 * pct, 7, 4); ctx.fill();
    text(km.toFixed(1) + ' ' + t('km'), 16, 98, 15, 'rgba(255,255,255,.8)', 'left', 800);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(W / 2 - 52, 14, 104, 54, 14); ctx.fill(); text(t('fare'), W / 2, 32, 12, '#ffe18a', 'center', 800); text(fare + ' ' + t('cur'), W / 2, 58, 24, '#fff', 'center', 900);
    var hs = ''; for (var i = 0; i < 3; i++) hs += i < lives ? '❤️' : '🖤'; ctx.font = '800 17px ' + FONT; ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.fillText(hs, W - 56, 36);
    // pause
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(W - 30, 30, 18, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(W - 36, 22, 4, 16); ctx.fillRect(W - 28, 22, 4, 16);
    var b = btnHonk(), ready = honkCd <= 0; ctx.fillStyle = ready ? (honkPress ? '#ffb020' : '#ffd84a') : 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.stroke(); text('📯', b.x, b.y + 9, 30, '#000', 'center'); if (!ready) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 5, -Math.PI / 2, -Math.PI / 2 + (1 - honkCd / 2.2) * 6.283); ctx.stroke(); }
  }
  function overlay(tt) {
    if (state === 'play') return;
    ctx.fillStyle = 'rgba(10,8,30,.62)'; ctx.fillRect(0, 0, W, H);
    var cy = H * 0.34;
    if (state === 'menu') {
      text(t('title'), W / 2, cy, Math.min(64, W * 0.17), '#ffd84a', 'center', 900); text(t('sub'), W / 2, cy + 34, 18, '#fff', 'center', 800);
      text('🚐', W / 2, cy + 110, 64, '#fff'); text(t('how'), W / 2, cy + 160, 17, '#d6d2ff', 'center', 700); text(t('how2'), W / 2, cy + 184, 14, '#b9b4f0', 'center', 600);
      if (best) text(t('best') + ': ' + best + ' ' + t('cur'), W / 2, cy + 224, 18, '#ffe18a', 'center', 800);
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tt * 4); text(t('tap'), W / 2, cy + 276, 26, '#fff', 'center', 900); ctx.globalAlpha = 1;
    } else if (state === 'over') {
      text(t('over'), W / 2, cy, 44, '#ff6a5a', 'center', 900); text(fare + ' ' + t('cur'), W / 2, cy + 70, 56, '#fff', 'center', 900);
      text(riders + ' ' + t('riders') + ' · ' + km.toFixed(1) + ' ' + t('km'), W / 2, cy + 104, 18, '#d6d2ff', 'center', 700); text(t('best') + ': ' + best + ' ' + t('cur'), W / 2, cy + 140, 18, '#ffe18a', 'center', 800);
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tt * 4); text(t('again'), W / 2, cy + 210, 28, '#fff', 'center', 900); ctx.globalAlpha = 1;
    } else if (state === 'paused') { text('☕ ' + t('paused'), W / 2, cy + 40, 38, '#ffd84a', 'center', 900); text(t('resume'), W / 2, cy + 84, 20, '#fff', 'center', 700); }
    if (state !== 'paused') text(t('lang'), W - 14, H - 14, 15, 'rgba(255,255,255,.75)', 'right', 800);
  }

  // ----- input -----
  var steerId = null;
  function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function setTarget(p) { target = Math.max(-0.9, Math.min(0.9, (p.x - W / 2) / (W / 2) * 1.0)); }
  canvas.addEventListener('pointerdown', function (e) {
    var p = pos(e); audio();
    if (state === 'play') {
      var b = btnHonk(); if ((p.x - b.x) * (p.x - b.x) + (p.y - b.y) * (p.y - b.y) < (b.r + 12) * (b.r + 12)) return honkNow();
      if (p.x > W - 54 && p.y < 54) { state = 'paused'; engineOn(false); return; }
      steerId = e.pointerId; setTarget(p); try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
    } else if (state === 'paused') { state = 'play'; engineOn(true); }
    else if (p.x > W - 120 && p.y > H - 44) { lang = lang === 'ar' ? 'en' : 'ar'; try { localStorage.setItem('osta.lang', lang); } catch (x) {} document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; }
    else start();
  });
  canvas.addEventListener('pointermove', function (e) { if (state === 'play' && (e.pointerId === steerId || e.pointerType === 'mouse')) setTarget(pos(e)); });
  function endSteer(e) { if (e.pointerId === steerId) steerId = null; }
  canvas.addEventListener('pointerup', endSteer); canvas.addEventListener('pointercancel', endSteer);
  addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') held = -1; else if (e.key === 'ArrowRight' || e.key === 'd') held = 1;
    else if (e.key === ' ' || e.key === 'h') { if (state === 'play') honkNow(); else if (state === 'paused') { state = 'play'; engineOn(true); } else start(); e.preventDefault(); }
    else if (e.key === 'Escape' || e.key === 'p') { if (state === 'play') { state = 'paused'; engineOn(false); } else if (state === 'paused') { state = 'play'; engineOn(true); } }
  });
  addEventListener('keyup', function (e) { if (['ArrowLeft', 'ArrowRight', 'a', 'd'].indexOf(e.key) >= 0) held = 0; });
  document.addEventListener('visibilitychange', function () { if (document.hidden && state === 'play') { state = 'paused'; engineOn(false); } });

  function loop(ts) { var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; update(dt); render(ts / 1000); requestAnimationFrame(loop); }
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  resize(); requestAnimationFrame(loop);
  window.__osta = { get state() { return state; }, get fare() { return fare; }, get lives() { return lives; }, start: start };   // test hook
})();
