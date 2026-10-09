import { init as initOffice, signIn, isSlideShow } from "./addin.js?v=nour-1.4";
import { insertInteraction } from "./insert-interaction.js?v=nour-1.4";
import { questionForm, validateQuestion } from "./question-form.js?v=nour-1.4";
export { signIn };
let page = "list", force = false, selected = null, busy = false;
let draft = null;
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
  redraw();
}
const clone = value => JSON.parse(JSON.stringify(value));
function create(type) {
  const L = window.__lesson;
  draft = { slide: L.newSlide(type), key: {}, isNew: true };
  if (type === "multi") draft.key.correct = [];
  navigate("edit");
}
function edit(slide) {
  draft = { slide: clone(slide), key: clone(window.__lesson.S.keys[slide.id] || {}), isNew: false };
  navigate("edit");
}
async function saveQuestion() {
  const L = window.__lesson;
  if (busy || !draft || draft.uploading) return;
  const problem = validateQuestion(draft);
  if (problem) { L.toast(problem); return; }
  busy = true; redraw();
  try {
    const deck = clone(L.S.deck || { title: "My interactions", slides: [] });
    const index = deck.slides.findIndex(slide => slide.id === draft.slide.id);
    if (index < 0) deck.slides.push(clone(draft.slide)); else deck.slides[index] = clone(draft.slide);
    const keys = { ...clone(L.S.keys), [draft.slide.id]: clone(draft.key) };
    await L.S.db.doc("keys/main").set({ keys });
    await L.S.db.doc("deck/main").set(deck);
    L.S.deck = deck; L.S.keys = keys;
    if (draft.isNew && !draft.nativeId) draft.nativeId = await insertInteraction(draft.slide);
    if (draft.nativeId) await rememberSlide(draft.nativeId, draft.slide.id);
    L.toast(draft.isNew ? "Interaction slide added to PowerPoint." : "Question updated.");
    draft = null; navigate("list");
  } catch (e) { L.toast(e.message || "Could not save the interaction. Your draft is still here."); }
  finally { busy = false; redraw(); }
}
async function rememberSlide(slideId, questionId) {
  const settings = Office.context.document.settings;
  settings.set(MAP, { ...(settings.get(MAP) || {}), [slideId]: questionId });
  await new Promise((resolve, reject) => settings.saveAsync(r => r.status === "succeeded" ? resolve() : reject(new Error("The interaction slide exists, but its sidebar link could not be saved. Try Save again."))));
  selected = slideId;
}
async function attach(slide) {
  const L = window.__lesson;
  if (busy) return;
  busy = true; redraw();
  try {
    const id = await insertInteraction(slide);
    await rememberSlide(id, slide.id);
    L.toast("New interaction slide added to PowerPoint.");
  } catch (e) { L.toast(e.message || "Could not add the interaction slide."); }
  finally { busy = false; redraw(); }
}
export function render(app) {
  const L = window.__lesson, S = L.S, h = L.h;
  const list = L.slides();
  const map = globalThis.Office?.context?.document?.settings.get(MAP) || {};
  const linked = selected && list.find(s => s.id === map[selected]);
  const header = h("header", { class: "llhead" }, h("img",{src:"./assets/nour-icon-32.png",alt:"",width:28,height:28}), h("b", { text: "Nour" }), h("span", { class: "pill", text: S.connected ? "Connected" : "Connecting…" }));
  const menu = h("details",{class:"llmenu"},h("summary",{text:"☰ Menu"}),h("div",{class:"llmenuitems"},h("button",{class:"btn",onclick:()=>navigate("class")},"View results and export"),h("button",{class:"btn",onclick:()=>navigate("groups")},"Learning groups"),h("a",{class:"btn",href:"./#teacher",target:"_blank",rel:"noopener",text:"Manage lesson in browser"}),h("button",{class:"btn",onclick:()=>{navigate("list");}},"Share lesson QR")));
  const nav = h("nav", { class: "llnav", "aria-label": "Interaction workspace" }, [["list","Interactions"],["class","Results"],["groups","Groups"]].map(([key,title]) => h("button", { class: "btn sm" + (page === key ? " on" : ""), onclick: () => navigate(key) }, title)));
  const body = h("section", { class: "llbody", id: "pbody" });
  const launch = s => L.goTo(list.findIndex(item => item.id === s.id));
  if (page === "choose") {
    body.append(h("button", { class: "btn sm", onclick: () => navigate("list") }, "← Interactions"), h("h2", { text: "Add an interaction" }), h("p", { class: "muted", text: "Choose how students participate." }),
      h("div", { class: "lltypes" }, [["poll","Poll","Collect opinions with choices"],["mcq","Quiz","Check understanding and score answers"],["multi","Select all","Allow several correct choices"],["tf","True or false","A quick understanding check"],["scale","Rating","Confidence from 1 to 5"],["open","Open response","Collect students’ written answers"],["number","Number","Accept a number with tolerance"],["short","Short answer","Mark accepted written answers"],["task","Group tasks","Different tasks for each learning group"]].map(([type,title,detail]) => h("button", { class: "lltype", onclick: () => create(type) }, h("b", { text: title }), h("span", { text: detail })))));
  } else if (page === "edit") {
    body.append(...questionForm(L, draft, redraw, saveQuestion, () => { draft = null; navigate("list"); }, busy));
  } else if (page === "class" || page === "groups") {
    body.append(...(page === "class" ? L.classTab() : L.groupsTab()).filter(Boolean));
  } else {
    body.append(h("h2", { text: S.deck?.title || "Your lesson" }),
      h("button", { class: "btn primary", onclick: () => navigate("choose") }, "+ Add interaction"),
      S.live.code ? h("div", { class: "lljoin" }, L.qrEl(S.live.code), h("div", null, h("span", { class: "eyebrow", text: "Students join with" }), h("b", { class: "mono", text: "#" + S.live.code }), h("span", { class: "muted", text: L.shortSite() }))) : h("button", { class: "btn", onclick: () => L.setLive({ code: L.newCode() }) }, "Create join code"));
    if (linked) body.append(h("div", { class: "note" }, h("b", { text: "Selected slide: " }), linked.title,
      h("button", { class: "btn primary sm", disabled: !isSlideShow(), title: "Starts automatically when this slide is presented", onclick: () => launch(linked) }, "Start interaction")));
    if (!list.length) body.append(h("p", { class: "muted", text: "Choose an interaction, write your question, and click Add to presentation. A new live slide is inserted after your current slide." }));
    list.forEach((s, i) => body.append(h("article", { class: "llcard" }, h("span", { class: "eyebrow", text: `${i + 1} · ${L.TYPES[s.type].label}` }), h("b", { text: s.title || "Untitled interaction" }),
      h("div", { class: "row" }, h("button", { class: "btn sm", disabled: busy, onclick: () => attach(s) }, busy ? "Adding…" : "Add to presentation"), h("button", { class: "btn primary sm", disabled: !isSlideShow(), title: "Starts automatically in slideshow mode", onclick: () => launch(s) }, "Launch"), h("button", { class: "btn sm", onclick: () => edit(s) }, "Edit")))));
    if (list.length) body.append(h("h3", { text: "Live interaction" }), ...L.liveTab().filter(Boolean), h("div", { class: "row" }, h("button", { class: "btn sm", onclick: () => L.setLive({ open: !S.live.open }) }, S.live.open ? "Close answers" : "Reopen answers"), h("button", {class:"btn sm",onclick:L.toggleResults},S.live.resultsVisible ? "Hide results" : "Show results"), L.hasAnswerKey(list[S.live.slide || 0],S.keys[list[S.live.slide || 0]?.id]) ? h("button", { class: "btn sm", onclick: L.toggleReveal }, S.live.reveal ? "Hide answer" : "Reveal correct answer") : null, L.timerEl()));
    body.append(h("p", { class: "muted small", text: "Each interaction is its own live PowerPoint slide. Use the side panel for your results and groups." }));
  }
  app.append(h("div", { class: "llpanel" }, header, h("div",null,menu,nav), body));
}
const CSS = `
.llmenu{background:var(--card);padding:12px 14px;border-bottom:1px solid var(--line)}.llmenu summary{cursor:pointer;font-weight:600}.llmenuitems{display:grid;gap:8px;padding-top:12px}
.wrap{max-width:none;padding:0}
.llpanel{position:fixed;inset:0;display:grid;grid-template-rows:auto auto minmax(0,1fr);background:var(--paper);font-size:14px}
.llhead{padding:12px 14px;display:flex;align-items:center;gap:8px;background:var(--card);border-bottom:1px solid var(--line)}
.llhead b{font-size:16px;flex:1}
.llhead img{border-radius:6px}
.llnav{display:flex;gap:0;padding:0 8px;background:var(--card);border-bottom:1px solid var(--line)}
.llnav .btn{border:0;border-radius:0;background:none;color:var(--muted);border-bottom:2px solid transparent;min-height:40px;padding:6px 10px;margin-bottom:-1px}
.llnav .btn.on{color:var(--accent);border-bottom-color:var(--accent);background:none}
.llbody{overflow:auto;padding:14px;display:flex;flex-direction:column;gap:12px;min-width:0}
.llbody h2{font-size:18px;margin:0}.llbody h3{font-size:15px;margin:6px 0 0}
.llbody>.btn.primary{min-height:44px}
.llcard{padding:12px 14px;border:1px solid var(--line);border-radius:10px;display:flex;flex-direction:column;gap:8px;background:var(--card);box-shadow:var(--shadow)}
.llcard>b{font-size:15px}
.lljoin{display:grid;grid-template-columns:84px minmax(0,1fr);gap:12px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px;box-shadow:var(--shadow)}
.lljoin .qr{width:84px;height:auto;border-radius:4px}
.lljoin div{display:grid;gap:2px;min-width:0}
.lljoin b{font-size:24px;color:var(--accent);letter-spacing:.06em}
.lljoin .muted{font-size:12px;word-break:break-all}
.llbody .joincard{display:none}
.lltypes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.lltype{min-width:0}.lltype{font:inherit;text-align:left;cursor:pointer;border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:var(--card);color:var(--ink);display:flex;flex-direction:column;gap:3px;box-shadow:var(--shadow);transition:border-color .15s}.lltype:hover{border-color:var(--accent)}.lltype b{font-size:15px}.lltype span{font-size:13px;color:var(--muted)}
.lladvanced{display:grid;gap:12px}.lladvanced summary{cursor:pointer;font-weight:600;padding:10px 0}.llbody .ed,.llbody .gcols{grid-template-columns:1fr}.llbody .elist{max-height:140px;overflow:auto}.llbody .import{display:none}.llbody .tblwrap{max-width:100%;overflow:auto}.llbody .stat{flex-wrap:wrap}
`;
