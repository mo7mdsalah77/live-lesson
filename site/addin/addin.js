// PowerPoint add-in: puts a live lesson slide on a PowerPoint slide.
// Loaded by host.js when the page is opened as ?addin. The lesson page (index.html) does the data work;
// this file adds Office sign-in, the per-slide setting, and the slide view drawn on the PowerPoint slide.
import { signInWithCredential, OAuthProvider, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const OFFICE_JS = "https://appsforoffice.microsoft.com/lib/1/hosted/office.js";
const KEY = "liveLesson"; // document setting: { mode: "follow" } or { mode: "slide", id: <lesson slide id> }

let managed = false;
let inOffice = false;
let view = "edit"; // "edit" while building the deck, "read" while presenting
let cfg = null;
let picking = false;
let workspace = "present";
let refreshing = false;
let synced = false, syncT = 0;
let madeCode = false;

const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.append(s); });
}

export async function init() {
  document.documentElement.dataset.theme = "light"; // slides are usually light; don't follow the computer's dark mode
  document.head.append(Object.assign(document.createElement("style"), { textContent: CSS }));
  try {
    await loadScript(OFFICE_JS);
    const info = await Office.onReady();
    inOffice = !!(info && info.host);
  } catch (e) { console.warn("Office.js didn't load", e); }
  if (inOffice) {
    cfg = Office.context.document.settings.get(KEY) || null;
    if (typeof cfg === "string") { try { cfg = JSON.parse(cfg); } catch { cfg = null; } }
    const managedSetting = Office.context.document.settings.get("liveLessonManaged");
    managed = managedSetting === true || managedSetting === "true";
    Office.context.document.getActiveViewAsync(r => { if (r.status === "succeeded") { changeView(r.value); } });
    Office.context.document.addHandlerAsync(Office.EventType.ActiveViewChanged, e => { changeView(e.activeView); });
  } else {
    cfg = lsGet("tll-addin-cfg");
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { synced = false; stopOwnInteraction(); } else rerender(); });
}

function stopOwnInteraction() {
  const L = window.__lesson;
  const active = L?.slides()[L.S.live.slide || 0];
  if (L?.S.role === "teacher" && L.S.live.presenting && cfg?.mode === "slide" && active?.id === cfg.id) L.stopInteraction();
}
function changeView(next) {
  view = next; synced = false;
  if (view !== "read") stopOwnInteraction();
  rerender();
}
function saveCfg(next) {
  cfg = next;
  if (!inOffice) return lsSet("tll-addin-cfg", next);
  Office.context.document.settings.set(KEY, next);
  Office.context.document.settings.saveAsync(r => { if (r.status !== "succeeded") { console.warn("setting not saved", r.error); window.__lesson?.toast("PowerPoint could not save the slide link. Save the presentation and try again."); } });
}

// Google sign-in through an Office dialog (pop-ups don't work inside PowerPoint). The dialog page (auth.html)
// signs in with Google and hands back the Google ID token, which signs this add-in in to Firebase.
export function signIn(auth) {
  return new Promise((resolve, reject) => {
    if (!inOffice) return reject(new Error("Open this inside PowerPoint to sign in."));
    const url = new URL("addin/auth.html", location.origin + location.pathname).href;
    Office.context.ui.displayDialogAsync(url, { height: 70, width: 35, promptBeforeOpen: false }, r => {
      if (r.status !== "succeeded") return reject(new Error(r.error.message));
      const dlg = r.value;
      dlg.addEventHandler(Office.EventType.DialogMessageReceived, async a => {
        dlg.close();
        let m; try { m = JSON.parse(a.message); } catch { return reject(new Error("Unexpected sign-in reply")); }
        if (m.error) return reject(new Error(m.error));
        try {
          try { await signInWithCredential(auth, new OAuthProvider("google.com").credential({ idToken: m.idToken, rawNonce: m.rawNonce })); }
          catch (e) { if (!/nonce/i.test(String(e.code) + e.message)) throw e; await signInWithCredential(auth, GoogleAuthProvider.credential(m.idToken)); }
          resolve();
        } catch (e) { reject(e); }
      });
      dlg.addEventHandler(Office.EventType.DialogEventReceived, a => reject(new Error(a.error === 12006 ? "The sign-in window was closed." : "Sign-in window error " + a.error)));
    });
  });
}

