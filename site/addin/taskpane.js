import { init as initOffice, signIn } from "./addin.js";
export { signIn };
let page = "list", force = false, selected = null, busy = false;
const MAP = "liveLessonInteractions";
export async function init() {
  await initOffice();
  document.head.append(Object.assign(document.createElement("style"), { textContent: CSS }));
  if (globalThis.Office?.context?.document) {
    Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, refreshSelection);
    await refreshSelection();
  }
}
async function refreshSelection() {
  if (!globalThis.PowerPoint) return;
  try {
    selected = await PowerPoint.run(async context => {
      const slides = context.presentation.getSelectedSlides(); slides.load("items/id"); await context.sync();
      return slides.items.length === 1 ? slides.items[0].id : null;
    });
    if (page !== "edit") redraw();
  } catch { selected = null; }
}
export function keepEditor() { return !force && page === "edit" && !!document.querySelector(".llpanel #pbody"); }
function redraw() { force = true; try { window.__lesson?.render(true); } finally { force = false; } }
function navigate(next) {
  page = next;
  const L = window.__lesson;
  L.S.tab = next === "edit" ? "edit" : next === "groups" || next === "class" ? next : "live";
  if (next === "edit" && !L.S.edit) L.startEdit();
  redraw();
}
function create(type) {
  const L = window.__lesson;
  if (!L.S.edit) L.startEdit();
  L.S.edit.deck.slides.push(L.newSlide(type));
  L.S.editIdx = L.S.edit.deck.slides.length - 1;
  navigate("edit");
}
async function attach(slide) {
  const L = window.__lesson;
  if (busy) return;
  if (!globalThis.PowerPoint || !Office.context.requirements.isSetSupported("PowerPointApi", "1.4")) {
    L.toast("Adding a question card needs a newer PowerPoint version."); return;
  }
  busy = true; redraw();
  try {
    let slideId;
    await PowerPoint.run(async context => {
      const chosen = context.presentation.getSelectedSlides(); chosen.load("items/id"); await context.sync();
      if (chosen.items.length !== 1) throw new Error("Select one PowerPoint slide first.");
      const target = chosen.items[0]; slideId = target.id;
      const shapes = target.shapes; shapes.load("items/name"); await context.sync();
      for (const shape of shapes.items) if (shape.name === "Live Lesson interaction") shape.delete();
      const text = [slide.title || L.TYPES[slide.type].label, ...(slide.options || []).map((v, i) => `${i + 1}. ${v}`), "", `Join: ${location.host}${location.pathname}   Code: ${L.S.live.code || "Create a join code"}`].join("\n");
      const card = shapes.addTextBox(text, { left: 35, top: 65, width: 620, height: 350 });
      card.name = "Live Lesson interaction";
      await context.sync();
    });
    const settings = Office.context.document.settings;
    const map = { ...(settings.get(MAP) || {}), [slideId]: slide.id };
    settings.set(MAP, map);
    await new Promise((resolve, reject) => settings.saveAsync(r => r.status === "succeeded" ? resolve() : reject(new Error("The question card was added, but its link could not be saved. Try adding it again."))));
    selected = slideId;
    L.toast("Interaction added. Use Launch to send it to students.");
  } catch (e) { L.toast(e.message || "Could not add the interaction. Try again."); }
  finally { busy = false; redraw(); }
}
export function render(app) {
  const L = window.__lesson, S = L.S, h = L.h;
  const list = L.slides();
  const map = globalThis.Office?.context?.document?.settings.get(MAP) || {};
  const linked = selected && list.find(s => s.id === map[selected]);
  const header = h("header", { class: "llhead" }, h("b", { text: "Live Lesson" }), h("span", { class: "pill", text: S.connected ? "Connected" : "Connecting…" }));
  const nav = h("nav", { class: "llnav", "aria-label": "Interaction workspace" }, [["list","Interactions"],["class","Results"],["groups","Groups"]].map(([key,title]) => h("button", { class: "btn sm" + (page === key ? " on" : ""), onclick: () => navigate(key) }, title)));
  const body = h("section", { class: "llbody", id: "pbody" });
  const launch = s => L.goTo(list.findIndex(item => item.id === s.id));
  if (page === "choose") {
    body.append(h("button", { class: "btn sm", onclick: () => navigate("list") }, "← Interactions"), h("h2", { text: "Add an interaction" }), h("p", { class: "muted", text: "Choose how students participate." }),
      h("div", { class: "lltypes" }, [["poll","Poll","Collect opinions with choices"],["mcq","Quiz","Check understanding and score answers"],["multi","Select all","Allow several correct choices"],["tf","True or false","A quick understanding check"],["scale","Rating","Confidence from 1 to 5"],["open","Open response","Collect students’ written answers"],["number","Number","Accept a number with tolerance"],["short","Short answer","Mark accepted written answers"],["task","Group tasks","Different tasks for each learning group"]].map(([type,title,detail]) => h("button", { class: "lltype", onclick: () => create(type) }, h("b", { text: title }), h("span", { text: detail })))));
  } else if (page === "edit") {
    body.append(h("button", { class: "btn sm", onclick: () => navigate("list") }, "← Interactions"), ...L.editTab().filter(Boolean));
  } else if (page === "class" || page === "groups") {
    body.append(...(page === "class" ? L.classTab() : L.groupsTab()).filter(Boolean));
  } else {
    body.append(h("h2", { text: S.deck?.title || "Your lesson" }),
      h("button", { class: "btn primary", onclick: () => navigate("choose") }, "+ Add interaction"),
      S.live.code ? h("div", { class: "note", text: "Student join code: " + S.live.code }) : h("button", { class: "btn", onclick: () => L.setLive({ code: L.newCode() }) }, "Create join code"));
    if (linked) body.append(h("div", { class: "note" }, h("b", { text: "Selected slide: " }), linked.title,
      h("button", { class: "btn primary sm", onclick: () => launch(linked) }, "Launch interaction")));
    if (!list.length) body.append(h("p", { class: "muted", text: "Add your first interaction, write its question, and save it. Then add it to the selected PowerPoint slide." }));
    list.forEach((s, i) => body.append(h("article", { class: "llcard" }, h("span", { class: "eyebrow", text: `${i + 1} · ${L.TYPES[s.type].label}` }), h("b", { text: s.title || "Untitled interaction" }),
      h("div", { class: "row" }, h("button", { class: "btn sm", disabled: busy, onclick: () => attach(s) }, busy ? "Adding…" : "Add to slide"), h("button", { class: "btn primary sm", onclick: () => launch(s) }, "Launch"), h("button", { class: "btn sm", onclick: () => { if (!S.edit) L.startEdit(); S.editIdx = S.edit.deck.slides.findIndex(x => x.id === s.id); navigate("edit"); } }, "Edit")))));
    if (list.length) body.append(h("h3", { text: "Live interaction" }), ...L.liveTab().filter(Boolean), h("div", { class: "row" }, h("button", { class: "btn sm", onclick: () => L.setLive({ open: !S.live.open }) }, S.live.open ? "Close answers" : "Reopen answers"), h("button", { class: "btn sm", onclick: L.toggleReveal }, S.live.reveal ? "Hide answer" : "Show answer")));
    body.append(h("p", { class: "muted small", text: "Question cards use PowerPoint text. For live charts on the slide, insert the Live Lesson content add-in. Launch sends the question to students." }));
  }
  app.append(h("div", { class: "llpanel" }, header, nav, body));
}
const CSS = `
.llpanel{position:fixed;inset:0;display:grid;grid-template-rows:auto auto minmax(0,1fr);background:var(--paper);font-size:14px}
.llhead{padding:14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}
.llnav{display:flex;gap:5px;padding:10px;border-bottom:1px solid var(--line)}
.llbody{overflow:auto;padding:14px;display:flex;flex-direction:column;gap:14px;min-width:0}
.llbody h2,.llbody h3{margin:0}.llcard{padding:14px;border:1px solid var(--line);border-radius:12px;display:flex;flex-direction:column;gap:10px;background:var(--bg)}
.lltypes{display:grid;gap:9px}.lltype{font:inherit;text-align:left;cursor:pointer;border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--paper);color:var(--ink);display:flex;flex-direction:column;gap:5px}.lltype:hover{border-color:var(--accent)}.lltype span{font-size:13px;color:var(--muted)}
.llbody .ed,.llbody .gcols{grid-template-columns:1fr}.llbody .elist{max-height:140px;overflow:auto}.llbody .import{display:none}.llbody .tblwrap{max-width:100%;overflow:auto}.llbody .stat{flex-wrap:wrap}
`;
