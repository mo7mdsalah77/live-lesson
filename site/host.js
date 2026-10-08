// Website host: gives the lesson page the same db / room / user / downloads calls it uses on Claude,
// backed by Firebase Auth (anonymous students, Google teachers) and Firestore.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, collection, getDoc, setDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const app$ = document.getElementById("app");
const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === "text") e.textContent = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); } e.append(...kids); return e; };
const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
const ONLINE_MS = 90 * 60 * 1000;

function screen(...kids) {
  app$.replaceChildren(
    el("div", { class: "top" }, el("div", { class: "brand grow" }, "Live Lesson", el("small", { text: "Answer live in class" }))),
    el("div", { class: "swrap" }, el("div", { class: "scard" }, ...kids)));
}

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("PASTE")) {
  screen(el("h2", { text: "Almost ready" }), el("p", { class: "muted", text: "Add your Firebase settings to config.js to switch the live lesson on." }));
  throw new Error("config.js is not filled in yet");
}

const fb = initializeApp(firebaseConfig);
const auth = getAuth(fb);
const fs = getFirestore(fb);
// Opened as ?addin: running inside PowerPoint as the Live Lesson add-in (teacher only).
const addin = new URLSearchParams(location.search).has("addin") ? await import("./addin/addin.js") : null;
if (addin) { await addin.init(); window.EMBED = addin; }
const teacherMode = !!addin || location.hash === "#teacher";

function shim(space, isTeacher, user) {
  const P = p => "spaces/" + space + "/" + p;
  const wrap = s => ({ id: s.id, exists: s.exists(), data: () => s.data(), metadata: { fromCache: s.metadata.fromCache, hasPendingWrites: s.metadata.hasPendingWrites } });
  let lastCode = null;
  const db = {
    doc: p => ({
      id: p.split("/").pop(), path: p,
      get: async () => wrap(await getDoc(doc(fs, P(p)))),
      set: async d => {
        await setDoc(doc(fs, P(p)), d);
        if (isTeacher && p === "live/state" && d.code && d.code !== lastCode) { lastCode = d.code; await setDoc(doc(fs, "codes", d.code), { owner: space, at: Date.now() }); }
      },
      delete: () => deleteDoc(doc(fs, P(p))),
      onSnapshot: (next, err) => onSnapshot(doc(fs, P(p)), s => next(wrap(s)), e => { console.warn(p, e); err && err({ code: "unavailable", message: e.message }); }),
    }),
    collection: p => ({
      onSnapshot: (next, err) => onSnapshot(collection(fs, P(p)), q => next({ docs: q.docs.map(wrap), size: q.size, empty: q.empty, metadata: { fromCache: q.metadata.fromCache } }), e => { console.warn(p, e); err && err({ code: "unavailable", message: e.message }); }),
    }),
  };
  // Students' answers live in spaces/<teacher>/responses/<student uid>; the teacher sees them as "peers".
  let chain = Promise.resolve();
  const room = {
    onConnection: h => { setTimeout(() => h(true), 0); return () => {}; },
    onPeers: h => {
      if (!isTeacher) return () => {};
      return onSnapshot(collection(fs, P("responses")), q => {
        const now = Date.now();
        const peers = q.docs.map(d => ({ peer: d.id, by: d.id, isMe: false, sameTab: false, kind: "viewer", guest: false, presence: d.data(), updatedAt: d.data().at || 0 }))
          .filter(p => now - (p.updatedAt || 0) < ONLINE_MS);
        h({ peers, joined: [], left: [], updated: [] });
      }, e => console.warn("responses", e));
    },
    presence: data => {
      if (isTeacher) return Promise.resolve();
      chain = chain.then(() => setDoc(doc(fs, P("responses/" + user.uid)), { ...data, at: Date.now() }, { merge: true })).catch(e => console.warn("answer not saved", e));
      return chain;
    },
  };
  const userNs = {
    canEdit: async () => isTeacher, isOwner: async () => isTeacher, can: async () => isTeacher,
    id: async () => user.uid, name: async () => isTeacher ? (user.displayName || "") : (ls.get("tll-name") || ""),
    profiles: async ids => Object.fromEntries([].concat(ids).map(id => [id, { id, name: "", avatarUrl: "", color: "#888", email: null, isMe: id === user.uid, guest: false }])),
  };
  const downloads = {
    save: async ({ filename, data }) => {
      const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data]));
      const a = el("a", { href: url, download: filename }); document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000); return { status: "saved" };
    },
  };
  const caps = { db, room, user: userNs, downloads };
  window.claude = { use: async n => caps[n] ?? null };
}