export function isSlideShow() { return view === "read"; }

export function keepEditor() {
  return !refreshing && view !== "read" && workspace === "edit" && !!document.querySelector(".emb #pbody");
}
function rerender() {
  refreshing = true;
  try { if (window.__lesson && window.__lesson.S.role === "teacher") window.__lesson.render(true); }
  finally { refreshing = false; }
}
function openWorkspace(name) {
  workspace = name;
  window.__lesson.S.tab = name === "present" || name === "join" ? "live" : name;
  if (name === "edit" && !window.__lesson.S.edit) window.__lesson.startEdit();
  rerender();
}

// While presenting, showing this PowerPoint slide moves students' devices to the lesson slide it holds.
function maybeSync(L, idx) {
  if (synced || view !== "read" || document.visibilityState !== "visible" || !cfg || cfg.mode !== "slide" || idx < 0) return;
  if (!L.S.liveLoaded || !L.S.deckLoaded) return;
  clearTimeout(syncT);
  syncT = setTimeout(() => {
    if (synced || view !== "read" || document.visibilityState !== "visible") return;
    synced = true;
    L.goTo(idx);
  }, 700);
}

const label = (L, s, i) => (i + 1) + " · " + L.TYPES[s.type].label + (s.title ? " · " + s.title : "");

export function render(app) {
  const L = window.__lesson, S = L.S, h = L.h;
  const list = L.slides();
  const live = Math.min(S.live.slide || 0, Math.max(0, list.length - 1));
  const fixed = cfg && cfg.mode === "slide";
  const idx = fixed ? list.findIndex(s => s.id === cfg.id) : live;
  maybeSync(L, idx);

  const isLive = idx === live;
  const sl = idx >= 0 ? list[idx] : null;
  const editing = view !== "read" && !managed;
  // Every live slide needs a join code for its QR, so make one the first time a lesson has none.
  if (S.liveLoaded && !S.live.code && !madeCode) { madeCode = true; queueMicrotask(() => L.setLive({ code: L.newCode() })); }
  const n = S.peers.filter(p => !p.isMe && (p.presence || {}).role === "student" && p.presence.sid === S.live.sessionId).length;

  const bar = h("div", { class: "ebar" },
    h("img",{src:"./assets/nour-icon-32.png",alt:"",width:24,height:24}), h("b", { class: "ebrand", text: "Nour" }),
    S.live.code ? h("span", { class: "pill", title: "Students type this code to join" }, h("b", { class: "mono", text: "#" + S.live.code }))
      : h("button", { class: "btn sm", onclick: () => L.setLive({ code: L.newCode() }) }, "Create join code"),
    h("span", { class: "pill" }, h("span", { class: "dot" + (S.connected ? " live" : "") }), n + " online"),
    h("span", { class: "grow" }),
    editing ? h("button", { class: "btn sm" + (picking ? " on" : ""), onclick: () => { workspace = "present"; picking = !picking; rerender(); } }, picking ? "Done" : "Link this slide") : null,
    editing && window.__signOut ? h("button", { class: "btn sm", onclick: () => window.__signOut() }, "Sign out") : null);

  const tabs = editing ? h("nav", { class: "enav", "aria-label": "Lesson workspace" },
    [["present", "Present"], ["edit", "Questions"], ["class", "Results"], ["groups", "Groups"], ["join", "Invite students"]].map(([key, title]) =>
      h("button", { class: "btn sm" + (workspace === key ? " on" : ""), "aria-pressed": workspace === key, onclick: () => openWorkspace(key) }, title))) : null;
  const shell = body => app.append(h("div", { class: "emb" + (editing ? " eediting" : "") }, bar, tabs, body));
  if (editing && workspace !== "present") {
    const content = workspace === "join" ? [h("h2", { text: "Invite your class" }), L.joinHelp(),
      h("p", { class: "muted", text: "Students use their phones. Keep this PowerPoint add-in open to run the lesson." })]
      : ({ edit: L.editTab, class: L.classTab, groups: L.groupsTab }[workspace])();
    shell(h("section", { class: "ework", id: "pbody" }, content));
    return;
  }
  if (!list.length) {
    shell(h("div", { class: "stage" }, h("h2", { text: "Build your interactive lesson" }),
      h("p", { class: "muted", text: "Create polls, quizzes and group tasks here in PowerPoint, then link a question to this slide." }),
      h("button", { class: "btn primary", onclick: () => openWorkspace("edit") }, "Create a question")));
    return;
  }

  if (picking || !cfg || (fixed && idx < 0)) {
    const pick = c => { saveCfg(c); picking = false; synced = false; rerender(); };
    shell(h("div", { class: "stage pick" },
      h("h2", { text: "What should this PowerPoint slide show?" }),
      fixed && idx < 0 ? h("p", { class: "fb no", text: "The lesson slide this was set to has been deleted. Pick another." }) : null,
      h("p", { class: "muted", text: "Pick one lesson slide: when you reach this PowerPoint slide in your slideshow, students' devices move to it. Or let this slide follow the live lesson and step through it with Back and Next." }),
      h("div", { class: "plist" },
        h("button", { class: "btn" + (cfg && cfg.mode === "follow" ? " on" : ""), onclick: () => pick({ mode: "follow" }) }, "Follow the live lesson (Back and Next on this slide)"),
        list.map((s, i) => h("button", { class: "btn" + (fixed && cfg.id === s.id ? " on" : ""), onclick: () => pick({ mode: "slide", id: s.id }) }, label(L, s, i))))));
    return;
  }

  if (managed && view !== "read") {
    if (isLive && S.live.presenting) queueMicrotask(stopOwnInteraction);
    shell(h("div", {class:"emain"}, L.stageEl(sl, {showKey:false,preview:true}), h("div",{class:"eside"}, L.joinCard(), h("h2",{text:"Slide preview"}), h("p",{class:"muted",text:"Start the slideshow to open this question for student answers."}), h("p",{text:"Results: " + (sl.resultsMode === "immediate" ? "Immediately" : sl.resultsMode === "hidden" ? "Hidden" : "On click")}), sl.timerSeconds ? h("p",{text:"Timer: " + sl.timerSeconds + " seconds"}) : null)));
    return;
  }
  const q = sl && L.TYPES[sl.type].q;
  const students = L.studentList();
  const side = h("div", { class: "eside" });
  if (!isLive) {
    side.append(h("p", { class: "muted", style: "margin:0", text: "Students are on slide " + (live + 1) + " right now." }),
      h("button", { class: "btn primary", onclick: () => L.goTo(idx) }, "Show this on students' devices"));
  } else {
    if (q) {
      const answered = students.filter(s => s.ans[sl.id] != null && s.ans[sl.id] !== "").length;
      side.append(h("div", { class: "stat" }, h("div", null, h("b", { text: answered + "/" + students.length }), h("span", { text: "Answered" }))));
      if (!L.leaderboardShowing(sl) && !["open", "short"].includes(sl.type) && L.showsResults(sl,S.live)) side.append(L.barsEl(sl, L.summaryFor(sl, students)));
    }
    side.append(h("div", { class: "row" },
      !fixed ? h("button", { class: "btn", disabled: live <= 0, onclick: () => L.goTo(live - 1), "aria-label": "Back" }, "←") : null,
      !fixed ? h("button", { class: "btn primary", disabled: live >= list.length - 1, onclick: () => L.goTo(live + 1), "aria-label": "Next" }, "→") : null,
      q ? h("button", { class: "btn" + (S.live.open ? "" : " on"), onclick: () => L.setLive({ open: !S.live.open }) }, S.live.open ? "Close answers" : "Reopen answers") : null,
      q && sl.resultsMode !== "hidden" ? h("button", {class:"btn",onclick:L.toggleResults}, S.live.resultsVisible ? "Hide results" : "Show results") : null,
      sl && L.hasAnswerKey(sl,S.keys[sl.id]) ? h("button",{class:"btn",onclick:L.toggleLeaderboard},L.leaderboardShowing(sl) ? "Hide leaderboard" : "Show leaderboard") : null,
      sl && L.hasAnswerKey(sl, S.keys[sl.id]) ? h("button", { class: "btn" + (S.live.reveal ? " on" : ""), onclick: L.toggleReveal }, S.live.reveal ? "Hide answer" : "Show answer") : null));
  }
  if (editing) side.append(h("p", { class: "muted small", text: fixed ? "This slide holds lesson slide " + (idx + 1) + ". In the slideshow, reaching it moves students there." : "This slide follows the live lesson." }));
  if (isLive && L.leaderboardShowing(sl)) side.append(L.leaderboardEl());
  // Join QR: large in the side column until results or the leaderboard need the room, then a compact bar on the slide.
  const busySide = isLive && sl && (L.leaderboardShowing(sl) || (L.TYPES[sl.type].q && L.showsResults(sl, S.live)));
  if (!busySide) side.prepend(L.joinCard() || h("span", { hidden: true }));
  if (isLive) side.prepend(L.timerEl() || h("span",{hidden:true}));
  if (isLive && ["open", "short"].includes(sl?.type) && L.showsResults(sl,S.live)) {
    const replies = students.filter(s => s.ans[sl.id] != null && s.ans[sl.id] !== "");
    side.append(h("div", { class: "resp" }, replies.map(s => h("div", null, String(s.ans[sl.id])))));
  }
  const stage = L.stageEl(sl, { showKey: isLive && S.live.reveal, joinBar: busySide });
  if (view === "read" && isLive && sl.resultsMode !== "immediate" && sl.resultsMode !== "hidden" && !S.live.resultsVisible) {
    stage.title = "Click to show class results";
    stage.addEventListener("click", L.toggleResults, {once:true});
  }
  shell(h("div", { class: "emain" }, stage, side));
}

