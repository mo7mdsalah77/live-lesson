(function () {
  var L = window.MafiaLogic, app = document.getElementById('app'), timerId = null;
  function load(k, d) { try { var v = localStorage.getItem('imp.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem('imp.' + k, JSON.stringify(v)); } catch (e) {} }

  var S = {
    lang: load('lang', (navigator.language || '').indexOf('ar') === 0 ? 'ar' : 'en'),
    mode: 'mafia', names: load('names', ['', '', '', '']), category: 'random', minutes: load('minutes', 3),
    players: [], night: 0, dealIdx: 0, imposters: [], word: '', cat: null, pick: null, nm: null, nd: null, error: ''
  };

  function t(k, v) {
    var s = (window.I18N[S.lang][k] != null ? window.I18N[S.lang][k] : window.I18N.en[k]) || k;
    for (var x in (v || {})) s = s.replace('{' + x + '}', v[x]);
    return s;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function btn(act, label, cls, val) { return '<button class="' + (cls || '') + '" data-a="' + act + '"' + (val != null ? ' data-v="' + val + '"' : '') + '>' + label + '</button>'; }

  function view(html) {
    clearInterval(timerId); S.pick = null;
    document.documentElement.lang = S.lang; document.documentElement.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
    app.innerHTML = html; window.scrollTo(0, 0);
  }
  function alive() { return S.players.filter(function (p) { return p.alive; }); }
  function grid(list, extra) {
    return '<div class="grid">' + list.map(function (p) { return '<button data-a="pick" data-v="' + p.id + '">' + esc(p.name) + '</button>'; }).join('') + (extra || '') + '</div>';
  }
  function pickable(confirmAct, confirmLabel) { return '<div class="spacer"></div>' + btn(confirmAct, confirmLabel, 'primary" id="confirm" disabled="disabled'); }
  function runTimer(sec, onEnd) {
    var el = document.getElementById('timer'); if (!el) return;
    function show() { el.textContent = Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2); }
    show();
    timerId = setInterval(function () {
      sec--; show();
      if (sec <= 0) { clearInterval(timerId); el.textContent = t('timeUp'); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); if (onEnd) onEnd(); }
    }, 1000);
  }

  // ---------- screens ----------
  function home() {
    view('<div class="top"><span></span>' + btn('lang', t('language'), 'ghost') + '</div><div class="logo">🕵️</div><h1>' + t('title') + '</h1><p class="sub">' + t('sub') + '</p><div class="spacer"></div>' +
      btn('setup', '<b>🎭 ' + t('mafia') + '</b><span>' + t('mafiaDesc') + '</span>', 'mode" data-v="mafia') +
      btn('setup', '<b>🤫 ' + t('imposter') + '</b><span>' + t('imposterDesc') + '</span>', 'mode" data-v="imposter'));
  }

  function setup() {
    var min = S.mode === 'mafia' ? 4 : 3, cats = '';
    if (S.mode === 'imposter') {
      cats = '<label class="sub">' + t('category') + '</label><select id="cat"><option value="random">' + t('random') + '</option>' +
        Object.keys(window.WORDS).map(function (k) { return '<option value="' + k + '"' + (S.category === k ? ' selected' : '') + '>' + window.WORDS[k][S.lang].name + '</option>'; }).join('') + '</select>';
    }
    var mins = [1, 2, 3, 5, 10].map(function (m) { return '<option' + (S.minutes === m ? ' selected' : '') + '>' + m + '</option>'; }).join('');
    view('<div class="top">' + btn('home', '‹ ' + t('back'), 'ghost') + '<span class="pill">' + t(S.mode) + '</span></div><h2>' + t('players') + '</h2>' +
      S.names.map(function (n, i) {
        return '<div class="row"><input data-i="' + i + '" maxlength="14" placeholder="' + t('playerN', { n: i + 1 }) + '" value="' + esc(n) + '">' +
          (S.names.length > min ? '<button class="x" data-a="del" data-v="' + i + '">✕</button>' : '') + '</div>';
      }).join('') +
      (S.names.length < 15 ? btn('add', t('addPlayer')) : '') + cats +
      '<label class="sub">' + t('timer') + '</label><select id="mins">' + mins + '</select>' +
      (S.error ? '<p class="sub" style="color:var(--red)">' + S.error + '</p>' : '') + '<div class="spacer"></div>' + btn('begin', t('start'), 'primary'));
  }

  function begin() {
    var names = S.names.map(function (n) { return n.trim(); }), min = S.mode === 'mafia' ? 4 : 3;
    var ok = names.every(Boolean) && new Set(names.map(function (n) { return n.toLowerCase(); })).size === names.length && names.length >= min;
    if (!ok) { S.error = t('minPlayers', { n: min }); return setup(); }
    S.error = ''; S.names = names; save('names', names); save('minutes', S.minutes);
    S.dealIdx = 0; S.night = 0;
    if (S.mode === 'mafia') S.players = L.assignRoles(names, Math.random);
    else {
      S.players = names.map(function (n, i) { return { id: i, name: n, alive: true }; });
      S.imposters = L.pickImposters(names.length, Math.random);
      var keys = Object.keys(window.WORDS), key = S.category === 'random' ? keys[Math.floor(Math.random() * keys.length)] : S.category;
      S.cat = window.WORDS[key][S.lang].name; S.word = L.pickWord(window.WORDS[key][S.lang].words, Math.random);
    }
    dealPass();
  }

  // ---------- dealing (shared) ----------
  function dealPass() {
    var p = S.players[S.dealIdx];
    view('<div class="spacer"></div><div class="emoji" style="text-align:center">📱</div><p class="sub">' + t('passTo') + '</p><div class="big" style="text-align:center">' + esc(p.name) + '</div><p class="sub">' + t('secret') + '</p><div class="spacer"></div>' + btn('dealShow', t('iAm'), 'primary'));
  }
  function dealShow() {
    var p = S.players[S.dealIdx], body;
    if (S.mode === 'mafia') {
      var mates = p.role === 'mafia' ? S.players.filter(function (q) { return q.role === 'mafia' && q.id !== p.id; }) : [];
      body = '<p class="sub">' + t('youAre') + '</p><div class="role ' + p.role + '">' + t('role_' + p.role) + '</div><p>' + t('desc_' + p.role) + '</p>' +
        (mates.length ? '<p class="sub">' + t('teammates') + ': <b>' + mates.map(function (m) { return esc(m.name); }).join('، ') + '</b></p>' : '');
    } else if (S.imposters.indexOf(p.id) >= 0) {
      body = '<div class="emoji">🤫</div><div class="role mafia" style="font-size:30px">' + t('youImposter') + '</div><p class="sub">' + t('hint', { c: esc(S.cat) }) + '</p>';
    } else body = '<p class="sub">' + t('yourWord') + '</p><div class="role citizen">' + esc(S.word) + '</div><p class="sub">' + esc(S.cat) + '</p>';
    var more = S.dealIdx < S.players.length - 1;
    view('<div class="spacer"></div><div class="card">' + body + '</div><div class="spacer"></div>' + btn('dealNext', more ? t('hidePass') : t('last'), 'primary'));
  }
  function dealNext() {
    S.dealIdx++;
    if (S.dealIdx < S.players.length) return dealPass();
    if (S.mode === 'mafia') view('<div class="spacer"></div><div class="emoji" style="text-align:center">✅</div><h2>' + t('allDealt') + '</h2><div class="spacer"></div>' + btn('night', t('beginNight'), 'primary'));
    else impReady();
  }

  // ---------- mafia ----------
  function night() {
    S.night++; S.nm = S.nd = null;
    view('<div class="spacer"></div><div class="emoji" style="text-align:center">🌙</div><h1>' + t('night', { n: S.night }) + '</h1><h2>' + t('everyoneSleep') + '</h2><div class="spacer"></div>' + btn('stepMafia', t('next'), 'primary'));
  }
  function stepMafia() {
    var targets = alive().filter(function (p) { return p.role !== 'mafia'; });
    view('<div class="emoji" style="text-align:center">🔪</div><h2>' + t('wakeMafia') + '</h2>' + grid(targets) + pickable('mafiaDone', t('confirm')));
  }
  function stepRole(role, key, prompt, emoji, targets) {
    var has = S.players.some(function (p) { return p.role === role; });
    if (!has) return null;
    var living = alive().some(function (p) { return p.role === role; });
    if (!living) return view('<div class="emoji" style="text-align:center">' + emoji + '</div><h2>' + prompt + '</h2><div class="spacer"></div>' + btn(key + 'Skip', t('next'), 'primary'));
    view('<div class="emoji" style="text-align:center">' + emoji + '</div><h2>' + prompt + '</h2>' + grid(targets()) + pickable(key + 'Done', t('confirm')));
    return true;
  }
  function stepDoctor() { if (!stepRole('doctor', 'doctor', t('wakeDoctor'), '💉', alive)) stepDetective(); }
  function stepDetective() {
    if (!stepRole('detective', 'detective', t('wakeDetective'), '🔎', function () { return alive().filter(function (p) { return p.role !== 'detective'; }); })) dawn0();
  }
  function dawn0() {
    view('<div class="spacer"></div><div class="emoji" style="text-align:center">🌙</div><h2>' + t('sleepAgain') + '</h2><div class="spacer"></div>' + btn('dawn', t('next'), 'primary'));
  }
  function dawn() {
    var r = L.resolveNight(S.nm, S.nd), msg;
    if (r.killed != null) { L.kill(S.players, r.killed); msg = t('diedLast', { name: '<b>' + esc(S.players[r.killed].name) + '</b>' }); }
    else msg = r.saved ? t('savedLast') : t('quiet');
    var w = L.winner(S.players);
    view('<div class="spacer"></div><div class="emoji" style="text-align:center">☀️</div><h1>' + t('morning') + '</h1><div class="card"><p style="font-size:20px">' + msg + '</p></div><div class="spacer"></div>' +
      btn(w ? 'end' : 'discuss', w ? t('continue') : t('discuss'), 'primary'));
  }
  function discuss() {
    view('<h2>' + t('day', { n: S.night }) + '</h2><p class="sub">' + t('discuss') + '</p><div class="timer" id="timer"></div>' + status() + '<div class="spacer"></div>' + btn('vote', t('goVote'), 'primary'));
    runTimer(S.minutes * 60);
  }
  function status() {
    return '<div class="list">' + S.players.map(function (p) { return '<div><span>' + esc(p.name) + '</span><span>' + (p.alive ? '🟢 ' + t('alive') : '⚫ ' + t('dead')) + '</span></div>'; }).join('') + '</div>';
  }
  function vote() {
    view('<h2>' + t('whoOut') + '</h2>' + grid(alive(), btn('pick', t('noOne'), '" data-v="-1')) + pickable('voteDone', t('confirm')));
  }
  function voteDone() {
    var id = +S.pick, html;
    if (id < 0) html = '<div class="card"><p style="font-size:22px">' + t('nobodyOut') + '</p></div>';
    else { var p = S.players[id]; L.kill(S.players, id); html = '<div class="card"><p>' + t('outWas', { name: '<b>' + esc(p.name) + '</b>' }) + '</p><div class="role ' + p.role + '">' + t('role_' + p.role) + '</div></div>'; }
    view('<div class="spacer"></div>' + html + '<div class="spacer"></div>' + btn(L.winner(S.players) ? 'end' : 'night', t('continue'), 'primary'));
  }
  function end() {
    var w = L.winner(S.players);
    view('<div class="emoji" style="text-align:center">' + (w === 'mafia' ? '🎭' : '🏆') + '</div><h1>' + (w === 'mafia' ? t('mafiaWin') : t('citizensWin')) + '</h1><h2>' + t('roles') + '</h2>' +
      '<div class="list">' + S.players.map(function (p) { return '<div><span>' + esc(p.name) + (p.alive ? '' : ' ⚫') + '</span><b class="role ' + p.role + '" style="font-size:16px;margin:0">' + t('role_' + p.role) + '</b></div>'; }).join('') + '</div>' +
      '<div class="spacer"></div>' + btn('setup', t('playAgain'), 'primary" data-v="' + S.mode) + btn('home', t('home'), 'ghost'));
  }

  // ---------- imposter ----------
  function impReady() {
    var first = S.players[Math.floor(Math.random() * S.players.length)];
    view('<div class="spacer"></div><div class="emoji" style="text-align:center">🗣️</div><h1>' + t('allSet') + '</h1><div class="card"><p style="font-size:20px">' + t('startsFirst', { name: '<b>' + esc(first.name) + '</b>' }) + '</p><p class="sub">' + t('talkRule') + '</p></div>' +
      '<div class="timer" id="timer"></div><div class="spacer"></div>' + btn('impVote', t('reveal'), 'primary'));
    runTimer(S.minutes * 60);
  }
  function impVote() { view('<h2>' + t('whoImp') + '</h2><p class="sub">' + t('pickSuspect') + '</p>' + grid(S.players) + pickable('impResult', t('confirm'))); }
  function impResult() {
    var caught = S.imposters.indexOf(+S.pick) >= 0;
    view('<div class="emoji" style="text-align:center">' + (caught ? '🎉' : '😈') + '</div><h1>' + (caught ? t('foundIt') : t('imposterWon')) + '</h1><div class="card"><p class="sub">' + t('theImp') + '</p><div class="big" style="color:var(--red)">' +
      S.imposters.map(function (i) { return esc(S.players[i].name); }).join('، ') + '</div><p class="sub">' + t('theWord') + '</p><div class="big" style="color:var(--accent)">' + esc(S.word) + '</div></div><div class="spacer"></div>' +
      btn('setup', t('playAgain'), 'primary" data-v="imposter') + btn('home', t('home'), 'ghost'));
  }

  // ---------- events ----------
  var actions = {
    lang: function () { S.lang = S.lang === 'ar' ? 'en' : 'ar'; save('lang', S.lang); home(); },
    home: home,
    setup: function (m) { if (m) S.mode = m; S.error = ''; setup(); },
    add: function () { S.names.push(''); setup(); }, del: function (i) { S.names.splice(+i, 1); setup(); },
    begin: begin, dealShow: dealShow, dealNext: dealNext, night: night, stepMafia: stepMafia,
    mafiaDone: function () { S.nm = +S.pick; stepDoctor(); },
    doctorDone: function () { S.nd = +S.pick; stepDetective(); }, doctorSkip: stepDetective,
    detectiveDone: function () {
      var p = S.players[+S.pick], m = p.role === 'mafia';
      view('<div class="spacer"></div><div class="card"><div class="big">' + esc(p.name) + '</div><div class="role ' + (m ? 'mafia' : 'citizen') + '">' + (m ? t('isMafia') : t('notMafia')) + '</div></div><div class="spacer"></div>' + btn('dawn0', t('next'), 'primary'));
    },
    detectiveSkip: dawn0, dawn0: dawn0, dawn: dawn, discuss: discuss, vote: vote, voteDone: voteDone, end: end,
    impVote: impVote, impResult: impResult,
    pick: function (id, node) {
      S.pick = id; Array.prototype.forEach.call(app.querySelectorAll('.grid button'), function (b) { b.classList.toggle('sel', b === node); });
      var c = document.getElementById('confirm'); if (c) c.disabled = false;
    }
  };
  app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    var fn = actions[b.dataset.a]; if (fn) fn(b.dataset.v, b);
  });
  app.addEventListener('input', function (e) { if (e.target.dataset.i != null) S.names[+e.target.dataset.i] = e.target.value; });
  app.addEventListener('change', function (e) {
    if (e.target.id === 'cat') S.category = e.target.value;
    if (e.target.id === 'mins') S.minutes = +e.target.value;
  });
  home();
})();
