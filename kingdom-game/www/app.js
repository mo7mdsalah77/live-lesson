(function () {
  var K = window.KingLogic, view = document.getElementById('view'), top = document.getElementById('top'), status = document.getElementById('status'),
      tabs = document.getElementById('tabs'), modal = document.getElementById('modal'), toastEl = document.getElementById('toast');
  var KEY = 'realmrush.save.v1', now = function () { return Date.now(); };

  var T = {
    en: { city: 'City', army: 'Army', map: 'Map', heroes: 'Heroes', food: 'Food', wood: 'Wood', stone: 'Stone', gold: 'Gold',
      hall: 'Town Hall', farm: 'Farm', sawmill: 'Sawmill', quarry: 'Quarry', mine: 'Gold Mine', warehouse: 'Warehouse', barracks: 'Barracks',
      inf: 'Infantry', arc: 'Archers', cav: 'Cavalry', knight: 'Sir Aldric', ranger: 'Lyra', rider: 'Kael',
      infD: 'Strong vs Cavalry', arcD: 'Strong vs Infantry', cavD: 'Strong vs Archers', level: 'Lv {n}', build: 'Build', upgrade: 'Upgrade', max: 'Max level',
      needHall: 'Upgrade the Town Hall first', locked: 'Requires Town Hall {n}', busy: 'The builder is busy', poor: 'Not enough resources', noBarracks: 'Build a Barracks first',
      batch: 'Invalid amount', time: 'Time', rush: 'Rush', building: 'Building', training: 'Training', done: '{b} is now level {n}!', trained: '{n} {t} ready!',
      train: 'Train', power: 'Army power', perSec: '/s', storage: 'Storage', attack: 'Attack', camp: 'Enemy Camp {n}', cleared: 'Cleared', next: 'Next target', victory: 'Victory!', defeat: 'Defeat',
      noTroops: 'Train troops first', lost: 'Lost', healed: 'Healed', rewards: 'Rewards', reduced: 'Replay reward', enemy: 'Enemy', ok: 'OK', maxed: 'Max',
      heroBonus: '+{p}% attack for {t}', locked2: 'Unlocks at Town Hall {n}', lang: 'العربية', reset: 'Reset game', confirmReset: 'Delete your kingdom and start over?', welcome: 'Welcome back! Your kingdom kept growing.',
      h0: 'Upgrade the Town Hall to unlock more buildings.', h1: 'Build a Barracks to train troops.', h2: 'Train some troops, then attack Enemy Camp 1 on the Map.', h3: 'Attack the next enemy camp on the Map.', h4: 'Upgrade heroes with gold to boost your army.',
      counters: 'Infantry beats Cavalry, Cavalry beats Archers, Archers beat Infantry', tapHelp: 'Tap a building', sendAll: 'Attack with all troops', youHave: 'You have', maxBatch: 'max' },
    ar: { city: 'المدينة', army: 'الجيش', map: 'الخريطة', heroes: 'الأبطال', food: 'طعام', wood: 'خشب', stone: 'حجر', gold: 'ذهب',
      hall: 'القاعة الرئيسية', farm: 'مزرعة', sawmill: 'منشرة', quarry: 'محجر', mine: 'منجم ذهب', warehouse: 'مخزن', barracks: 'ثكنة',
      inf: 'مشاة', arc: 'رماة', cav: 'فرسان', knight: 'السير ألدريك', ranger: 'ليرا', rider: 'كايل',
      infD: 'قوي ضد الفرسان', arcD: 'قوي ضد المشاة', cavD: 'قوي ضد الرماة', level: 'م {n}', build: 'ابنِ', upgrade: 'ترقية', max: 'أقصى مستوى',
      needHall: 'رقّ القاعة الرئيسية أولاً', locked: 'تتطلب القاعة {n}', busy: 'البنّاء مشغول', poor: 'موارد غير كافية', noBarracks: 'ابنِ ثكنة أولاً',
      batch: 'كمية غير صالحة', time: 'الوقت', rush: 'تسريع', building: 'قيد البناء', training: 'قيد التدريب', done: '{b} وصل للمستوى {n}!', trained: '{n} {t} جاهزون!',
      train: 'تدريب', power: 'قوة الجيش', perSec: '/ث', storage: 'التخزين', attack: 'هجوم', camp: 'معسكر العدو {n}', cleared: 'تم', next: 'الهدف التالي', victory: 'انتصار!', defeat: 'هزيمة',
      noTroops: 'درّب جنوداً أولاً', lost: 'خسائر', healed: 'تم علاجهم', rewards: 'الغنائم', reduced: 'غنائم الإعادة', enemy: 'العدو', ok: 'حسناً', maxed: 'أقصى',
      heroBonus: '+{p}% هجوم لـ{t}', locked2: 'يفتح عند القاعة {n}', lang: 'English', reset: 'إعادة اللعبة', confirmReset: 'حذف مملكتك والبدء من جديد؟', welcome: 'مرحباً بعودتك! مملكتك استمرت بالنمو.',
      h0: 'رقّ القاعة الرئيسية لفتح مبانٍ جديدة.', h1: 'ابنِ ثكنة لتدريب الجنود.', h2: 'درّب جنوداً ثم هاجم معسكر العدو 1 من الخريطة.', h3: 'هاجم معسكر العدو التالي من الخريطة.', h4: 'رقّ الأبطال بالذهب لتقوية جيشك.',
      counters: 'المشاة تهزم الفرسان، الفرسان تهزم الرماة، الرماة تهزم المشاة', tapHelp: 'اضغط على مبنى', sendAll: 'هجوم بكل الجنود', youHave: 'لديك', maxBatch: 'أقصى' }
  };
  var lang = load('lang', (navigator.language || '').indexOf('ar') === 0 ? 'ar' : 'en'), tab = 'city', S;
  function load(k, d) { try { var v = localStorage.getItem('realmrush.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem('realmrush.' + k, JSON.stringify(v)); } catch (e) {} }
  function t(k, v) { var s = (T[lang][k] != null ? T[lang][k] : T.en[k]) || k; for (var x in (v || {})) s = s.replace('{' + x + '}', v[x]); return s; }
  function saveGame() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function fmt(n) { n = Math.floor(n); return n >= 10000 ? (n / 1000).toFixed(1) + 'K' : String(n); }
  function dur(ms) { var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); s %= 60; return (h ? h + ':' + ('0' + m).slice(-2) : m) + ':' + ('0' + s).slice(-2); }
  var ICON = { food: '🌾', wood: '🪵', stone: '🪨', gold: '💰' };
  function costHtml(cost) { return '<div class="cost">' + K.RES.filter(function (r) { return cost[r]; }).map(function (r) { return '<span class="' + (S.res[r] >= cost[r] ? '' : 'no') + '">' + ICON[r] + ' ' + fmt(cost[r]) + '</span>'; }).join('') + '</div>'; }
  function toast(msg) { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toast.id); toast.id = setTimeout(function () { toastEl.hidden = true; }, 2600); }

  // ---------- init ----------
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  var away = 0;
  if (!S || !S.res) S = K.newGame(now()); else away = now() - S.last;
  handle(K.advance(S, now()));
  if (away > 60000) setTimeout(function () { toast(t('welcome')); }, 300);

  function handle(events) {
    events.forEach(function (e) {
      if (e.type === 'built') toast(t('done', { b: t(e.key), n: e.level }));
      if (e.type === 'trained') toast(t('trained', { n: e.n, t: t(e.troop) }));
    });
    if (events.length) saveGame();
  }

  // ---------- rendering ----------
  function renderTop() {
    var r = K.rates(S), cap = K.cap(S);
    top.innerHTML = K.RES.map(function (k) {
      return '<div class="res' + (S.res[k] >= cap ? ' full' : '') + '">' + ICON[k] + '<b>' + fmt(S.res[k]) + '</b><small>+' + (r[k] ? r[k].toFixed(1) : 0) + t('perSec') + '</small></div>';
    }).join('');
  }
  function jobHtml(label, icon, job, total, rushable) {
    var left = job.endsAt - now(), pct = Math.min(100, 100 - left / total * 100);
    return '<div class="job"><span>' + icon + ' ' + label + '<div class="bar"><i style="width:' + pct + '%" data-bar="' + job.endsAt + '" data-total="' + total + '"></i></div></span><span class="t" data-end="' + job.endsAt + '">' + dur(left) + '</span>' +
      (rushable ? '<button class="btn sm go" data-act="rush" data-v="' + (job === S.q ? 'q' : 'train') + '">⚡ ' + K.rushCost(Math.max(0, left)) + '</button>' : '') + '</div>';
  }
  function renderStatus() {
    var h = '';
    if (S.q) h += jobHtml(t('building') + ': ' + t(S.q.key) + ' → ' + t('level', { n: S.q.level }), '🔨', S.q, K.upgradeTime(S.q.key, S.q.level) * 1000, true);
    if (S.train) h += jobHtml(t('training') + ': ' + S.train.n + ' ' + t(S.train.type), K.TROOPS[S.train.type].icon, S.train, K.trainTime(S, S.train.type, S.train.n) * 1000, true);
    status.innerHTML = h;
  }
  function renderTabs() {
    var items = [['city', '🏰'], ['army', '⚔️'], ['map', '🗺️'], ['heroes', '🤴']];
    tabs.innerHTML = items.map(function (i) { return '<button data-act="tab" data-v="' + i[0] + '" class="' + (tab === i[0] ? 'on' : '') + '"><span>' + i[1] + '</span>' + t(i[0]) + '</button>'; }).join('');
  }
  function hint() {
    if (K.level(S, 'hall') < 2) return t('h0');
    if (!K.level(S, 'barracks')) return t('h1');
    if (S.cleared < 1) return S.troops.inf + S.troops.arc + S.troops.cav < 5 ? t('h2') : t('h3');
    if (S.cleared < 4) return t('h3');
    return t('h4');
  }
  function prodText(k) { var b = K.BUILD[k], lv = K.level(S, k); if (b.rate && lv) return Object.keys(b.rate).map(function (r) { return ICON[r] + ' +' + (b.rate[r] * lv).toFixed(2) + t('perSec'); }).join(' '); if (k === 'warehouse') return t('storage') + ': ' + fmt(K.cap(S)); if (k === 'barracks' && lv) return t('maxBatch') + ' ' + K.maxBatch(S); return ''; }

  function renderCity() {
    var html = '<div class="hint">💡 ' + hint() + '</div><div class="grid">' + K.ORDER.map(function (k) {
      var lv = K.level(S, k), block = K.upgradeBlock(S, k), locked = K.BUILD[k].req > K.level(S, 'hall'), working = S.q && S.q.key === k;
      return '<div class="card bld ' + (working ? 'busy' : locked ? 'lock' : !block ? 'ok' : '') + '" data-act="bld" data-v="' + k + '"><span class="lv">' + (lv ? t('level', { n: lv }) : '—') + '</span><div class="ic">' + K.BUILD[k].icon + '</div><h3>' + t(k) + '</h3><p>' +
        (locked ? '🔒 ' + t('locked', { n: K.BUILD[k].req }) : prodText(k) || '&nbsp;') + '</p></div>';
    }).join('') + '</div>';
    view.innerHTML = html;
  }
  function buildingSheet(k) {
    var lv = K.level(S, k), tgt = lv + 1, block = K.upgradeBlock(S, k), maxed = tgt > (k === 'hall' ? K.HALL_MAX : K.level(S, 'hall')) && block !== 'locked';
    var body = '<div class="big">' + K.BUILD[k].icon + '</div><h1>' + t(k) + ' · ' + (lv ? t('level', { n: lv }) : '—') + '</h1><p class="muted" style="text-align:center">' + (prodText(k) || '') + '</p>';
    if (block === 'max') body += '<p class="win" style="text-align:center">' + t('max') + '</p>';
    else {
      body += '<p>' + (lv ? t('upgrade') : t('build')) + ' → ' + t('level', { n: tgt }) + ' · ⏱ ' + dur(K.upgradeTime(k, tgt) * 1000) + '</p>' + costHtml(K.upgradeCost(k, tgt));
      if (block && block !== 'poor' && block !== 'busy') body += '<p class="lose">' + (block === 'locked' ? t('locked', { n: K.BUILD[k].req }) : t(block)) + '</p>';
      if (block === 'busy') body += '<p class="lose">' + t('busy') + '</p>';
      body += '<button class="btn go" style="width:100%" data-act="upgrade" data-v="' + k + '"' + (block ? ' disabled' : '') + '>' + (lv ? t('upgrade') : t('build')) + '</button>';
    }
    openModal(body);
  }

  var batch = { inf: 5, arc: 5, cav: 5 };
  function renderArmy() {
    var tot = S.troops.inf + S.troops.arc + S.troops.cav;
    view.innerHTML = '<div class="hint">💡 ' + hint() + '</div><div class="card row"><div class="grow"><h3>' + t('power') + '</h3><p class="muted">' + t('counters') + '</p></div><b style="font-size:24px;color:var(--gold)">' + fmt(K.power(S.troops)) + '</b></div><div class="stack" style="margin-top:8px">' +
      K.TYPES.map(function (k) {
        var n = Math.min(batch[k], K.maxBatch(S)), block = K.trainBlock(S, k, n);
        return '<div class="card"><div class="row"><span style="font-size:34px">' + K.TROOPS[k].icon + '</span><div class="grow"><h3>' + t(k) + ' · ' + S.troops[k] + '</h3><p class="muted">' + t(k + 'D') + ' · ⚔️' + K.TROOPS[k].atk + ' ❤️' + K.TROOPS[k].hp + '</p></div></div>' +
          costHtml(K.trainCost(k, n)) + '<div class="row"><div class="stepper"><button class="btn sm" data-act="batch" data-v="' + k + ':-5">−5</button><b>' + n + '</b><button class="btn sm" data-act="batch" data-v="' + k + ':5">+5</button></div><div class="grow muted">⏱ ' + dur(K.trainTime(S, k, n) * 1000) + '</div>' +
          '<button class="btn go sm" data-act="train" data-v="' + k + '"' + (block ? ' disabled' : '') + '>' + t('train') + '</button></div>' + (block && block !== 'poor' && block !== 'busy' ? '<p class="lose muted">' + t(block) + '</p>' : '') + '</div>';
      }).join('') + '</div>';
  }

  function renderMap() {
    var order = [], h = '<div class="hint">💡 ' + hint() + '</div><div class="stack">', i, n;
    for (i = S.cleared + 1; i <= Math.min(K.CAMPS, S.cleared + 3); i++) order.push(i);   // next target first, then a peek ahead
    for (i = S.cleared; i >= 1; i--) order.push(i);                                       // cleared camps (reduced rewards)
    for (var k = 0; k < order.length; k++) {
      n = order[k];
      var e = K.camp(n), locked = n > S.cleared + 1, first = n === S.cleared + 1, rw = K.reward(n, first), done = n <= S.cleared;
      h += '<div class="card camp ' + (locked ? 'locked' : '') + '"><div class="row"><span style="font-size:34px">' + (done ? '🏳️' : locked ? '🔒' : '🏴') + '</span><div class="grow"><h3>' + t('camp', { n: n }) + '</h3><p class="en">' + K.TYPES.map(function (k) { return K.TROOPS[k].icon + e[k]; }).join(' ') + '</p>' +
        '<div class="cost">' + K.RES.map(function (r) { return '<span>' + ICON[r] + ' ' + fmt(rw[r]) + '</span>'; }).join('') + '</div>' + (done ? '<span class="pill">✓ ' + t('cleared') + ' · ' + t('reduced') + '</span>' : first ? '<span class="pill">' + t('next') + '</span>' : '') + '</div>' +
        (locked ? '' : '<button class="btn go sm" data-act="attack" data-v="' + n + '">' + t('attack') + '</button>') + '</div></div>';
    }
    view.innerHTML = h + '</div>';
  }

  function renderHeroes() {
    var m = K.heroBonus(S);
    view.innerHTML = '<div class="hint">💡 ' + t('h4') + '</div><div class="stack">' + Object.keys(K.HEROES).map(function (h) {
      var d = K.HEROES[h], lv = S.heroes[h] || 0, open = K.heroUnlocked(S, h), c = K.heroCost(lv);
      return '<div class="card' + (open ? '' : ' bld lock') + '"><div class="row"><span style="font-size:48px">' + d.icon + '</span><div class="grow"><h3>' + t(h) + ' · ' + t('level', { n: lv }) + '</h3><p class="muted">' + t('heroBonus', { p: Math.round((m[d.troop] - 1) * 100), t: t(d.troop) }) + '</p>' +
        (open ? '' : '<p class="muted">🔒 ' + t('locked2', { n: d.hall }) + '</p>') + '</div>' + (open ? (lv >= 10 ? '<span class="pill">' + t('maxed') + '</span>' : '<button class="btn go sm" data-act="hero" data-v="' + h + '"' + (S.res.gold >= c ? '' : ' disabled') + '>💰 ' + fmt(c) + '</button>') : '') + '</div></div>';
    }).join('') + '</div><div class="stack" style="margin-top:14px"><button class="btn sm" data-act="lang">' + t('lang') + '</button><button class="btn sm red" data-act="reset">' + t('reset') + '</button></div>';
  }

  function render() {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = lang;
    var st = view.scrollTop; renderTop(); renderStatus(); renderTabs();
    ({ city: renderCity, army: renderArmy, map: renderMap, heroes: renderHeroes })[tab](); view.scrollTop = st;
  }
  function openModal(html) { modal.innerHTML = '<div class="sheet">' + html + '</div>'; modal.hidden = false; }
  function closeModal() { modal.hidden = true; modal.innerHTML = ''; }

  function report(r) {
    var tr = function (o) { return K.TYPES.filter(function (k) { return o[k]; }).map(function (k) { return K.TROOPS[k].icon + o[k]; }).join(' ') || '—'; };
    openModal('<div class="big">' + (r.win ? '🏆' : '💀') + '</div><h1 class="' + (r.win ? 'win' : 'lose') + '">' + t(r.win ? 'victory' : 'defeat') + '</h1><p class="muted" style="text-align:center">' + t('camp', { n: r.camp }) + '</p>' +
      '<p>' + t('enemy') + ': ' + tr(r.enemy) + '</p><p>' + t('lost') + ': ' + tr(r.lost) + '</p><p>' + t('healed') + ': ' + tr(r.healed) + '</p>' +
      (r.reward ? '<p>' + t('rewards') + '</p><div class="cost">' + K.RES.map(function (k) { return '<span>' + ICON[k] + ' +' + fmt(r.reward[k]) + '</span>'; }).join('') + '</div>' : '') +
      '<button class="btn go" style="width:100%;margin-top:8px" data-act="close">' + t('ok') + '</button>');
  }

  // ---------- actions ----------
  var A = {
    tab: function (v) { tab = v; render(); },
    bld: buildingSheet,
    upgrade: function (k) { if (K.startUpgrade(S, k, now())) { saveGame(); closeModal(); render(); } },
    rush: function (which) { if (K.rush(S, now(), which)) { handle(K.advance(S, now())); saveGame(); render(); } else toast(t('poor')); },
    batch: function (v) { var p = v.split(':'); batch[p[0]] = Math.max(1, Math.min(K.maxBatch(S), batch[p[0]] + +p[1])); render(); },
    train: function (k) { if (K.startTrain(S, k, Math.min(batch[k], K.maxBatch(S)), now())) { saveGame(); render(); } },
    attack: function (n) {
      if (S.troops.inf + S.troops.arc + S.troops.cav < 1) return toast(t('noTroops'));
      var r = K.attack(S, +n); if (r) { saveGame(); render(); report(r); }
    },
    hero: function (h) { if (K.upgradeHero(S, h)) { saveGame(); render(); } },
    close: closeModal,
    lang: function () { lang = lang === 'ar' ? 'en' : 'ar'; store('lang', lang); render(); },
    reset: function () { if (confirm(t('confirmReset'))) { S = K.newGame(now()); saveGame(); tab = 'city'; render(); } }
  };
  document.addEventListener('click', function (e) {
    if (e.target === modal) return closeModal();
    var b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    var fn = A[b.dataset.act]; if (fn) fn(b.dataset.v);
  });

  // ---------- loop ----------
  function tick() {
    var ev = K.advance(S, now()); if (ev.length) { handle(ev); render(); } else { renderTop(); }
    Array.prototype.forEach.call(document.querySelectorAll('[data-end]'), function (el) { el.textContent = dur(+el.dataset.end - now()); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-bar]'), function (el) { el.style.width = Math.min(100, 100 - (+el.dataset.bar - now()) / +el.dataset.total * 100) + '%'; });
    if (!tick.n || ++tick.n % 10 === 0) saveGame(); tick.n = tick.n || 1;
  }
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { handle(K.advance(S, now())); render(); } else saveGame(); });
  render();
})();