function start(space, isTeacher, user) {
  shim(space, isTeacher, user);
  if (isTeacher) window.__signOut = () => signOut(auth).then(() => location.reload());
  window.__startLesson();
}

function teacherGate() {
  const err = el("p", { class: "fb no", style: "margin:0" }); err.hidden = true;
  screen(el("span", { class: "eyebrow", text: "Teacher" }), el("h2", { text: "Sign in to run your lesson" }),
    el("p", { class: "muted", style: "margin:0", text: "Your lessons, answer keys and class results are kept under your account. Students never need an account." }),
    el("button", { class: "btn primary", onclick: () => (addin ? addin.signIn(auth) : signInWithPopup(auth, new GoogleAuthProvider())).catch(e => { err.textContent = "Sign-in didn't finish: " + (e.code || e.message); err.hidden = false; }) }, "Sign in with Google"), err,
    addin ? el("p", { class: "muted", style: "margin:0;font-size:14px", text: "Use the same Google account as on the website." }) : el("a", { href: "./", text: "I'm a student" }));
}

function studentGate(user) {
  const code = el("input", { type: "text", id: "g-code", maxlength: "8", placeholder: "K7M2Q", autocomplete: "off", autocapitalize: "characters", style: "font:700 26px var(--f-mono);letter-spacing:.15em;text-transform:uppercase" });
  const name = el("input", { type: "text", id: "g-name", maxlength: "40", placeholder: "First name and last name", autocomplete: "name" });
  code.value = ls.get("tll-code") || ""; name.value = ls.get("tll-name") || "";
  const err = el("p", { class: "fb no", style: "margin:0" }); err.hidden = true;
  const go = async () => {
    const c = code.value.trim().toUpperCase(), n = name.value.trim();
    const fail = m => { err.textContent = m; err.hidden = false; btn.disabled = false; };
    if (!c) return fail("Type the code from the board.");
    if (!n) return fail("Type your name so your teacher knows who you are.");
    btn.disabled = true;
    try {
      const u = user || (await signInAnonymously(auth)).user;
      const snap = await getDoc(doc(fs, "codes", c));
      if (!snap.exists()) return fail("That code doesn't match a lesson. Check the code on the board.");
      ls.set("tll-code", c); ls.set("tll-name", n);
      start(snap.data().owner, false, u);
    } catch (e) { console.warn(e); fail("Couldn't connect. Check your internet and try again."); }
  };
  const btn = el("button", { class: "btn primary", onclick: go }, "Join lesson");
  for (const i of [code, name]) i.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
  screen(el("span", { class: "eyebrow", text: "Join the lesson" }), el("h2", { text: "Enter your lesson code" }),
    el("label", { class: "f", for: "g-code" }, "Lesson code from the board"), code,
    el("label", { class: "f", for: "g-name" }, "Your name, as your teacher knows you"), name, err, btn,
    el("a", { href: "#teacher", onclick: () => setTimeout(() => location.reload(), 0), text: "I'm the teacher", style: "font-size:14px" }));
}

let started = false;
onAuthStateChanged(auth, async user => {
  if (started) return;
  if (teacherMode) {
    if (user && !user.isAnonymous) { started = true; start(user.uid, true, user); }
    else teacherGate();
    return;
  }
  // Returning student: rejoin straight away when their saved code still points to a lesson.
  const saved = ls.get("tll-code");
  if (user && user.isAnonymous && saved && ls.get("tll-name")) {
    try { const snap = await getDoc(doc(fs, "codes", saved)); if (snap.exists()) { started = true; return start(snap.data().owner, false, user); } } catch {}
  }
  studentGate(user && user.isAnonymous ? user : null);
});