const CSS = `
.wrap{max-width:none;padding:0}
body{background:var(--paper)}
.emb{position:fixed;inset:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:8px;padding:8px;box-sizing:border-box}
.eediting{grid-template-rows:auto auto minmax(0,1fr)}
.enav{display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:8px}
.ework{overflow:auto;min-height:0;padding:16px;display:flex;flex-direction:column;gap:14px;background:var(--paper);border-radius:12px}
.ework .ed{grid-template-columns:minmax(130px,1fr) minmax(0,3fr)}
.ework .import{font-size:13px}
.ebar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.ebrand{font:800 15px var(--f-display)}
.grow{flex:1}
.emain{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:10px;min-height:0}
.emain .stage,.emb>.stage{min-height:0;height:100%;overflow:auto;box-sizing:border-box}
.eside{display:flex;flex-direction:column;gap:10px;overflow:auto;min-height:0}
.eside .joincard .qr{max-width:min(100%,46vh)}
.eside .row .btn{flex:1 1 auto}
.small{font-size:13px;margin:0}
.pick .plist{display:grid;gap:6px}
.pick .plist .btn{justify-content:flex-start;text-align:left}
@media (max-width:560px){.emain{grid-template-columns:1fr}.ework{padding:10px}.ework .ed,.ework .gcols{grid-template-columns:1fr}}
`;
