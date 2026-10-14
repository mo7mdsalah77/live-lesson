(function () {
  var app = document.getElementById('app'), sheet = document.getElementById('sheet'), toastEl = document.getElementById('toast'), STORIES = window.STORIES;
  var UI = {
    eg: { app: 'حواديت', tag: 'حكايات من التراث ومن العالم كله', dialect: 'اللهجة', eg: 'مصري', ar: 'فصحى', all: 'الكل', nights: 'ألف ليلة وليلة', folk: 'تراث شعبي', wisdom: 'كليلة ودمنة', world: 'حكايات عالمية', pages: 'صفحات', done: 'خلصت ✓', cont: 'كمّل', foot: 'اختار حدوتة وخلّي الحكي عليّا، أو احكيها إنت لأولادك.',
      auto: 'احكيلي الحدوتة', autoSub: 'الجهاز يحكي بصوته وبيقلّب الصفحات لوحده', read: 'هحكيها أنا', readSub: 'النص مكتوب بخط كبير، والأب أو الأم يحكوا', resume: 'كمّل من صفحة', start: 'ابدأ من الأول', close: 'إغلاق',
      prev: 'السابقة', next: 'التالية', play: 'احكي', pause: 'استنى', listen: 'اسمع الصفحة', stop: 'وقّف', mode: 'طريقة الحكي', modeAuto: 'حكي', modeRead: 'قراءة', speed: 'السرعة', slow: 'بطيء', normal: 'عادي', fast: 'سريع', size: 'حجم الخط', voice: 'الصوت', theEnd: 'النهاية', moral: 'العبرة', finished: 'خلصت الحدوتة! 🌙', again: 'من الأول', home: 'كل الحواديت',
      noVoice: 'مفيش صوت عربي على الجهاز ده. نزّله من إعدادات الجهاز (تحويل النص إلى كلام)، أو اقرا الحدوتة بصوتك.', autoVoice: 'الصوت التلقائي', tipRead: 'نصيحة: غيّر صوتك مع كل شخصية، والأولاد هيحبوها أكتر!' },
    ar: { app: 'حواديت', tag: 'حكايات من التراث ومن العالم كله', dialect: 'اللهجة', eg: 'مصري', ar: 'فصحى', all: 'الكل', nights: 'ألف ليلة وليلة', folk: 'تراث شعبي', wisdom: 'كليلة ودمنة', world: 'حكايات عالمية', pages: 'صفحات', done: 'انتهت ✓', cont: 'تابع', foot: 'اختر حكاية ودع الجهاز يحكيها، أو احكِها أنتَ لأطفالك.',
      auto: 'احكِ لي الحكاية', autoSub: 'يحكي الجهاز بصوته ويقلّب الصفحات تلقائيًا', read: 'سأحكيها بنفسي', readSub: 'النص مكتوب بخطٍّ كبير ليقرأه الأب أو الأم', resume: 'تابع من صفحة', start: 'ابدأ من البداية', close: 'إغلاق',
      prev: 'السابقة', next: 'التالية', play: 'احكِ', pause: 'إيقاف مؤقت', listen: 'استمع للصفحة', stop: 'إيقاف', mode: 'طريقة الحكي', modeAuto: 'حكي', modeRead: 'قراءة', speed: 'السرعة', slow: 'بطيء', normal: 'عادي', fast: 'سريع', size: 'حجم الخط', voice: 'الصوت', theEnd: 'النهاية', moral: 'العبرة', finished: 'انتهت الحكاية! 🌙', again: 'من البداية', home: 'كل الحكايات',
      noVoice: 'لا يوجد صوت عربي على هذا الجهاز. ثبّته من إعدادات الجهاز (تحويل النص إلى كلام)، أو اقرأ الحكاية بنفسك.', autoVoice: 'الصوت التلقائي', tipRead: 'نصيحة: غيّر صوتك مع كل شخصية، فيحبها الأطفال أكثر!' }
  };
  function load(k, d) { try { var v = localStorage.getItem('hw.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem('hw.' + k, JSON.stringify(v)); } catch (e) {} }
  var S = { dialect: load('dialect', 'eg'), kind: 'all', mode: load('mode', 'auto'), rate: load('rate', 0.85), scale: load('scale', 1), voiceURI: load('voice', ''), progress: load('progress', {}), story: null, page: 0, playing: false, ended: false };
  function T(k) { return UI[S.dialect][k]; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m) { toastEl.textContent = m; toastEl.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.hidden = true; }, 2800); }

  // ---------- speech
  // Two engines: the native Android text-to-speech plugin (inside the APK) and the browser's speechSynthesis.
  var cap = window.Capacitor, NT = cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.TextToSpeech ? cap.Plugins.TextToSpeech : null;
  var synth = window.speechSynthesis || null, voices = [], nativeVoices = [], token = 0, speaking = false, hlTimer = null;
  function loadVoices() {
    if (NT) {
      NT.getSupportedVoices().then(function (r) { nativeVoices = (r && r.voices ? r.voices : []).map(function (v, i) { return { i: i, voiceURI: v.voiceURI || String(i), name: v.name || v.voiceURI || ('voice ' + i), lang: v.lang || '' }; }); voices = nativeVoices.filter(function (v) { return /^ar/i.test(v.lang); }); if (S.story) renderReader(true); }).catch(function () {});
      return;
    }
    if (!synth) return; voices = (synth.getVoices() || []).filter(function (v) { return /^ar/i.test(v.lang || ''); });
  }
  loadVoices(); if (!NT && synth && synth.addEventListener) synth.addEventListener('voiceschanged', function () { loadVoices(); if (S.story) renderReader(true); });
  function pickVoice() {
    if (S.voiceURI) { var m = voices.filter(function (v) { return v.voiceURI === S.voiceURI; })[0]; if (m) return m; }
    var pref = S.dialect === 'eg' ? [/ar[-_]EG/i, /egypt|مصر/i] : [/ar[-_]SA/i, /ar[-_]XA/i, /saudi|السعود/i];
    for (var i = 0; i < pref.length; i++) { var f = voices.filter(function (v) { return pref[i].test(v.lang) || pref[i].test(v.name); })[0]; if (f) return f; }
    return voices[0] || null;
  }
  function ttsOK() { return !!NT || (!!synth && typeof window.SpeechSynthesisUtterance === 'function'); }
  function stopSpeech() { token++; speaking = false; clearInterval(hlTimer); clearHl(); if (NT) { try { NT.stop(); } catch (e) {} } else if (synth) { try { synth.cancel(); } catch (e) {} } }
  // The native plugin has no word events, so the highlight follows an estimate of the reading speed.
  function estimateHighlight(text, my) {
    var t0 = Date.now(), perChar = 78 / S.rate; clearInterval(hlTimer);
    hlTimer = setInterval(function () { if (my !== token) return clearInterval(hlTimer); highlight(Math.floor((Date.now() - t0) / perChar)); }, 90);
  }
  function speakParts(parts, onDone) {
    stopSpeech(); var my = token, v = pickVoice(), i = 0; speaking = true;
    function next() {
      if (my !== token) return; if (i >= parts.length) { speaking = false; if (onDone) onDone(); return; }
      var p = parts[i++];
      if (NT) {
        var lang = v && v.lang ? v.lang : (S.dialect === 'eg' ? 'ar-EG' : 'ar-SA'), opts = { text: p.text, lang: lang, rate: S.rate, pitch: 1.05, volume: 1, category: 'playback', queueStrategy: 0 };
        if (v && typeof v.i === 'number') opts.voice = v.i;
        if (p.hl) estimateHighlight(p.text, my);
        NT.speak(opts).then(function () { if (my === token) { clearInterval(hlTimer); clearHl(); next(); } }).catch(function () { if (my === token) { speaking = false; S.playing = false; clearInterval(hlTimer); updateControls(); toast(T('noVoice')); } });
        return;
      }
      var u = new window.SpeechSynthesisUtterance(p.text); u.lang = v ? v.lang : (S.dialect === 'eg' ? 'ar-EG' : 'ar-SA'); if (v) u.voice = v; u.rate = S.rate; u.pitch = 1.05;
      u.onboundary = function (e) { if (my === token && p.hl) highlight(e.charIndex || 0); };
      u.onend = function () { if (my === token) { clearHl(); next(); } };
      u.onerror = function () { if (my === token) { speaking = false; S.playing = false; updateControls(); } };
      setTimeout(function () { if (my === token) { try { synth.speak(u); } catch (e) { speaking = false; } } }, 40);
    }
    next();
  }
  function pageParts() {
    var st = S.story, pg = st.pages[S.page][S.dialect], parts = [{ text: pg, hl: true }];
    if (S.page === st.pages.length - 1) parts.push({ text: T('moral') + ': ' + st.moral[S.dialect], hl: false });
    return parts;
  }
  function highlight(ci) { var ws = document.querySelectorAll('.page .w'), best = null; for (var i = 0; i < ws.length; i++) { if (+ws[i].dataset.c <= ci) best = ws[i]; } ws.forEach && Array.prototype.forEach.call(ws, function (w) { w.classList.remove('hl'); }); if (best) best.classList.add('hl'); }
  function clearHl() { Array.prototype.forEach.call(document.querySelectorAll('.page .w.hl'), function (w) { w.classList.remove('hl'); }); }

  // ---------- library
  function cover(st, uid) { var p = st.pages[0]; return window.Scenes.render(uid, p.s[0], p.s[1]); }
  function renderHome() {
    stopSpeech(); S.playing = false; S.story = null; document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl';
    var list = STORIES.filter(function (s) { return S.kind === 'all' || s.kind === S.kind; });
    app.innerHTML = '<div class="hero"><h1>' + T('app') + '</h1><p>' + T('tag') + '</p></div>' +
      '<div><div class="seg-label">' + T('dialect') + '</div><div class="seg" role="group" aria-label="' + T('dialect') + '"><button data-a="dialect" data-v="eg" aria-pressed="' + (S.dialect === 'eg') + '">' + UI.eg.eg + '</button><button data-a="dialect" data-v="ar" aria-pressed="' + (S.dialect === 'ar') + '">' + UI.ar.ar + '</button></div></div>' +
      '<div class="chips" role="group">' + ['all', 'nights', 'folk', 'wisdom', 'world'].map(function (k) { return '<button class="chip" data-a="kind" data-v="' + k + '" aria-pressed="' + (S.kind === k) + '">' + T(k) + '</button>'; }).join('') + '</div>' +
      '<div class="grid">' + list.map(function (st) {
        var pr = S.progress[st.id] || {}, badge = pr.done ? '<span class="badge">' + T('done') + '</span>' : (pr.page > 0 ? '<span class="badge progress">' + T('cont') + '</span>' : '');
        return '<button class="card" data-a="open" data-v="' + st.id + '">' + badge + '<div class="cover">' + cover(st, 'c' + st.id) + '</div><div class="meta"><h3>' + esc(st.title[S.dialect]) + '</h3><small>' + st.pages.length + ' ' + T('pages') + '</small></div></button>';
      }).join('') + '</div><p class="foot">' + T('foot') + '</p>';
  }

  // ---------- start sheet
  function openSheet(id) {
    var st = STORIES.filter(function (s) { return s.id === id; })[0], pr = S.progress[id] || {}, warn = (!ttsOK() || (!voices.length && !NT)) ? '<div class="warn">' + T('noVoice') + '</div>' : '';
    sheet.hidden = false;
    sheet.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="cover">' + cover(st, 's' + st.id) + '</div><h2>' + esc(st.title[S.dialect]) + '</h2>' + warn +
      '<button class="big auto" data-a="begin" data-v="auto:' + id + '"><span class="ic">🔊</span><span>' + T('auto') + '<small>' + T('autoSub') + '</small></span></button>' +
      '<button class="big read" data-a="begin" data-v="read:' + id + '"><span class="ic">📖</span><span>' + T('read') + '<small>' + T('readSub') + '</small></span></button>' +
      (pr.page > 0 && !pr.done ? '<p class="note">' + T('resume') + ' ' + (pr.page + 1) + '</p>' : '') +
      '<button class="big ghost" data-a="closeSheet">' + T('close') + '</button></div>';
  }
  function closeSheet() { sheet.hidden = true; sheet.innerHTML = ''; }

  // ---------- reader
  function openStory(id, mode) {
    S.story = STORIES.filter(function (s) { return s.id === id; })[0]; var pr = S.progress[id] || {}; S.page = pr.page > 0 && !pr.done ? pr.page : 0; S.mode = mode; save('mode', mode); S.ended = false; S.playing = false;
    closeSheet(); renderReader(false); if (mode === 'auto') play();
  }
  function wordsHtml(text) { var out = '', idx = 0; text.split(/(\s+)/).forEach(function (part) { if (/^\s+$/.test(part) || !part) { out += part; idx += part.length; } else { out += '<span class="w" data-c="' + idx + '">' + esc(part) + '</span>'; idx += part.length; } }); return out; }
  function renderReader(keepPlaying) {
    var st = S.story; if (!st) return; var pg = st.pages[S.page], last = S.page === st.pages.length - 1, d = S.dialect;
    document.documentElement.style.setProperty('--scale', S.scale);
    var voiceOpts = voices.length ? '<select id="voice" aria-label="' + T('voice') + '"><option value="">' + T('autoVoice') + '</option>' + voices.map(function (v) { return '<option value="' + esc(v.voiceURI) + '"' + (v.voiceURI === S.voiceURI ? ' selected' : '') + '>' + esc(v.name) + '</option>'; }).join('') + '</select>' : '';
    var playLabel = S.mode === 'auto' ? (S.playing ? '⏸ ' + T('pause') : '▶ ' + T('play')) : (speaking ? '⏹ ' + T('stop') : '🔊 ' + T('listen'));
    app.innerHTML = '<div class="bar"><button class="round" data-a="home" aria-label="' + T('home') + '">🏠</button><div class="title">' + esc(st.title[d]) + '</div><button class="round" data-a="dialectToggle" aria-label="' + T('dialect') + '" title="' + T('dialect') + '" style="font-size:14px;font-weight:900">' + (d === 'eg' ? UI.eg.eg : UI.ar.ar) + '</button></div>' +
      '<div class="dots">' + st.pages.map(function (_, i) { return '<i class="' + (i <= S.page ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
      '<div class="stage flip" id="stage">' + window.Scenes.render('r' + S.page, pg.s[0], pg.s[1]) + '</div>' +
      '<div class="page" id="page"><p id="txt">' + wordsHtml(pg[d]) + '</p>' + (last ? '<div class="moral"><b>' + T('moral') + ':</b> ' + esc(st.moral[d]) + '</div><p class="the-end">' + T('theEnd') + '</p>' : '') +
        (S.mode === 'read' && S.page === 0 ? '<p class="note" style="color:#8a6d3b">' + T('tipRead') + '</p>' : '') + '</div>' +
      '<div class="controls"><button class="ctl" id="prev" data-a="prev"' + (S.page === 0 ? ' disabled' : '') + '>▶ ' + T('prev') + '</button><button class="ctl main" id="play" data-a="play">' + playLabel + '</button><button class="ctl" id="next" data-a="next">' + (last ? '🌙' : '') + ' ' + T('next') + ' ◀</button></div>' +
      '<div class="tools"><div class="seg" role="group" aria-label="' + T('mode') + '"><button data-a="mode" data-v="auto" aria-pressed="' + (S.mode === 'auto') + '">🔊 ' + T('modeAuto') + '</button><button data-a="mode" data-v="read" aria-pressed="' + (S.mode === 'read') + '">📖 ' + T('modeRead') + '</button></div>' +
        '<div class="seg" role="group" aria-label="' + T('speed') + '"><button data-a="rate" data-v="0.7" aria-pressed="' + (S.rate === 0.7) + '">' + T('slow') + '</button><button data-a="rate" data-v="0.85" aria-pressed="' + (S.rate === 0.85) + '">' + T('normal') + '</button><button data-a="rate" data-v="1.0" aria-pressed="' + (S.rate === 1) + '">' + T('fast') + '</button></div>' +
        '<div class="seg" role="group" aria-label="' + T('size') + '"><button data-a="size" data-v="-1" aria-label="-">أ−</button><button data-a="size" data-v="1" aria-label="+">أ+</button></div>' + voiceOpts + '</div>';
    var pr = S.progress[st.id] || {}; pr.page = S.page; if (last) pr.done = true; S.progress[st.id] = pr; save('progress', S.progress);
  }
  function updateControls() { var b = document.getElementById('play'); if (b) b.innerHTML = S.mode === 'auto' ? (S.playing ? '⏸ ' + T('pause') : '▶ ' + T('play')) : (speaking ? '⏹ ' + T('stop') : '🔊 ' + T('listen')); }
  function go(delta, keep) {
    var n = S.page + delta; if (n < 0 || n >= S.story.pages.length) return; S.page = n; if (!keep) { stopSpeech(); } renderReader(true);
  }
  function play() {
    if (!S.story) return;
    if (!ttsOK() || (!voices.length && !NT)) { if (S.mode === 'auto') { toast(T('noVoice')); S.mode = 'read'; S.playing = false; renderReader(false); } else toast(T('noVoice')); return; }
    if (S.mode === 'auto') {
      S.playing = true; S.ended = false; updateControls();
      (function readPage() {
        var mine = S.page, story = S.story;
        speakParts(pageParts(), function () {
          if (!S.playing || S.story !== story || S.page !== mine) return;
          if (S.page >= story.pages.length - 1) { S.playing = false; S.ended = true; var pr = S.progress[story.id] || {}; pr.done = true; pr.page = 0; S.progress[story.id] = pr; save('progress', S.progress); renderReader(false); toast(T('finished')); return; }
          setTimeout(function () { if (S.playing && S.story === story && S.page === mine) { S.page++; renderReader(true); readPage(); } }, 900);
        });
      })();
    } else { speakParts(pageParts(), function () { updateControls(); }); updateControls(); }
  }
  function pause() { S.playing = false; stopSpeech(); updateControls(); }

  // ---------- events
  var actions = {
    dialect: function (v) { S.dialect = v; save('dialect', v); renderHome(); },
    dialectToggle: function () { var was = S.playing; stopSpeech(); S.dialect = S.dialect === 'eg' ? 'ar' : 'eg'; save('dialect', S.dialect); renderReader(false); if (was) play(); },
    kind: function (v) { S.kind = v; renderHome(); },
    open: openSheet, closeSheet: closeSheet,
    begin: function (v) { var p = v.split(':'); openStory(p[1], p[0]); },
    home: function () { pause(); S.story = null; renderHome(); },
    prev: function () { var was = S.playing; go(-1); if (was) play(); },
    next: function () {
      var last = S.page === S.story.pages.length - 1, was = S.playing;
      if (last) { pause(); S.page = 0; renderReader(false); return; } go(1); if (was) play();
    },
    play: function () { if (S.mode === 'auto') { S.playing ? pause() : play(); } else { speaking ? (stopSpeech(), updateControls()) : play(); } },
    mode: function (v) { pause(); S.mode = v; save('mode', v); renderReader(false); },
    rate: function (v) { S.rate = +v; save('rate', S.rate); var was = S.playing; renderReader(true); if (was) { stopSpeech(); play(); } },
    size: function (v) { S.scale = Math.max(0.8, Math.min(1.6, +(S.scale + 0.15 * +v).toFixed(2))); save('scale', S.scale); renderReader(true); }
  };
  document.addEventListener('click', function (e) {
    if (e.target === sheet) return closeSheet();
    var b = e.target.closest('[data-a]'); if (!b || b.disabled) return; var fn = actions[b.dataset.a]; if (fn) fn(b.dataset.v);
  });
  document.addEventListener('change', function (e) { if (e.target.id === 'voice') { S.voiceURI = e.target.value; save('voice', S.voiceURI); if (S.playing) { stopSpeech(); play(); } } });
  document.addEventListener('keydown', function (e) {
    if (!S.story) return; var k = e.key;
    if (k === 'ArrowLeft') actions.next(); else if (k === 'ArrowRight') actions.prev(); else if (k === ' ') { e.preventDefault(); actions.play(); } else if (k === 'Escape') actions.home();
  });
  var sx = null; // swipe to turn pages (Arabic book direction: drag to the right for the next page)
  document.addEventListener('pointerdown', function (e) { if (S.story && e.target.closest('#stage, #page')) sx = { x: e.clientX, y: e.clientY }; });
  document.addEventListener('pointerup', function (e) { if (!sx) return; var dx = e.clientX - sx.x, dy = Math.abs(e.clientY - sx.y); sx = null; if (Math.abs(dx) > 60 && dy < 50) { if (dx > 0) actions.next(); else actions.prev(); } });
  document.addEventListener('visibilitychange', function () { if (document.hidden && S.playing) pause(); });
  window.__hw = { get page() { return S.page; }, get playing() { return S.playing; }, get ended() { return S.ended; }, get story() { return S.story && S.story.id; }, get mode() { return S.mode; } };   // test hook
  renderHome();
})();
