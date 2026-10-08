// PowerPoint add-in: puts a live lesson slide on a PowerPoint slide.
// Loaded by host.js when the page is opened as ?addin. The lesson page (index.html) does the data work;
// this file adds Office sign-in, the per-slide setting, and the slide view drawn on the PowerPoint slide.
import { signInWithCredential, OAuthProvider, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const OFFICE_JS = "https://appsforoffice.microsoft.com/lib/1/hosted/office.js";
const KEY = "liveLesson"; // document setting: { mode: "follow" } or { mode: "slide", id: <lesson slide id> }

let inOffice = false;
let view = "edit"; // "edit" while building the deck, "read" while presenting
let cfg = null;
let picking = false;
let synced = false, syncT = 0;

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
    Office.context.document.getActiveViewAsync(r => { if (r.status === "succeeded") { view = r.value; rerender(); } });
    Office.context.document.addHandlerAsync(Office.EventType.ActiveViewChanged, e => { view = e.activeView; synced = false; rerender(); });
  } else {
    cfg = lsGet("tll-addin-cfg");
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") synced = false; else rerender(); });
}

function saveCfg(next) {
  cfg = next;
  if (!inOffice) return lsSet("tll-addin-cfg", next);
  Office.context.document.settings.set(KEY, next);
  Office.context.document.settings.saveAsync(r => { if (r.status !== "succeeded") console.warn("setting not saved", r.error); });
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

function rerender() { if (window.__lesson && window.__lesson.S.role === "teacher") window.__lesson.render(true); }

// While presenting, showing this PowerPoint slide moves students' devices to the lesson slide it holds.
function maybeSync(L, idx) {
  if (synced || view !== "read" || document.visibilityState !== "visible" || !cfg || cfg.mode !== "slide" || idx < 0) return;
  if (!L.S.liveLoaded || !L.S.deckLoaded) return;
  clearTimeout(syncT);
  syncT = setTimeout(() => {
    if (synced || view !== "read" || document.visibilityState !== "visible") return;
    synced = true;
    if ((L.S.live.slide || 0) !== idx) L.goTo(idx);
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
  const editing = view !== "read";
  const n = S.peers.filter(p => !p.isMe && (p.presence || {}).role === "student" && p.presence.sid === S.live.sessionId).length;

  const bar = h("div", { class: "ebar" },
    h("b", { class: "ebrand", text: "Live Lesson" }),
    S.live.code ? h("span", { class: "pill", title: "Students type this code to join" }, "Code ", h("b", { class: "mono", text: S.live.code }))
      : h("button", { class: "btn sm", onclick: () => L.setLive({ code: L.newCode() }) }, "Create join code"),
    h("span", { class: "pill" }, h("span", { class: "dot" + (S.connected ? " live" : "") }), n + " online"),
    h("span", { class: "grow" }),
    editing ? h("button", { class: "btn sm" + (picking ? " on" : ""), onclick: () => { picking = !picking; rerender(); } }, picking ? "Done" : "Choose slide") : null,
    editing && window.__signOut ? h("button", { class: "btn sm", onclick: () => window.__signOut() }, "Sign out") : null);

  if (!list.length) {
    app.append(h("div", { class: "emb" }, bar, h("div", { class: "stage" }, h("h2", { text: "No lesson yet" }),
      h("p", { class: "muted", text: "Write your lesson on the website first (Teacher view › Edit lesson), then come back to this slide." }),
      h("a", { href: location.origin + location.pathname + "#teacher", target: "_blank", rel: "noopener", text: "Open the teacher page" }))));
    return;
  }

  if (picking || !cfg || (fixed && idx < 0)) {
    const pick = c => { saveCfg(c); picking = false; synced = false; rerender(); };
    app.append(h("div", { class: "emb" }, bar, h("div", { class: "stage pick" },
      h("h2", { text: "What should this PowerPoint slide show?" }),
      fixed && idx < 0 ? h("p", { class: "fb no", text: "The lesson slide this was set to has been deleted. Pick another." }) : null,
      h("p", { class: "muted", text: "Pick one lesson slide: when you reach this PowerPoint slide in your slideshow, students' devices move to it. Or let this slide follow the live lesson and step through it with Back and Next." }),
      h("div", { class: "plist" },
        h("button", { class: "btn" + (cfg && cfg.mode === "follow" ? " on" : ""), onclick: () => pick({ mode: "follow" }) }, "Follow the live lesson (Back and Next on this slide)"),
        list.map((s, i) => h("button", { class: "btn" + (fixed && cfg.id === s.id ? " on" : ""), onclick: () => pick({ mode: "slide", id: s.id }) }, label(L, s, i)))))));
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
      if (sl.type !== "open") side.append(L.barsEl(sl, L.summaryFor(sl, students)));
    }
    side.append(h("div", { class: "row" },
      !fixed ? h("button", { class: "btn", disabled: live <= 0, onclick: () => L.goTo(live - 1), "aria-label": "Back" }, "←") : null,
      !fixed ? h("button", { class: "btn primary", disabled: live >= list.length - 1, onclick: () => L.goTo(live + 1), "aria-label": "Next" }, "→") : null,
      q ? h("button", { class: "btn" + (S.live.open ? "" : " on"), onclick: () => L.setLive({ open: !S.live.open }) }, S.live.open ? "Close answers" : "Reopen answers") : null,
      sl && L.TYPES[sl.type].graded ? h("button", { class: "btn" + (S.live.reveal ? " on" : ""), onclick: L.toggleReveal }, S.live.reveal ? "Hide answer" : "Show answer") : null));
  }
  if (editing) side.append(h("p", { class: "muted small", text: fixed ? "This slide holds lesson slide " + (idx + 1) + ". In the slideshow, reaching it moves students there." : "This slide follows the live lesson." }));
  app.append(h("div", { class: "emb" }, bar, h("div", { class: "emain" }, L.stageEl(sl, { showKey: isLive && S.live.reveal }), side)));
}

const CSS = `
.wrap{max-width:none;padding:0}
body{background:var(--paper)}
.emb{position:fixed;inset:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:8px;padding:8px;box-sizing:border-box}
.ebar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.ebrand{font:800 15px var(--f-display)}
.grow{flex:1}
.emain{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:10px;min-height:0}
.emain .stage,.emb>.stage{min-height:0;height:100%;overflow:auto;box-sizing:border-box}
.eside{display:flex;flex-direction:column;gap:10px;overflow:auto;min-height:0}
.eside .row .btn{flex:1 1 auto}
.small{font-size:13px;margin:0}
.pick .plist{display:grid;gap:6px}
.pick .plist .btn{justify-content:flex-start;text-align:left}
@media (max-width:560px){.emain{grid-template-columns:1fr}}
`;
