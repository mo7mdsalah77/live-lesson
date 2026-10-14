(function () {
  var app = document.getElementById('app'), sheet = document.getElementById('sheet'), toastEl = document.getElementById('toast'), STORIES = window.STORIES;
  var UI = {
    app: 'حواديت', tag: 'حكايات للأطفال من التراث ومن العالم', all: 'الكل', nights: 'ألف ليلة وليلة', folk: 'من التراث', wisdom: 'كليلة ودمنة', world: 'حكايات مشهورة',
    pages: 'صفحات', done: 'انتهت ✓', cont: 'أكمل', foot: 'اختر حكاية ودع التطبيق يحكيها، أو احكها أنت لأطفالك.',
    auto: 'احكِ لي الحكاية', autoSub: 'يحكي التطبيق بصوته ويقلّب الصفحات وحده', read: 'سأقرؤها بنفسي', readSub: 'النص مكتوب بخطّ كبير ليقرأه الأب أو الأم', resume: 'أكمل من صفحة', close: 'إغلاق',
    prev: 'السابقة', next: 'التالية', play: 'احكِ', pause: 'إيقاف مؤقت', listen: 'استمع للصفحة', stop: 'إيقاف', mode: 'طريقة الحكي', modeAuto: 'حكي', modeRead: 'قراءة', speed: 'السرعة',
    slow: 'بطيء', normal: 'عادي', fast: 'سريع', size: 'حجم الخط', voice: 'الصوت', theEnd: 'النهاية', moral: 'العبرة', again: 'اقرأ من البداية', home: 'حكايات أخرى', nextStory: 'الحكاية التالية', finished: 'انتهت الحكاية',
    noVoice: 'لا يوجد صوت عربي على هذا الجهاز. ثبّت الصوت العربي من إعدادات الجهاز (تحويل النص إلى كلام)، أو اقرأ الحكاية بنفسك.', autoVoice: 'الصوت التلقائي', tipRead: 'نصيحة: غيّر صوتك مع كل شخصية، فيحب الأطفال ذلك.',
    full: 'شاشة كاملة', fullSub: 'الصورة فقط، ويمكنك كتم الصوت لتحكي بنفسك', fsExit: 'خروج من الشاشة الكاملة', sound: 'الصوت', muteOn: 'كتم', muteLabel: 'كتم الصوت', unmuteLabel: 'تشغيل الصوت', mutedNote: 'الصوت مكتوم', voiceHelp: 'لنطق أفضل: ثبّت «خدمات الكلام من Google» من متجر Play ثم حمّل الصوت العربي، واختر الصوت من القائمة.', rotate: 'أدر الجوال أفقيًا لصورة أكبر',
  };
  function T(k) { return UI[k] || k; }
  function load(k, d) { try { var v = localStorage.getItem('hw.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem('hw.' + k, JSON.stringify(v)); } catch (e) {} }
  var S = { kind: 'all', mode: load('mode', 'auto'), rate: load('rate2', 0.8), muted: load('muted', false), fs: false, scale: load('scale', 1.05), voiceURI: load('voice', ''), progress: load('progress', {}), story: null, page: 0, playing: false, ended: false, finished: false };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m) { toastEl.textContent = m; toastEl.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.hidden = true; }, 3200); }
  document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl';

  // ---------- speech: native Android plugin inside the APK, speechSynthesis in a browser
  var cap = window.Capacitor, NT = cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.TextToSpeech ? cap.Plugins.TextToSpeech : null;
  var synth = window.speechSynthesis || null, voices = [], token = 0, speaking = false, hlTimer = null, pageTimer = null;
  function loadVoices() {
    if (NT) {
      NT.getSupportedVoices().then(function (r) { var all = (r && r.voices ? r.voices : []).map(function (v, i) { return { i: i, voiceURI: v.voiceURI || String(i), name: v.name || v.voiceURI || ('voice ' + i), lang: v.lang || '' }; }); voices = all.filter(function (v) { return /^ar/i.test(v.lang); }); if (S.story) renderReader(); }).catch(function () {});
      return;
    }
    if (!synth) return; voices = (synth.getVoices() || []).filter(function (v) { return /^ar/i.test(v.lang || ''); });
  }
  loadVoices(); if (!NT && synth && synth.addEventListener) synth.addEventListener('voiceschanged', function () { loadVoices(); if (S.story) renderReader(); });
  function pickVoice() {
    if (S.voiceURI) { var m = voices.filter(function (v) { return v.voiceURI === S.voiceURI; })[0]; if (m) return m; }
    var pref = [/ar[-_]SA/i, /ar[-_]XA/i, /ar[-_]EG/i, /saudi|السعود|arabic/i];
    for (var i = 0; i < pref.length; i++) { var f = voices.filter(function (v) { return pref[i].test(v.lang) || pref[i].test(v.name); })[0]; if (f) return f; }
    return voices[0] || null;
  }
  function ttsOK() { return !!NT || (!!synth && typeof window.SpeechSynthesisUtterance === 'function'); }
  function stopSpeech() { token++; speaking = false; clearInterval(hlTimer); clearTimeout(pageTimer); clearHl(); if (NT) { try { NT.stop(); } catch (e) {} } else if (synth) { try { synth.cancel(); } catch (e) {} } }
  function estimateHighlight(my, off) { var t0 = Date.now(), perChar = 78 / S.rate; clearInterval(hlTimer); hlTimer = setInterval(function () { if (my !== token) return clearInterval(hlTimer); highlight((off || 0) + Math.floor((Date.now() - t0) / perChar)); }, 90); }
  function speakParts(parts, onDone) {
    stopSpeech(); var my = token, v = pickVoice(), i = 0; speaking = true;
    function next() {
      if (my !== token) return; if (i >= parts.length) { speaking = false; if (onDone) onDone(); return; }
      var p = parts[i++];
      if (NT) {
        var opts = { text: p.text, lang: v && v.lang ? v.lang : 'ar-SA', rate: S.rate, pitch: 1.05, volume: 1, category: 'playback', queueStrategy: 0 };
        if (v && typeof v.i === 'number') opts.voice = v.i;
        if (p.hl) estimateHighlight(my, p.off);
        NT.speak(opts).then(function () { if (my === token) { clearInterval(hlTimer); clearHl(); next(); } }).catch(function () { if (my === token) { speaking = false; S.playing = false; clearInterval(hlTimer); updateControls(); toast(T('noVoice')); } });
        return;
      }
      var u = new window.SpeechSynthesisUtterance(p.text); u.lang = v ? v.lang : 'ar-SA'; if (v) u.voice = v; u.rate = S.rate; u.pitch = 1.05;
      u.onboundary = function (e) { if (my === token && p.hl) highlight((p.off || 0) + (e.charIndex || 0)); };
      u.onend = function () { if (my === token) { clearHl(); next(); } };
      u.onerror = function () { if (my === token) { speaking = false; S.playing = false; updateControls(); } };
      setTimeout(function () { if (my === token) { try { synth.speak(u); } catch (e) { speaking = false; } } }, 40);
    }
    next();
  }
  // The page is read sentence by sentence (shorter utterances sound more natural and never get cut off).
  // The spoken text is cleaned without changing its length, so highlight offsets still match the shown text.
  function spoken(t) { return t.replace(/[«»]/g, ' ').replace(/\.\.\.|…/g, '،  '); }
  function chunks(text) {
    var out = [], re = /[^.!؟?؛]+[.!؟?؛]*\s*/g, m;
    while ((m = re.exec(text))) { if (m[0].trim()) out.push({ text: spoken(m[0]).trim(), off: m.index, hl: true }); }
    return out.length ? out : [{ text: spoken(text), off: 0, hl: true }];
  }
  function pageParts() {
    var st = S.story, parts = chunks(st.pages[S.page].t);
    if (S.page === st.pages.length - 1) parts.push({ text: T('moral') + ': ' + spoken(st.moral), off: 0, hl: false });
    return parts;
  }
  function highlight(ci) { var ws = document.querySelectorAll('.page .w'), best = null, i; for (i = 0; i < ws.length; i++) { if (+ws[i].dataset.c <= ci) best = ws[i]; } clearHl(); if (best) best.classList.add('hl'); }
  function clearHl() { Array.prototype.forEach.call(document.querySelectorAll('.page .w.hl'), function (w) { w.classList.remove('hl'); }); }

  // ---------- navigation: the phone's back button walks back through full screen > story > library > exit.
  // Every history entry stores its depth, so one "back" or a jump home always lands on the right screen.
  var depth = 0;
  function navPush() { try { history.pushState({ hw: depth + 1 }, ''); depth++; } catch (e) {} }
  function navBack() { if (depth > 0) { try { history.back(); return; } catch (e) {} } depth = 0; reconcile(0); }
  function navHome() { if (depth > 0) { try { history.go(-depth); return; } catch (e) {} } depth = 0; reconcile(0); }
  function reconcile(d) {
    if (d < 2 && S.fs) exitFsUI();
    if (d < 1) { if (!sheet.hidden) closeSheet(); if (S.story) { stopSpeech(); S.playing = false; S.story = null; renderHome(); } }
  }
  window.addEventListener('popstate', function (e) { depth = (e.state && e.state.hw) || 0; reconcile(depth); });

  // Android back button / back gesture: step back inside the app, exit only from the library.
  var CApp = cap && cap.Plugins && cap.Plugins.App;
  if (NT && CApp && CApp.addListener) CApp.addListener('backButton', function () { if (depth > 0) navBack(); else if (CApp.exitApp) CApp.exitApp(); });

  // ---------- library
  function cover(st, uid) { var p = st.pages[0]; return window.Scenes.render(uid, p.s[0], p.s[1], { cover: true }); }
  function renderHome() {
    stopSpeech(); S.playing = false; S.story = null;
    var list = STORIES.filter(function (s) { return S.kind === 'all' || s.kind === S.kind; });
    app.innerHTML = '<div class="hero"><h1>' + T('app') + '</h1><p>' + T('tag') + '</p></div>' +
      '<div class="chips" role="group">' + ['all', 'nights', 'folk', 'wisdom', 'world'].map(function (k) { return '<button class="chip" data-a="kind" data-v="' + k + '" aria-pressed="' + (S.kind === k) + '">' + T(k) + '</button>'; }).join('') + '</div>' +
      '<div class="grid">' + list.map(function (st) {
        var pr = S.progress[st.id] || {}, badge = pr.done ? '<span class="badge">' + T('done') + '</span>' : (pr.page > 0 ? '<span class="badge progress">' + T('cont') + '</span>' : '');
        return '<button class="card" data-a="open" data-v="' + st.id + '">' + badge + '<div class="cover">' + cover(st, 'c' + st.id) + '</div><div class="meta"><h3>' + esc(st.title) + '</h3><small>' + st.pages.length + ' ' + T('pages') + '</small></div></button>';
      }).join('') + '</div><p class="foot">' + T('foot') + '</p>';
  }

  // ---------- start sheet
  function openSheet(id) {
    var st = byId(id), pr = S.progress[id] || {}, warn = (!ttsOK() || (!voices.length && !NT)) ? '<div class="warn">' + T('noVoice') + '</div>' : '';
    navPush(); sheet.hidden = false;
    sheet.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="cover">' + cover(st, 's' + st.id) + '</div><h2>' + esc(st.title) + '</h2>' + warn +
      '<button class="big auto" data-a="begin" data-v="auto:' + id + '"><span class="ic">🔊</span><span>' + T('auto') + '<small>' + T('autoSub') + '</small></span></button>' +
      '<button class="big full" data-a="begin" data-v="fs:' + id + '"><span class="ic">⛶</span><span>' + T('full') + '<small>' + T('fullSub') + '</small></span></button>' +
      '<button class="big read" data-a="begin" data-v="read:' + id + '"><span class="ic">📖</span><span>' + T('read') + '<small>' + T('readSub') + '</small></span></button>' +
      (pr.page > 0 && !pr.done ? '<p class="note">' + T('resume') + ' ' + (pr.page + 1) + '</p>' : '') +
      '<button class="big ghost" data-a="closeSheet">' + T('close') + '</button></div>';
  }
  function closeSheet() { sheet.hidden = true; sheet.innerHTML = ''; }
  function byId(id) { return STORIES.filter(function (s) { return s.id === id; })[0]; }

  // ---------- reader
  function openStory(id, mode, fromStart) {
    stopSpeech(); S.story = byId(id); var pr = S.progress[id] || {}; S.page = !fromStart && pr.page > 0 && !pr.done ? pr.page : 0; S.mode = mode; save('mode', mode); S.ended = false; S.finished = false; S.playing = false;
    if (!sheet.hidden) { closeSheet(); try { history.replaceState({ hw: 1 }, ''); depth = 1; } catch (e) { depth = 0; } } else if (depth === 0) navPush();
    renderReader(); if (mode === 'auto') play();
  }
  function wordsHtml(text) { var out = '', idx = 0; text.split(/(\s+)/).forEach(function (part) { if (!part) return; if (/^\s+$/.test(part)) { out += part; } else { out += '<span class="w" data-c="' + idx + '">' + esc(part) + '</span>'; } idx += part.length; }); return out; }
  function nextStoryOf(st) { var i = STORIES.indexOf(st); return STORIES[(i + 1) % STORIES.length]; }
  function renderReader() { renderReader0(); if (S.fs && S.story && !S.finished) renderFs(); }
  function renderReader0() {
    var st = S.story; if (!st) return; var pg = st.pages[S.page], last = S.page === st.pages.length - 1;
    document.documentElement.style.setProperty('--scale', S.scale);
    var voiceOpts = voices.length ? '<select id="voice" aria-label="' + T('voice') + '"><option value="">' + T('autoVoice') + '</option>' + voices.map(function (v) { return '<option value="' + esc(v.voiceURI) + '"' + (v.voiceURI === S.voiceURI ? ' selected' : '') + '>' + esc(v.name) + '</option>'; }).join('') + '</select>' : '';
    var head = '<div class="bar"><button class="round" data-a="home" aria-label="' + T('home') + '">🏠</button><div class="title">' + esc(st.title) + '</div>' + (S.mode === 'auto' ? muteBtn('round') : '') + '<button class="round" data-a="fs" aria-label="' + T('full') + '">⛶</button></div>' +
      '<div class="dots">' + st.pages.map(function (_, i) { return '<i class="' + (i <= S.page ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
      '<div class="stage flip" id="stage">' + window.Scenes.render('r' + S.page, pg.s[0], pg.s[1]) + '</div>';
    if (S.finished) {
      var nx = nextStoryOf(st);
      app.innerHTML = head + '<div class="page end" id="page"><p class="the-end">🌙 ' + T('theEnd') + '</p><div class="moral"><b>' + T('moral') + ':</b> ' + esc(st.moral) + '</div>' +
        '<button class="ctl main" data-a="again">🔁 ' + T('again') + '</button><button class="ctl" data-a="nextStory" data-v="' + nx.id + '">➡️ ' + T('nextStory') + ': ' + esc(nx.title) + '</button><button class="ctl" data-a="home">📚 ' + T('home') + '</button></div>';
      return;
    }
    var playLabel = S.mode === 'auto' ? (S.playing ? '⏸ ' + T('pause') : '▶ ' + T('play')) : (speaking ? '⏹ ' + T('stop') : '🔊 ' + T('listen'));
    app.innerHTML = head +
      '<div class="page" id="page"><p id="txt">' + wordsHtml(pg.t) + '</p>' + (last ? '<div class="moral"><b>' + T('moral') + ':</b> ' + esc(st.moral) + '</div>' : '') +
        (S.mode === 'read' && S.page === 0 ? '<p class="note" style="color:#8a6d3b">' + T('tipRead') + '</p>' : '') + '</div>' +
      '<div class="controls"><button class="ctl" id="prev" data-a="prev"' + (S.page === 0 ? ' disabled' : '') + '>▶ ' + T('prev') + '</button><button class="ctl main" id="play" data-a="play">' + playLabel + '</button><button class="ctl" id="next" data-a="next">' + (last ? '🌙 ' + T('theEnd') : T('next')) + ' ◀</button></div>' +
      '<div class="tools"><div class="seg" role="group" aria-label="' + T('mode') + '"><button data-a="mode" data-v="auto" aria-pressed="' + (S.mode === 'auto') + '">🔊 ' + T('modeAuto') + '</button><button data-a="mode" data-v="read" aria-pressed="' + (S.mode === 'read') + '">📖 ' + T('modeRead') + '</button></div>' +
        '<div class="seg" role="group" aria-label="' + T('speed') + '"><button data-a="rate" data-v="0.65" aria-pressed="' + (S.rate === 0.65) + '">' + T('slow') + '</button><button data-a="rate" data-v="0.8" aria-pressed="' + (S.rate === 0.8) + '">' + T('normal') + '</button><button data-a="rate" data-v="1.0" aria-pressed="' + (S.rate === 1) + '">' + T('fast') + '</button></div>' +
        '<div class="seg" role="group" aria-label="' + T('size') + '"><button data-a="size" data-v="-1" aria-label="-">أ−</button><button data-a="size" data-v="1" aria-label="+">أ+</button></div>' + voiceOpts + '</div><p class="note help">' + T('voiceHelp') + '</p>';
    var pr = S.progress[st.id] || {}; pr.page = S.page; S.progress[st.id] = pr; save('progress', S.progress);
  }
  function updateControls() { var b = document.getElementById('play'); if (b) b.innerHTML = S.mode === 'auto' ? (S.playing ? '⏸ ' + T('pause') : '▶ ' + T('play')) : (speaking ? '⏹ ' + T('stop') : '🔊 ' + T('listen')); }
  function muteBtn(cls) { return '<button class="' + cls + ' mute' + (S.muted ? ' on' : '') + '" data-a="mute" aria-pressed="' + S.muted + '" aria-label="' + (S.muted ? T('unmuteLabel') : T('muteLabel')) + '">' + (S.muted ? '🔇' : '🔊') + '</button>'; }
  var fsEl = document.getElementById('fs');
  function enterFs() { if (!S.story || S.fs) return; S.fs = true; navPush(); renderFs(); }
  function exitFsUI() { S.fs = false; fsEl.hidden = true; fsEl.innerHTML = ''; document.body.classList.remove('is-fs'); }
  function renderFs() {
    var st = S.story, pg = st.pages[S.page]; if (!st) return;
    document.body.classList.add('is-fs'); fsEl.hidden = false;
    fsEl.innerHTML = '<div class="fs-back">' + window.Scenes.render('fb' + S.page, pg.s[0], pg.s[1], { cover: true }) + '</div><div class="fs-main">' + window.Scenes.render('fm' + S.page, pg.s[0], pg.s[1], { fit: 'meet' }) + '</div>' +
      '<div class="fs-top">' + (S.mode === 'auto' ? muteBtn('fsbtn') : '') + '<button class="fsbtn" data-a="fsExit" aria-label="' + T('fsExit') + '">✕</button></div>' +
      (S.muted && S.mode === 'auto' ? '<div class="fs-note">' + T('mutedNote') + '</div>' : '') +
      '<div class="fs-dots">' + st.pages.map(function (_, i) { return '<i class="' + (i <= S.page ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
      '<button class="fs-nav fs-prev" data-a="prev" aria-label="' + T('prev') + '"' + (S.page === 0 ? ' disabled' : '') + '></button><button class="fs-nav fs-next" data-a="next" aria-label="' + T('next') + '"></button>';
  }
  function silentMs(text) { return Math.max(7000, Math.round(text.length * 130 / S.rate)); }
  function finishStory() {
    if (S.fs) { exitFsUI(); navBack(); }
    stopSpeech(); S.playing = false; S.ended = true; S.finished = true; var pr = S.progress[S.story.id] || {}; pr.done = true; pr.page = 0; S.progress[S.story.id] = pr; save('progress', S.progress); renderReader();
  }
  function go(delta) { var n = S.page + delta; if (n < 0 || n >= S.story.pages.length) return; S.page = n; renderReader(); }
  function play() {
    if (!S.story) return;
    var silent = S.muted && S.mode === 'auto';
    if (!silent && (!ttsOK() || (!voices.length && !NT))) { if (S.mode === 'auto') { toast(T('noVoice')); S.mode = 'read'; S.playing = false; if (S.fs) { exitFsUI(); navBack(); } renderReader(); } else toast(T('noVoice')); return; }
    if (S.mode === 'auto') {
      S.playing = true; S.ended = false; stopSpeech(); updateControls();
      (function readPage() {
        var mine = S.page, story = S.story;
        function done(gap) {
          if (!S.playing || S.story !== story || S.page !== mine) return;
          if (S.page >= story.pages.length - 1) { finishStory(); return; }
          pageTimer = setTimeout(function () { if (S.playing && S.story === story && S.page === mine) { S.page++; renderReader(); readPage(); } }, gap);
        }
        if (silent) { pageTimer = setTimeout(function () { done(0); }, silentMs(story.pages[mine].t)); }
        else speakParts(pageParts(), function () { done(900); });
      })();
    } else { speakParts(pageParts(), function () { updateControls(); }); updateControls(); }
  }
  function pause() { S.playing = false; stopSpeech(); updateControls(); }
  function sample() { if (S.playing || !ttsOK()) return; speakParts([{ text: 'مرحبًا يا صديقي، هيا نسمع حكاية جميلة.', off: 0, hl: false }], function () {}); }

  // ---------- events
  var actions = {
    kind: function (v) { S.kind = v; renderHome(); },
    open: openSheet, closeSheet: navBack,
    begin: function (v) { var p = v.split(':'); openStory(p[1], p[0] === 'fs' ? 'auto' : p[0]); if (p[0] === 'fs') enterFs(); },
    fs: enterFs, fsExit: navBack,
    mute: function () { S.muted = !S.muted; save('muted', S.muted); var was = S.playing; stopSpeech(); renderReader(); if (was) play(); },
    home: navBack,
    again: function () { openStory(S.story.id, S.mode, true); },
    nextStory: function (id) { openStory(id, S.mode, true); },
    prev: function () { var was = S.playing; go(-1); if (was) play(); else stopSpeech(); },
    next: function () { var last = S.page === S.story.pages.length - 1, was = S.playing; if (last) return finishStory(); go(1); if (was) play(); else stopSpeech(); },
    play: function () { if (S.mode === 'auto') { S.playing ? pause() : play(); } else { speaking ? (stopSpeech(), updateControls()) : play(); } },
    mode: function (v) { pause(); S.mode = v; save('mode', v); renderReader(); },
    rate: function (v) { S.rate = +v; save('rate2', S.rate); var was = S.playing; renderReader(); if (was) { stopSpeech(); play(); } },
    size: function (v) { S.scale = Math.max(0.85, Math.min(1.7, +(S.scale + 0.15 * +v).toFixed(2))); save('scale', S.scale); renderReader(); }
  };
  document.addEventListener('click', function (e) {
    if (e.target === sheet) return navBack();
    var b = e.target.closest('[data-a]'); if (!b || b.disabled) return; var fn = actions[b.dataset.a]; if (fn) fn(b.dataset.v);
  });
  document.addEventListener('change', function (e) { if (e.target.id === 'voice') { S.voiceURI = e.target.value; save('voice', S.voiceURI); if (S.playing) { stopSpeech(); play(); } else sample(); } });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (S.story || !sheet.hidden) navBack(); return; }
    if (!S.story || S.finished) return; var k = e.key;
    if (k === 'ArrowLeft') actions.next(); else if (k === 'ArrowRight') actions.prev(); else if (k === 'm') actions.mute(); else if (k === ' ') { e.preventDefault(); actions.play(); }
  });
  var sx = null; // swipe to turn pages (Arabic book direction: drag to the right for the next page)
  document.addEventListener('pointerdown', function (e) { if (S.story && !S.finished && e.target.closest('#stage, #page, #fs')) sx = { x: e.clientX, y: e.clientY }; });
  document.addEventListener('pointerup', function (e) { if (!sx) return; var dx = e.clientX - sx.x, dy = Math.abs(e.clientY - sx.y); sx = null; if (Math.abs(dx) > 60 && dy < 50) { if (dx > 0) actions.next(); else actions.prev(); } });
  document.addEventListener('visibilitychange', function () { if (document.hidden && S.playing) pause(); });
  window.__hw = { get page() { return S.page; }, get playing() { return S.playing; }, get ended() { return S.ended; }, get finished() { return S.finished; }, get story() { return S.story && S.story.id; }, get mode() { return S.mode; }, get fs() { return S.fs; }, get muted() { return S.muted; } };   // test hook
  renderHome();
})();
