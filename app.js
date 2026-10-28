"use strict";
/* Countdown Study Planner: plan which subject and chapter you finish on which day. */

/* ---------- helpers ---------- */
const COLORS = ["#2747D9", "#D9466B", "#0E9F8E", "#E08A00", "#7C3AED", "#3B8B2E", "#C2410C", "#0891B2"];
const LS = "countdown-planner.v1", UI_LS = "countdown-planner.ui";
const APP_VERSION = "1.0.0"; // keep in step with versionName in android/app/build.gradle
const TABS = ["today", "calendar", "subjects"];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const diff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const fmt = (s, o = { day: "numeric", month: "short" }) => s ? parse(s).toLocaleDateString(undefined, o) : "No date";
const fmtW = s => fmt(s, { weekday: "short", day: "numeric", month: "short" });
const fmtL = s => fmt(s, { weekday: "long", day: "numeric", month: "long" });
const wd = s => (parse(s).getDay() + 6) % 7;
const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + "s")}`;
const isDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && iso(parse(s)) === s; // a real calendar date, not just the right shape
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const native = !!window.Capacitor?.isNativePlatform?.();
const Plug = window.Capacitor?.Plugins || {};
function rel(d) {
  const n = diff(today(), d);
  return n === 0 ? "Today" : n === 1 ? "Tomorrow" : n === -1 ? "Yesterday" : n > 0 ? `In ${n} days` : `${-n} days ago`;
}
function haptic(kind = "light") {
  try {
    if (native && Plug.Haptics) kind === "success" ? Plug.Haptics.notification({ type: "SUCCESS" }) : Plug.Haptics.impact({ style: kind === "medium" ? "MEDIUM" : "LIGHT" });
    else if (navigator.vibrate) navigator.vibrate(kind === "success" ? [10, 50, 14] : 8);
  } catch (e) {}
}

const I = {
  tick: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  grip: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/></svg>',
  timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4M9 2h6"/></svg>',
  wand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20 16 8M14 6l4 4M18 3v3M21 6h-3M8 3v2M9 4H7M20 15v2M21 16h-2"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  google: '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>',
  apple: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.8a4.6 4.6 0 0 0-3.6-2c-1.5-.2-3 .9-3.8.9s-2-.9-3.3-.8a4.9 4.9 0 0 0-4.1 2.5c-1.8 3.1-.5 7.6 1.2 10.1.8 1.2 1.8 2.6 3.1 2.5 1.3-.1 1.7-.8 3.3-.8s2 .8 3.3.8 2.2-1.3 3-2.5c.9-1.4 1.3-2.8 1.3-2.8s-2.5-1-2.5-4.1zM14 5.2c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4 0 7-2.7 7-6.5 0-4-3.5-6-4-10.5-2.5 1.5-4 4-4 6.5-1-.5-2-2-2-3.5C7 9.5 5 12 5 15.5 5 19.3 8 22 12 22z"/></svg>',
};

/* ---------- state ---------- */
const LIMITS = { subjects: 60, chapters: 400, subjectName: 80, chapterName: 120, offDates: 500 };
const SAFE_ID = /^[A-Za-z0-9_-]{1,40}$/, SAFE_COLOR = /^#[0-9a-fA-F]{6}$/;
const clip = (v, n) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
/* Checks and repairs a plan from any source: typed in, restored from a backup code, or synced from the account.
   Anything malformed is fixed or dropped, so nothing unexpected can reach the page. */
function migrate(p) {
  if (!p || typeof p !== "object" || Array.isArray(p) || !isDate(p.deadline) || !Array.isArray(p.subjects)) return null;
  const seen = new Set(), freshId = id => { const v = typeof id === "string" && SAFE_ID.test(id) && !seen.has(id) ? id : uid(); seen.add(v); return v; };
  p.v = 2;
  p.dailyLimit = Math.min(20, Math.max(1, Math.round(+p.dailyLimit) || 4));
  p.offWeekdays = Array.isArray(p.offWeekdays) ? [...new Set(p.offWeekdays.filter(n => Number.isInteger(n) && n >= 0 && n < 7))] : [];
  p.offDates = Array.isArray(p.offDates) ? [...new Set(p.offDates.filter(isDate))].slice(-LIMITS.offDates) : [];
  const log = {};
  if (p.focusLog && typeof p.focusLog === "object") Object.entries(p.focusLog).forEach(([d, sec]) => { if (isDate(d) && Number.isFinite(+sec) && +sec > 0) log[d] = Math.min(86400, Math.round(+sec)); });
  p.focusLog = log;
  p.updatedAt = Number.isFinite(+p.updatedAt) && +p.updatedAt > 0 ? +p.updatedAt : Date.now();
  p.sample = !!p.sample;
  if (p.consent && !(isDate(p.consent.version) && Number.isFinite(+p.consent.at))) delete p.consent;
  let chapters = 0;
  p.subjects = p.subjects.filter(s => s && typeof s === "object" && Array.isArray(s.topics)).slice(0, LIMITS.subjects);
  p.subjects.forEach((s, i) => {
    s.id = freshId(s.id);
    s.name = clip(s.name, LIMITS.subjectName) || "Untitled subject";
    s.color = SAFE_COLOR.test(s.color) ? s.color : COLORS[i % COLORS.length];
    s.due = isDate(s.due) ? s.due : p.deadline;
    s.focusSec = Number.isFinite(+s.focusSec) && +s.focusSec > 0 ? Math.round(+s.focusSec) : 0;
    s.topics = s.topics.filter(t => t && typeof t === "object").slice(0, Math.max(0, LIMITS.chapters - chapters));
    chapters += s.topics.length;
    s.topics.forEach(t => {
      t.id = freshId(t.id);
      t.name = clip(t.name, LIMITS.chapterName) || "Untitled chapter";
      t.date = isDate(t.date) ? t.date : "";
      t.done = !!t.done;
      if (!t.done || !isDate(t.doneOn)) delete t.doneOn;
    });
  });
  return p;
}
let state = null;
try { state = migrate(JSON.parse(localStorage.getItem(LS))); } catch (e) {}
let ui = { theme: "system" };
try { ui = { ...ui, ...JSON.parse(localStorage.getItem(UI_LS) || "{}") }; } catch (e) {}

let view = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "today";
let calMonth = null, selDay = today(), lastDay = today();

function persist() { try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) { toast("Couldn't save on this device. Storage may be full."); } }
function save() { migrate(state); state.updatedAt = Date.now(); persist(); Sync.schedule(state); }
function saveUi() { try { localStorage.setItem(UI_LS, JSON.stringify(ui)); } catch (e) {} }

let undoSnap = null;
const snap = () => { undoSnap = JSON.stringify(state); };
function undo() { if (!undoSnap) return; state = migrate(JSON.parse(undoSnap)); undoSnap = null; save(); render(); haptic(); }

/* ---------- derived ---------- */
const subj = id => state.subjects.find(s => s.id === id);
const nextColor = () => COLORS.find(c => !state.subjects.some(s => s.color === c)) || COLORS[state.subjects.length % COLORS.length];
const findTopic = (sid, tid) => { const s = subj(sid); const t = s?.topics.find(x => x.id === tid); return t ? { s, t } : null; };
const allTopics = () => state.subjects.flatMap(s => s.topics.map(t => ({ s, t })));
const isOff = d => state.offWeekdays.includes(wd(d)) || state.offDates.includes(d);
function byDay() { const m = {}; allTopics().forEach(x => { if (x.t.date) (m[x.t.date] = m[x.t.date] || []).push(x); }); return m; }
function progress(list) { const n = list.length, d = list.filter(t => t.done).length; return { n, d, p: n ? Math.round(d / n * 100) : 0 }; }
function studyDays(a, b) { const out = []; for (let d = a; d <= b; d = addDays(d, 1)) if (!isOff(d)) out.push(d); return out; }
function nextStudyDay(from) { let d = from; for (let i = 0; i < 60; i++) { if (!isOff(d)) return d; d = addDays(d, 1); } return from; }
function pace() {
  const t = today(), left = allTopics().filter(x => !x.t.done).length;
  const days = state.deadline >= t ? studyDays(t, state.deadline).length : 0;
  return { left, days, per: days ? left / days : 0 };
}
function streak() {
  const a = new Set(Object.keys(state.focusLog).filter(d => state.focusLog[d] > 0));
  allTopics().forEach(({ t }) => t.done && t.doneOn && a.add(t.doneOn));
  let d = today(); if (!a.has(d)) d = addDays(d, -1);
  let n = 0; while (a.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
const focusMin = d => Math.round((state.focusLog[d] || 0) / 60);

/* Give each chapter a study day between today and its subject's finish date: keeps chapter order,
   spreads evenly, skips days off, and prefers the lightest days across all subjects. */
function autoPlan(items) {
  if (!items.length) return 0;
  const t0 = today(), skip = new Set(items.map(x => x.t.id)), load = {};
  allTopics().forEach(({ t }) => { if (!t.done && t.date && !skip.has(t.id)) load[t.date] = (load[t.date] || 0) + 1; });
  const subjects = [...new Set(items.map(x => x.s))].sort((a, b) => a.due.localeCompare(b.due));
  subjects.forEach(s => {
    const its = items.filter(x => x.s === s);
    const end = s.due < t0 ? t0 : s.due;
    let days = studyDays(t0, end);
    if (!days.length) days = [nextStudyDay(t0) <= end ? nextStudyDay(t0) : end];
    const D = days.length, n = its.length;
    its.forEach((x, i) => {
      const lo = Math.floor(i * D / n), hi = Math.min(D - 1, Math.max(lo, Math.ceil((i + 1) * D / n) - 1));
      let best = days[lo], bl = Infinity;
      for (let k = lo; k <= hi; k++) { const l = load[days[k]] || 0; if (l < bl) { bl = l; best = days[k]; } }
      x.t.date = best; load[best] = (load[best] || 0) + 1;
    });
  });
  return items.length;
}
function needsPlan() {
  const t = today(), days = byDay();
  const over = new Set(Object.keys(days).filter(d => d >= t && days[d].filter(x => !x.t.done).length > state.dailyLimit));
  return allTopics().filter(({ s, t: x }) => !x.done && (!x.date || x.date < t || x.date > s.due || isOff(x.date) || over.has(x.date)));
}
function warnings() {
  const w = [], t = today(), dl = state.deadline, days = byDay(), all = allTopics();
  if (dl < t) w.push({ msg: `Your final deadline (${fmt(dl)}) has passed. Set a new one to keep planning.`, act: "deadline", label: "Change" });
  state.subjects.forEach(s => {
    if (s.due > dl) w.push({ msg: `${s.name} finishes on ${fmt(s.due)}, after your final deadline.`, act: "edit", sid: s.id, label: "Fix" });
    const after = s.topics.filter(x => !x.done && x.date && x.date > s.due).length;
    if (after) w.push({ msg: `${plural(after, "chapter")} in ${s.name} ${after > 1 ? "are" : "is"} planned after its finish date.`, act: "edit", sid: s.id, label: "Fix" });
  });
  const nod = all.filter(x => !x.t.done && !x.t.date).length;
  if (nod) w.push({ msg: `${plural(nod, "chapter")} ${nod > 1 ? "have" : "has"} no date yet.`, act: "fixplan", label: "Plan them" });
  const late = all.filter(x => !x.t.done && x.t.date && x.t.date < t).length;
  if (late) w.push({ msg: `${plural(late, "chapter")} ${late > 1 ? "are" : "is"} overdue.`, act: "fixplan", label: "Reschedule" });
  const offs = all.filter(x => !x.t.done && x.t.date >= t && isOff(x.t.date)).length;
  if (offs) w.push({ msg: `${plural(offs, "chapter")} ${offs > 1 ? "are" : "is"} planned on your days off.`, act: "fixplan", label: "Move" });
  Object.entries(days).sort().forEach(([d, l]) => {
    const open = l.filter(x => !x.t.done).length;
    if (d >= t && open > state.dailyLimit) w.push({ msg: `${fmtW(d)} has ${open} chapters, more than your limit of ${state.dailyLimit}.`, act: "gotoday", day: d, label: "View" });
  });
  return w;
}

/* ---------- small templates ---------- */
const SYNC_TEXT = {
  off: ["", "Saved on this device"], signedout: ["", "Saved on this device"], pending: ["busy", "Saving…"],
  syncing: ["busy", "Syncing…"], synced: ["ok", "Synced"], offline: ["warn", "Offline, will sync"], error: ["warn", "Sync paused"],
};
/* Signed in: the account button shows a small status dot instead of a separate sync label. */
function avatarBtn() {
  if (!Sync.enabled) return "";
  const u = Sync.user(), ch = (u?.email || "").trim()[0];
  const [cls, txt] = SYNC_TEXT[Sync.info().status] || SYNC_TEXT.off;
  return u ? `<button class="iconbtn avatar" data-act="account" aria-label="Account, ${txt}" title="${txt}">${esc((ch || "?").toUpperCase())}<i class="sdot ${cls}"></i></button>`
    : `<button class="iconbtn" data-act="account" aria-label="Sign in" title="Sign in to back up your plan">${I.user}</button>`;
}
function topbar(label, title) {
  return `<header class="topbar rise" style="--i:0"><div><p class="label">${esc(label)}</p><h1>${esc(title)}</h1></div>
  <div class="tb-actions">${avatarBtn()}<button class="iconbtn" data-act="settings" aria-label="Settings">${I.gear}</button></div></header>`;
}
function shortWhen(d) {
  const n = diff(today(), d);
  return n === 1 ? "Tomorrow" : n < 7 ? DOW[wd(d)] : fmt(d);
}
function taskRow({ s, t }, o = {}) {
  const late = t.date && !t.done && t.date < today(), n = late ? diff(t.date, today()) : 0;
  const sub = [esc(s.name), isOff(t.date || "x") && !t.done ? "day off" : ""].filter(Boolean).join(" · ");
  const right = late ? `<span class="chip late">${n === 1 ? "1 day late" : `${n} days late`}</span>`
    : o.when ? `<span class="chip">${o.when}</span>` : "";
  return `<div class="task${t.done ? " done" : ""}${o.drag ? " has-grip" : ""}" style="--sc:${s.color}" data-tid="${t.id}" data-sid="${s.id}" data-flip="t-${t.id}">
    ${o.drag ? `<button class="grip" data-drag aria-label="Drag ${esc(t.name)} to another day">${I.grip}</button>` : ""}
    <button class="check" data-act="toggle" aria-pressed="${t.done}" aria-label="${t.done ? "Mark not done" : "Mark done"}: ${esc(t.name)}">${I.tick}</button>
    <button class="tbody" data-act="topic"><strong>${esc(t.name)}</strong><span>${sub}</span></button>
    ${right}
  </div>`;
}
/* All warnings collapse into one card: the most useful action up front, the rest behind "See all". */
function attention() {
  const w = warnings();
  if (!w.length) return "";
  const btn = (x, cls = "btn ghost sm") => `<button class="${cls}" data-act="${x.act}"${x.sid ? ` data-sid="${x.sid}"` : ""}${x.day ? ` data-day="${x.day}"` : ""}>${x.label}</button>`;
  const main = needsPlan().length ? `<button class="btn sm" data-act="fixplan" title="Moves late, unplanned and crowded chapters to free study days">${I.wand}Fix my plan</button>` : btn(w[0], "btn sm");
  return `<section class="card attn rise" style="--i:2" data-flip="attn">
    <div class="attn-head">${I.warn}<div><b>${w.length === 1 ? "1 thing needs a look" : `${w.length} things need a look`}</b><span>${esc(w[0].msg)}</span></div></div>
    <div class="attn-actions">${main}${w.length > 1 ? `<details class="more"><summary>See all ${w.length}</summary><ul>${w.map(x => `<li><span>${esc(x.msg)}</span>${btn(x)}</li>`).join("")}</ul></details>` : ""}</div>
  </section>`;
}
const banner = () => `<div class="banner rise" style="--i:1" data-flip="banner"><span><b>This is an example plan.</b> Rename or delete these subjects and add your own.</span><button class="btn sm" data-act="keep">Got it</button></div>`;
/* One-time "how it works" card for new plans. */
function tipCard() {
  if (ui.tipDone) return "";
  return `<section class="card tip rise" style="--i:1" data-flip="tip">
    <p class="label">How it works</p>
    <ol><li><b>Add your chapters</b> with the <span class="kbd">${I.plus}</span> button.</li>
      <li><b>Swipe a chapter right</b> (or tick it) when it's done.</li>
      <li><b>Swipe left</b> to move it to your next study day.</li></ol>
    <button class="btn sm" data-act="tipdone">Got it</button></section>`;
}
function paceLine(pr, pc, left) {
  if (!pr.n) return "Add your chapters to see how much to do each day.";
  if (!pc.left) return "Everything is done. Great work!";
  if (left < 0) return "Your deadline has passed. Tap the date to set a new one.";
  if (!pc.days) return "No study days left before your deadline.";
  if (pc.per < 0.75) return `Do about <b>1 chapter every ${Math.round(1 / pc.per)} days</b> to finish on time.`;
  return `Do about <b>${plural(Math.round(pc.per) || 1, "chapter")} a day</b> to finish on time.`;
}

/* ---------- views ---------- */
function vToday() {
  const t = today(), dl = state.deadline, left = diff(t, dl), all = allTopics(), pr = progress(all.map(x => x.t)), pc = pace(), days = byDay();
  const late = all.filter(x => !x.t.done && x.t.date && x.t.date < t).sort((a, b) => a.t.date.localeCompare(b.t.date));
  const todays = days[t] || [];
  const todo = [...late, ...todays.filter(x => !x.t.done), ...todays.filter(x => x.t.done)];
  const doneCount = todays.filter(x => x.t.done).length;
  const next = all.filter(x => !x.t.done && x.t.date > t).sort((a, b) => a.t.date.localeCompare(b.t.date)).slice(0, 4);
  const st = streak(), fm = focusMin(t);
  const meta = [st ? `<span>${I.flame}${st}-day streak</span>` : "", fm ? `<span>${I.timer}${fm} min focused today</span>` : ""].filter(Boolean);
  return `${topbar(fmt(t, { weekday: "long", day: "numeric", month: "long" }), "Today")}
  ${state.sample ? banner() : tipCard()}
  <section class="card hero rise" style="--i:1">
    <div class="count"><span class="dnum" data-anim="days" data-kind="num" data-val="${Math.max(0, left)}">${Math.max(0, left)}</span><span class="label">${left === 1 ? "day left" : "days left"}</span></div>
    <div class="hero-main">
      <button class="deadline" data-act="deadline"><span class="sr-only">Change deadline: </span><small>until</small><span>${fmtL(dl)}</span>${I.pencil}</button>
      <div class="bar"><b data-anim="overall" data-kind="bar" data-val="${pr.p}"></b></div>
      <div class="barrow"><span>${pr.d} of ${plural(pr.n, "chapter")} done</span><span class="num">${pr.p}%</span></div>
      <p class="pace">${paceLine(pr, pc, left)}</p>
      ${meta.length ? `<p class="meta-row">${meta.join("")}</p>` : ""}
    </div>
  </section>
  ${attention()}
  <section class="section rise" style="--i:3"><div class="sechead"><h2>To do today</h2>${todo.length ? `<span class="count-pill num" data-n="${doneCount}">${doneCount} of ${todays.length + late.length} done</span>` : ""}</div>
    ${todo.length ? `<div class="card tasks">${todo.map(x => taskRow(x)).join("")}</div>` : emptyToday()}
  </section>
  ${next.length ? `<section class="section rise" style="--i:5"><div class="sechead"><h2>Coming up</h2><button class="linkbtn" data-act="tab" data-view="calendar">Open calendar</button></div>
    <div class="card tasks">${next.map(x => taskRow(x, { when: shortWhen(x.t.date) })).join("")}</div></section>` : ""}`;
}
function emptyToday() {
  if (!state.subjects.length) return `<div class="card empty"><b>Start by adding a subject</b>Add what you need to study, then its chapters.<div class="row"><button class="btn" data-act="new">${I.plus}Add a subject</button></div></div>`;
  if (!allTopics().length) return `<div class="card empty"><b>Add your chapters</b>List the chapters for each subject and the app plans the days for you.<div class="row"><button class="btn" data-act="quickadd">${I.plus}Add chapters</button></div></div>`;
  if (isOff(today())) return `<div class="card empty"><b>Today is a day off</b>Rest up. Your plan picks up on your next study day.</div>`;
  const next = allTopics().filter(x => !x.t.done && x.t.date > today()).sort((a, b) => a.t.date.localeCompare(b.t.date))[0];
  return `<div class="card empty"><b>Nothing planned for today</b>${next ? `Next up: ${esc(next.t.name)} (${esc(next.s.name)}) on ${fmtW(next.t.date)}.` : "Add chapters to fill your plan."}
    <div class="row">${next ? `<button class="btn" data-act="pull" data-sid="${next.s.id}" data-tid="${next.t.id}">Do it today instead</button>` : `<button class="btn" data-act="quickadd" data-day="${today()}">${I.plus}Add chapters</button>`}</div></div>`;
}
function subjectNeedsLook(s) {
  const t = today();
  return s.due > state.deadline || s.topics.some(x => !x.done && (!x.date || x.date < t || x.date > s.due));
}
function vSubjects() {
  const cards = state.subjects.map((s, k) => {
    const pr = progress(s.topics), C = 2 * Math.PI * 28, complete = pr.n && pr.p === 100;
    return `<button class="subj rise" style="--sc:${s.color};--i:${k + 2}" data-act="edit" data-sid="${s.id}" data-flip="s-${s.id}">
      <div class="subtop"><div class="ring"><svg viewBox="0 0 64 64"><circle class="trk" cx="32" cy="32" r="28"/><circle class="val" cx="32" cy="32" r="28" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${C.toFixed(2)}" data-anim="ring-${s.id}" data-kind="ring" data-c="${C.toFixed(2)}" data-val="${pr.p}"/></svg><span>${pr.p}%</span></div>
      <div style="min-width:0"><h3>${esc(s.name)}</h3><div class="meta">${pr.n ? `${pr.d} of ${plural(pr.n, "chapter")} done` : "No chapters yet. Tap to add."}</div></div></div>
      <div class="subfoot"><span class="chip${complete ? " ok" : ""}"><i></i>${complete ? "Complete" : `Finish by ${fmt(s.due)}`}</span>${!complete && subjectNeedsLook(s) ? `<span class="chip late">Needs a look</span>` : ""}</div></button>`;
  }).join("");
  return `${topbar(state.subjects.length ? plural(state.subjects.length, "subject") : "Start here", "Subjects")}${state.sample ? banner() : ""}
  <div class="subgrid">${cards}<button class="addcard rise" style="--i:${state.subjects.length + 2}" data-act="new" data-flip="addcard">${I.plus}Add a subject</button></div>`;
}

function vCalendar() {
  const t = today(), dl = state.deadline, days = byDay();
  if (!calMonth) calMonth = selDay.slice(0, 7);
  const [y, m] = calMonth.split("-").map(Number);
  const first = new Date(y, m - 1, 1), startOff = (first.getDay() + 6) % 7;
  const cells = [];
  for (let k = 0; k < 42; k++) cells.push(iso(new Date(y, m - 1, 1 - startOff + k)));
  const shown = cells.slice(0, cells[35].slice(0, 7) === calMonth ? 42 : 35);
  const grid = shown.map(d => {
    const l = days[d] || [], open = l.filter(x => !x.t.done).length;
    const cls = ["day", d.slice(0, 7) !== calMonth && "other", d < t && "past", d === t && "now", d === selDay && "sel", d > dl && "after", d === dl && "dead", isOff(d) && "off", d >= t && open > state.dailyLimit && "over"].filter(Boolean).join(" ");
    return `<button class="${cls}" data-act="pick" data-day="${d}" aria-label="${fmtL(d)}, ${plural(l.length, "chapter")}${isOff(d) ? ", day off" : ""}"><span class="d">${+d.slice(8)}</span><span class="dots">${l.slice(0, 8).map(x => `<i style="--sc:${x.s.color}"${x.t.done ? ' class="done"' : ""}></i>`).join("")}</span></button>`;
  }).join("");
  return `${topbar("Tap a day to see or plan it", "Calendar")}
  <div class="cal-layout">
  <section class="card rise" style="--i:1">
    <div class="calhead"><button class="iconbtn" data-act="mon" data-n="-1" aria-label="Previous month">${I.left}</button>
      <div style="text-align:center"><h2>${first.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>${calMonth !== t.slice(0, 7) ? `<button class="today-btn" data-act="pick" data-day="${t}">Back to today</button>` : ""}</div>
      <button class="iconbtn" data-act="mon" data-n="1" aria-label="Next month">${I.right}</button></div>
    <div class="calgrid" id="calgrid">${DOW.map(x => `<div class="dow">${x}</div>`).join("")}${grid}</div>
    <div class="legend"><span><b style="background:var(--hl)"></b>Today</span><span><b style="background:repeating-linear-gradient(135deg,var(--line-strong) 0 3px,transparent 3px 6px)"></b>Day off</span><span><b class="endtag">END</b>Deadline</span></div>
  </section>
  ${dayPanel()}
  </div>`;
}
function dayPanel() {
  const d = selDay, l = byDay()[d] || [], wOff = state.offWeekdays.includes(wd(d)), dOff = state.offDates.includes(d), off = wOff || dOff;
  return `<section class="daypanel rise" style="--i:2">
    <div class="sechead"><div><p class="label">${rel(d)}</p><h2>${fmtL(d)}</h2></div></div>
    <div class="dayactions"><button class="btn sm" data-act="quickadd" data-day="${d}">${I.plus}Add chapters</button>
      <button class="toggle" data-act="dayoff" aria-pressed="${off}" ${wOff ? "disabled" : ""}>${I.moon}${off ? "Day off" : "Make it a day off"}</button></div>
    ${wOff ? `<p class="hint">You don't study on ${DOW[wd(d)]}s. Change this in Settings › Days you study.</p>` : ""}
    ${l.length ? `<div class="card tasks">${l.map(x => taskRow(x, { drag: 1 })).join("")}</div><p class="hint">Tip: drag <span class="kbd">${I.grip}</span> onto another day to move a chapter.</p>`
      : `<div class="card empty">${d > state.deadline ? "This day is after your deadline." : off ? "A day off. Nothing planned." : "Nothing planned for this day."}</div>`}
  </section>`;
}

/* ---------- render + motion ---------- */
const prevVals = {};
function animateValues(root) {
  $$("[data-anim]", root).forEach(el => {
    const key = el.dataset.anim, kind = el.dataset.kind, to = +el.dataset.val, from = prevVals[key] ?? 0;
    prevVals[key] = to;
    const apply = v => {
      if (kind === "bar") el.style.width = v + "%";
      else if (kind === "ring") el.style.strokeDashoffset = (+el.dataset.c * (1 - v / 100)).toFixed(2);
      else el.textContent = Math.round(v);
    };
    if (reduced() || from === to) { apply(to); return; }
    if (kind === "num") {
      const t0 = performance.now(), dur = 800;
      const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); apply(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
      apply(from); requestAnimationFrame(step);
    } else {
      el.style.transition = "none"; apply(from); el.getBoundingClientRect(); el.style.transition = "";
      requestAnimationFrame(() => requestAnimationFrame(() => apply(to)));
      if (kind === "bar" && to > from) { const b = el.parentElement; b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
    }
  });
  const cp = $(".count-pill", root);
  if (cp) { const n = +cp.dataset.n; if (prevVals.todoDone !== undefined && n > prevVals.todoDone && !reduced()) cp.classList.add("pop"); prevVals.todoDone = n; }
}
/* FLIP: when the screen redraws in place, rows and cards glide from where they were,
   new ones fade in and removed ones fade out, instead of jumping. */
const EASE = "cubic-bezier(.2,.8,.2,1)";
function flipSnapshot(root) {
  const m = new Map();
  $$("[data-flip]", root).forEach(el => m.set(el.dataset.flip, { rect: el.getBoundingClientRect(), el }));
  return m;
}
function flipPlay(root, before) {
  if (!before || reduced() || !document.body.animate) return;
  const seen = new Set();
  $$("[data-flip]", root).forEach(el => {
    const k = el.dataset.flip, b = before.get(k);
    seen.add(k);
    if (!b) { el.animate([{ opacity: 0, transform: "translateY(10px) scale(.98)" }, { opacity: 1, transform: "none" }], { duration: 340, easing: EASE }); return; }
    const a = el.getBoundingClientRect(), dx = b.rect.left - a.left, dy = b.rect.top - a.top;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], { duration: 420, easing: EASE });
  });
  before.forEach((b, k) => {
    if (seen.has(k) || !b.rect.height || b.rect.bottom < 0 || b.rect.top > innerHeight) return;
    const g = b.el.cloneNode(true);
    g.removeAttribute("data-flip"); g.classList.add("exit-ghost");
    Object.assign(g.style, { left: b.rect.left + "px", top: b.rect.top + "px", width: b.rect.width + "px", height: b.rect.height + "px" });
    document.body.appendChild(g);
    g.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.94)" }], { duration: 260, easing: EASE }).onfinish = () => g.remove();
  });
}
function render(enter = false) {
  if (!state) return;
  const v = $("#view");
  const before = enter ? null : flipSnapshot(v);
  v.classList.toggle("wide", view === "calendar");
  v.innerHTML = view === "today" ? vToday() : view === "calendar" ? vCalendar() : vSubjects();
  if (enter && !reduced()) { v.classList.add("animate-in"); clearTimeout(render.t); render.t = setTimeout(() => v.classList.remove("animate-in"), 900); }
  animateValues(v);
  flipPlay(v, before);
  updateNav();
}
function updateNav() {
  $$(".tab").forEach(b => b.setAttribute("aria-current", b.dataset.view === view ? "page" : "false"));
  placeIndicator();
  const f = $("#railFoot");
  if (f && state) f.textContent = `${plural(Math.max(0, diff(today(), state.deadline)), "day")} until ${fmt(state.deadline, { day: "numeric", month: "long" })}`;
}
function placeIndicator() {
  const rail = $("#rail"), tab = $(`.tab[data-view="${view}"]`), ind = $("#indicator");
  if (!rail || !tab || !ind || $("#shell").hidden) return;
  const rr = rail.getBoundingClientRect(), tr = tab.getBoundingClientRect();
  ind.style.width = tr.width + "px"; ind.style.height = tr.height + "px";
  ind.style.transform = `translate(${tr.left - rr.left}px,${tr.top - rr.top}px)`;
  if (!ind.classList.contains("ready")) requestAnimationFrame(() => ind.classList.add("ready"));
}
function go(next, opts = {}) {
  const same = next === view;
  document.documentElement.dataset.dir = TABS.indexOf(next) >= TABS.indexOf(view) ? "fwd" : "back";
  view = next;
  try { history.replaceState(null, "", "#" + next); } catch (e) {}
  const swap = () => render(!same);
  if (!same && document.startViewTransition && !reduced()) document.startViewTransition(swap);
  else swap();
  if (!opts.keepScroll) scrollTo({ top: 0, behavior: reduced() || !same ? "auto" : "smooth" });
}

/* ---------- toast + confetti ---------- */
let toastT;
function toast(msg, o = {}) {
  const el = $("#toast");
  el.innerHTML = `<span>${esc(msg)}</span>${o.undo ? `<button data-t="undo">Undo</button>` : o.action ? `<button data-t="act">${esc(o.action.label)}</button>` : ""}`;
  el.onclick = e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.t === "undo") undo(); else o.action.fn(); el.classList.remove("show"); };
  el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), o.undo || o.action ? 5500 : 2600);
}
function burst(x, y, colors) {
  if (reduced()) return;
  const cv = $("#fx"), ctx = cv.getContext("2d"), dpr = devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const pal = [...colors, "#FFE14D", "#2747D9", "#0E9F8E"];
  const ps = Array.from({ length: 70 }, () => { const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 7; return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, r: Math.random() * 6, w: 5 + Math.random() * 5, h: 3 + Math.random() * 4, c: pal[Math.floor(Math.random() * pal.length)], s: (Math.random() - .5) * .4, life: 1 }; });
  const step = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = false;
    ps.forEach(p => {
      p.vy += .32; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.s; p.life -= .012;
      if (p.life > 0 && p.y < innerHeight + 20) { alive = true; ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); }
    });
    if (alive) requestAnimationFrame(step); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  requestAnimationFrame(step);
}

/* ---------- actions on chapters ---------- */
let rerenderT;
function toggle(row) {
  const f = findTopic(row.dataset.sid, row.dataset.tid); if (!f) return;
  const { s, t } = f;
  t.done = !t.done;
  if (t.done) t.doneOn = today(); else delete t.doneOn;
  save();
  row.classList.add("just"); row.classList.toggle("done", t.done);
  row.querySelector(".check").setAttribute("aria-pressed", t.done);
  if (t.done) {
    haptic();
    const r = row.querySelector(".check").getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    floatText("+1", cx, r.top, s.color);
    const td = byDay()[today()] || [];
    if (s.topics.every(x => x.done)) { burst(cx, cy, [s.color]); haptic("success"); toast(`${s.name} is complete. Every chapter done!`); }
    else if (t.date === today() && td.length > 1 && td.every(x => x.t.done)) { burst(cx, cy, [s.color]); haptic("success"); toast("Everything planned for today is done"); }
  }
  clearTimeout(rerenderT);
  rerenderT = setTimeout(() => render(), reduced() ? 0 : 700);
}
function moveTopic(sid, tid, d) {
  const f = findTopic(sid, tid); if (!f || f.t.date === d) return;
  snap(); f.t.date = d; save(); haptic("medium");
  selDay = d; render();
  toast(`Moved to ${fmtW(d)}${isOff(d) ? " (a day off)" : ""}`, { undo: true });
}
function fixPlan() {
  const items = needsPlan();
  if (!items.length) { toast("Your plan already looks good"); return; }
  snap(); const n = autoPlan(items); save(); render(); haptic("medium");
  toast(`Rescheduled ${plural(n, "chapter")}`, { undo: true });
}

/* ---------- drag a chapter onto a calendar day ---------- */
let drag = null;
document.addEventListener("pointerdown", e => {
  const g = e.target.closest("[data-drag]"); if (!g || e.button > 0) return;
  const row = g.closest(".task"), r = row.getBoundingClientRect();
  e.preventDefault();
  const ghost = row.cloneNode(true);
  ghost.classList.add("drag-ghost"); ghost.removeAttribute("data-tid");
  Object.assign(ghost.style, { width: r.width + "px", left: r.left + "px", top: r.top + "px" });
  document.body.appendChild(ghost);
  row.classList.add("dragging");
  drag = { row, ghost, sid: row.dataset.sid, tid: row.dataset.tid, ox: e.clientX, oy: e.clientY, over: null, y: e.clientY, id: e.pointerId };
  try { g.setPointerCapture(e.pointerId); } catch (err) {}
  haptic();
  const scroll = () => { if (!drag) return; if (drag.y < 90) scrollBy(0, -12); else if (drag.y > innerHeight - 110) scrollBy(0, 12); requestAnimationFrame(scroll); };
  requestAnimationFrame(scroll);
});
document.addEventListener("pointermove", e => {
  if (!drag || e.pointerId !== drag.id) return;
  drag.y = e.clientY;
  drag.ghost.style.transform = `translate(${e.clientX - drag.ox}px,${e.clientY - drag.oy}px) rotate(-2deg) scale(1.03)`;
  const over = document.elementFromPoint(e.clientX, e.clientY)?.closest(".day") || null;
  if (over !== drag.over) { drag.over?.classList.remove("drop"); drag.over = over; if (over) { over.classList.add("drop"); haptic(); } }
});
function endDrag(e) {
  if (!drag || (e && e.pointerId !== drag.id)) return;
  const { over, ghost, row, sid, tid } = drag; drag = null;
  ghost.remove(); row.classList.remove("dragging"); over?.classList.remove("drop");
  if (over && e.type === "pointerup") moveTopic(sid, tid, over.dataset.day);
}
document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", endDrag);

/* ---------- swipe a chapter: right = done (or undo), left = next study day ---------- */
const SWIPE_AT = 90;
let swipe = null, swallowClick = false;
document.addEventListener("pointerdown", e => {
  if (e.button > 0 || drag) return;
  const row = e.target.closest(".task");
  if (!row || !row.dataset.tid || e.target.closest("[data-drag], .check")) return;
  swipe = { row, x0: e.clientX, y0: e.clientY, dx: 0, on: false, id: e.pointerId, armed: false };
});
document.addEventListener("pointermove", e => {
  if (!swipe || e.pointerId !== swipe.id) return;
  const dx = e.clientX - swipe.x0, dy = e.clientY - swipe.y0, { row } = swipe;
  if (!swipe.on) {
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { swipe = null; return; }
    if (Math.abs(dx) < 12) return;
    swipe.on = true;
    try { row.setPointerCapture(e.pointerId); } catch (err) {}
    const done = row.classList.contains("done");
    const under = document.createElement("div");
    under.className = "swipe-under";
    under.innerHTML = `<span class="sw-right">${I.tick.replace("<svg", '<svg style="fill:none;stroke:currentColor;stroke-width:3"')}${done ? "Not done" : "Done"}</span><span class="sw-left">${done ? "" : `Next day${I.right}`}</span>`;
    Object.assign(under.style, { top: row.offsetTop + "px", height: row.offsetHeight + "px" });
    row.parentElement.insertBefore(under, row);
    swipe.under = under; swipe.done = done;
    row.classList.add("swiping");
  }
  const lim = swipe.done && dx < 0 ? 0 : dx;            // finished chapters only swipe right
  swipe.dx = lim;
  row.style.transform = `translateX(${lim}px)`;
  swipe.under.dataset.dir = lim > 0 ? "right" : "left";
  swipe.under.style.setProperty("--p", Math.min(1, Math.abs(lim) / SWIPE_AT));
  const armed = Math.abs(lim) >= SWIPE_AT;
  if (armed !== swipe.armed) { swipe.armed = armed; swipe.under.classList.toggle("armed", armed); if (armed) haptic(); }
});
function endSwipe(e) {
  if (!swipe || (e && e.pointerId !== swipe.id)) return;
  const sw = swipe; swipe = null;
  if (!sw.on) return;
  swallowClick = true; setTimeout(() => { swallowClick = false; }, 350);
  const { row, under, dx } = sw;
  const commit = e.type === "pointerup" && Math.abs(dx) >= SWIPE_AT;
  row.classList.remove("swiping");
  if (!commit) {
    row.style.transition = "transform .45s var(--spring)"; row.style.transform = "";
    setTimeout(() => { row.style.transition = ""; under.remove(); }, 460);
    return;
  }
  const out = dx > 0 ? row.offsetWidth : -row.offsetWidth;
  const finish = () => {
    under.remove();
    if (dx > 0) { row.style.transform = ""; toggle(row); }
    else moveTopic(row.dataset.sid, row.dataset.tid, nextStudyDay(addDays(today(), 1)));
  };
  if (reduced() || !row.animate) { finish(); return; }
  row.animate([{ transform: `translateX(${dx}px)` }, { transform: `translateX(${out}px)`, opacity: dx > 0 ? 1 : 0 }], { duration: 220, easing: "cubic-bezier(.4,0,1,1)" }).onfinish = () => {
    if (dx > 0) row.animate([{ transform: `translateX(${out}px)` }, { transform: "none" }], { duration: 320, easing: EASE });
    finish();
  };
}
document.addEventListener("pointerup", endSwipe);
document.addEventListener("pointercancel", endSwipe);
document.addEventListener("click", e => { if (swallowClick && e.target.closest(".task")) { e.stopPropagation(); e.preventDefault(); } }, true);

/* ---------- touch feedback ---------- */
const RIPPLE_ON = ".btn, .tab, .tbody, .subj, .day, .addcard, .toggle, .seg button, .choice, .iconbtn:not(.avatar), .fab";
document.addEventListener("pointerdown", e => {
  if (reduced() || e.button > 0) return;
  const el = e.target.closest(RIPPLE_ON); if (!el || el.disabled) return;
  const r = el.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2;
  const dot = document.createElement("span");
  dot.className = "ripple";
  Object.assign(dot.style, { width: size + "px", height: size + "px", left: e.clientX - r.left - size / 2 + "px", top: e.clientY - r.top - size / 2 + "px" });
  el.classList.add("rp"); el.appendChild(dot);
  setTimeout(() => dot.remove(), 650);
}, { passive: true });
function floatText(text, x, y, color) {
  if (reduced() || !document.body.animate) return;
  const f = document.createElement("span");
  f.className = "float-text"; f.textContent = text;
  Object.assign(f.style, { left: x + "px", top: y + "px", color });
  document.body.appendChild(f);
  f.animate([{ opacity: 0, transform: "translate(-50%,0) scale(.6)" }, { opacity: 1, transform: "translate(-50%,-18px) scale(1.15)", offset: .3 }, { opacity: 0, transform: "translate(-50%,-46px) scale(1)" }], { duration: 900, easing: EASE }).onfinish = () => f.remove();
}

/* ---------- sheets ---------- */
let sheetCtx = null, draft = null;
function openSheet(html, opts = {}) {
  $$("#sheetRoot .scrim").forEach(n => n.remove());
  sheetCtx?.onClose?.();
  const root = $("#sheetRoot");
  root.insertAdjacentHTML("beforeend", `<div class="scrim" id="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle"><div class="grab" aria-hidden="true"></div>${html}</div></div>`);
  const sc = $("#scrim"), sheet = $(".sheet", sc);
  [...sheet.children].forEach((c, i) => c.style.setProperty("--k", i));
  sc.addEventListener("click", e => { if (e.target === sc) closeSheet(); });
  document.body.classList.add("locked");
  requestAnimationFrame(() => requestAnimationFrame(() => sc.classList.add("open")));
  sheetCtx = { onClose: opts.onClose, opener: document.activeElement };
  sheet.tabIndex = -1;
  setTimeout(() => (opts.focus && $(opts.focus, sc) || sheet).focus({ preventScroll: true }), 380);
  dragToDismiss(sheet);
}
function closeSheet() {
  const sc = $("#scrim"); if (!sc) return;
  const ctx = sheetCtx; sheetCtx = null; ctx?.onClose?.();
  if (ctx?.opener?.isConnected) ctx.opener.focus({ preventScroll: true });
  sc.id = ""; const sheet = $(".sheet", sc); sheet.style.transform = "";
  sc.classList.remove("open"); document.body.classList.remove("locked");
  setTimeout(() => sc.remove(), reduced() ? 0 : 420);
}
function dragToDismiss(sheet) {
  let y0 = null, dy = 0, t0 = 0;
  sheet.addEventListener("pointerdown", e => {
    if (innerWidth >= 700 || !e.target.closest(".grab,.sheethead") || e.target.closest("button,input,select,textarea,a")) return;
    y0 = e.clientY; dy = 0; t0 = performance.now(); sheet.style.transition = "none";
    try { sheet.setPointerCapture(e.pointerId); } catch (err) {}
  });
  sheet.addEventListener("pointermove", e => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); sheet.style.transform = `translateY(${dy}px)`; });
  const end = () => {
    if (y0 === null) return; y0 = null; sheet.style.transition = "";
    if (dy > 110 || dy / (performance.now() - t0) > .6) closeSheet(); else sheet.style.transform = "";
  };
  sheet.addEventListener("pointerup", end); sheet.addEventListener("pointercancel", end);
}
const sheetHead = (title, label) => `<div class="sheethead"><div>${label ? `<p class="label">${esc(label)}</p>` : ""}<h2 id="sheetTitle">${esc(title)}</h2></div><button class="iconbtn" data-act="close" aria-label="Close">${I.close}</button></div>`;
const swatches = cur => `<div class="swatches">${COLORS.map(c => `<button type="button" class="sw" style="--c:${c}" data-act="color" data-c="${c}" aria-pressed="${c === cur}" aria-label="Colour ${c}"></button>`).join("")}</div>`;

/* subject editor */
function subjectSheet(sid) {
  const s = sid ? subj(sid) : null;
  draft = s ? JSON.parse(JSON.stringify(s)) : { id: uid(), name: "", color: nextColor(), due: state.deadline < today() ? today() : state.deadline, focusSec: 0, topics: [] };
  draft._new = !s;
  openSheet(`${sheetHead(draft._new ? "New subject" : draft.name, draft._new ? "" : "Edit subject")}
    <div class="row2"><div class="field"><label for="s-name">Subject name</label><input class="input" id="s-name" value="${esc(draft.name)}" placeholder="e.g. Physics" autocomplete="off" maxlength="80"></div>
    <div class="field"><label for="s-due">Finish by</label><input class="input" type="date" id="s-due" value="${draft.due}"><p class="hint" id="s-due-note" ${draft.due > state.deadline ? "" : "hidden"}>After your final deadline (${fmt(state.deadline)}). You can move the deadline when you save.</p></div></div>
    <div class="field"><span class="flabel">Colour</span>${swatches(draft.color)}</div>
    <div class="field"><div class="sechead"><span class="flabel">Chapters</span><span class="hint num" id="tcount"></span></div>
      <div class="tlist" id="tlist"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
        <input class="input" id="newtopic" placeholder="Add chapters: type and press Enter (commas add several)" style="flex:1;min-width:180px" autocomplete="off">
        <button class="btn ghost sm" data-act="addtopic">${I.plus}Add</button></div>
      <button class="btn ghost sm" data-act="spread" style="align-self:flex-start">${I.wand}Spread the dates for me</button>
      <p class="hint">Gives each unfinished chapter its own study day before the finish date.</p></div>
    <div class="sheetfoot">${draft._new ? "" : `<button class="btn danger sm" data-act="delsubj">${I.trash}Delete subject</button>`}
      <div class="r"><button class="btn ghost" data-act="close">Cancel</button><button class="btn" data-act="savesubj">Save</button></div></div>`,
    { focus: s ? null : "#s-name" });
  refreshTopics();
}
function refreshTopics(newIds = []) {
  const box = $("#tlist"); if (!box) return;
  box.innerHTML = draft.topics.length ? draft.topics.map(t => `<div class="trow${newIds.includes(t.id) ? " new" : ""}" data-tid="${t.id}">
    <input type="checkbox" id="d-${t.id}" ${t.done ? "checked" : ""} aria-label="Done">
    <input class="input" id="n-${t.id}" value="${esc(t.name)}" aria-label="Chapter name" placeholder="Chapter name">
    <input class="input${t.date && t.date > draft.due ? " late" : ""}" type="date" id="t-${t.id}" value="${t.date}" aria-label="Date for ${esc(t.name)}">
    <button type="button" class="x" data-act="rmtopic" aria-label="Remove chapter">${I.trash}</button></div>`).join("")
    : `<p class="hint">No chapters yet. Add them below, then plan their dates.</p>`;
  $("#tcount").textContent = draft.topics.length ? `${draft.topics.filter(t => t.done).length}/${draft.topics.length} done` : "";
}
function readDraft() {
  const sc = $("#scrim"); if (!sc || !draft || !$("#s-name", sc)) return;
  draft.name = $("#s-name", sc).value;
  draft.due = $("#s-due", sc).value || draft.due;
  draft.topics.forEach(t => { const n = $("#n-" + t.id, sc); if (n) { t.name = n.value; t.date = $("#t-" + t.id, sc).value; t.done = $("#d-" + t.id, sc).checked; } });
}
function addTopicsFromInput() {
  const inp = $("#newtopic"); if (!inp) return;
  readDraft();
  const names = inp.value.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
  if (!names.length) { inp.focus(); return; }
  const ids = names.map(n => { const t = { id: uid(), name: n, date: "", done: false }; draft.topics.push(t); return t.id; });
  inp.value = ""; refreshTopics(ids); inp.focus(); haptic();
}

/* chapter editor */
function topicSheet(sid, tid) {
  const f = findTopic(sid, tid); if (!f) return;
  const { s, t } = f;
  const quick = [["Today", today()], ["Tomorrow", addDays(today(), 1)], ["Next free day", nextStudyDay(addDays(t.date && t.date >= today() ? t.date : today(), 1))]];
  openSheet(`${sheetHead(t.name, s.name)}
    <div class="field"><label for="c-name">Chapter name</label><input class="input" id="c-name" value="${esc(t.name)}" autocomplete="off" maxlength="120"></div>
    <div class="field"><label for="c-date">When will you study it?</label><input class="input" type="date" id="c-date" value="${t.date}">
      <div class="seg" aria-label="Quick dates">${quick.map(([l, d]) => `<button type="button" data-act="qdate" data-day="${d}">${l}</button>`).join("")}<button type="button" data-act="qdate" data-day="">No date</button></div></div>
    <label class="card switchrow" style="box-shadow:none"><span><b>Done</b><small>${t.doneOn ? `Finished ${fmtW(t.doneOn)}` : "Switch on when you've finished it."}</small></span><input type="checkbox" class="switch" id="c-done" ${t.done ? "checked" : ""}></label>
    <button class="btn ghost" data-act="focus" data-sid="${s.id}" data-tid="${t.id}">${I.timer}Start a focus timer</button>
    <details class="more"><summary>More options</summary><div class="field" style="margin-top:10px"><label for="c-sub">Move to another subject</label><select class="input" id="c-sub">${state.subjects.map(x => `<option value="${x.id}"${x.id === s.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select></div></details>
    <div class="sheetfoot"><button class="btn danger sm" data-act="deltopic" data-sid="${s.id}" data-tid="${t.id}">${I.trash}Delete</button>
      <div class="r"><button class="btn ghost" data-act="close">Cancel</button><button class="btn" data-act="savetopic" data-sid="${s.id}" data-tid="${t.id}">Save</button></div></div>`);
}

/* quick add */
function quickAddSheet(day) {
  if (!state.subjects.length) { subjectSheet(null); return; }
  openSheet(`${sheetHead("Add chapters")}
    <div class="field"><label for="q-sub">Subject</label><select class="input" id="q-sub">${state.subjects.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}<option value="__new">+ New subject…</option></select></div>
    <div class="field" id="q-newwrap" hidden><label for="q-new">New subject name</label><input class="input" id="q-new" placeholder="e.g. Chemistry" autocomplete="off" maxlength="80"></div>
    <div class="field"><label for="q-names">Chapters</label><textarea class="input" id="q-names" maxlength="8000" placeholder="One per line, for example:&#10;Chapter 1&#10;Chapter 2"></textarea></div>
    <div class="field"><span class="flabel">When will you study them?</span><div class="seg" id="q-when">
      <button type="button" data-act="qwhen" data-w="auto" aria-pressed="${!day}">Spread them out for me</button>
      <button type="button" data-act="qwhen" data-w="day" aria-pressed="${!!day}">All on one day</button>
      <button type="button" data-act="qwhen" data-w="none" aria-pressed="false">Decide later</button></div>
      <input class="input" type="date" id="q-date" value="${day || today()}" ${day ? "" : "hidden"}></div>
    <div class="sheetfoot"><div class="r"><button class="btn ghost" data-act="close">Cancel</button><button class="btn" data-act="quicksave">${I.plus}Add</button></div></div>`, { focus: "#q-names" });
}

/* final deadline */
function deadlineSheet() {
  openSheet(`${sheetHead("Final deadline")}
    <p class="hint">The countdown, warnings and auto-planning all work towards this date.</p>
    <div class="field"><label for="dl-date">Finish everything by</label><input class="input" type="date" id="dl-date" value="${state.deadline}"></div>
    <label class="card switchrow" style="box-shadow:none"><span><b>Move subject dates too</b><small>Subjects due after the new date will finish on it instead.</small></span><input type="checkbox" class="switch" id="dl-move" checked></label>
    <div class="sheetfoot"><div class="r"><button class="btn ghost" data-act="close">Cancel</button><button class="btn" data-act="savedeadline">Save</button></div></div>`, { focus: "#dl-date" });
}

/* settings */
function settingsSheet() {
  openSheet(`${sheetHead("Settings")}
    <div class="group first"><h3>Your plan</h3>
      <div class="field"><label for="g-dl">Final deadline</label><input class="input" type="date" id="g-dl" value="${state.deadline}"></div>
      <div class="field"><span class="flabel">Days you study</span><div class="seg daychips" id="g-days">${DOW.map((d, i) => `<button type="button" data-act="wdtoggle" data-wd="${i}" aria-pressed="${!state.offWeekdays.includes(i)}">${d}</button>`).join("")}</div>
        <p class="hint">Chapters are only planned on these days. Mark single days off in the calendar.</p></div>
      <div class="field"><label for="g-lim">Most chapters in one day</label><input class="input" type="number" min="1" max="20" id="g-lim" value="${state.dailyLimit}" style="max-width:120px"></div></div>
    <div class="group"><h3>Look</h3><div class="seg" id="g-theme">${[["system", "Match my phone"], ["light", "Light"], ["dark", "Dark"]].map(([t, l]) => `<button type="button" data-act="theme" data-t="${t}" aria-pressed="${ui.theme === t}">${l}</button>`).join("")}</div></div>
    <details class="more group"><summary>More: backup, about, start over</summary>
      <div class="field" style="margin-top:12px"><span class="flabel">Backup</span><p class="hint">${Sync.user() ? "Your plan is synced to your account. A backup code is an extra copy you can paste anywhere." : "Copy this code to move your plan to another device without an account."}</p>
        <textarea class="input num" id="g-backup" rows="3" style="font-size:12px" placeholder="Paste a backup code here to restore it"></textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost sm" data-act="copybackup">Copy backup code</button><button class="btn ghost sm" data-act="restore">Restore from code</button></div></div>
      <p class="hint" style="margin-top:12px">Countdown Study Planner ${APP_VERSION}. No ads, no tracking.</p>
      <p class="legal-links"><a href="privacy.html">Privacy policy</a><a href="terms.html">Terms</a><a href="cookies.html">Cookies and storage</a></p>
      <button class="btn danger sm" data-act="reset" style="margin-top:12px">Start over</button></details>
    <div class="sheetfoot"><div class="r"><button class="btn ghost" data-act="close">Cancel</button><button class="btn" data-act="savesettings">Save</button></div></div>`);
}

/* account */
let pendingEmail = "";
function accountSheet() {
  const inf = Sync.info(), u = inf.user;
  if (!Sync.enabled) {
    openSheet(`${sheetHead("Account")}<p>Accounts aren't switched on in this version of the app. Your plan is saved on this device. Use <b>Settings › Backup</b> to move it to another device.</p>`);
    return;
  }
  if (u) {
    const last = inf.lastSync ? new Date(inf.lastSync).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : null;
    openSheet(`${sheetHead("Account")}
      <div class="acct"><div class="big-av">${esc((u.email || "?")[0].toUpperCase())}</div><div style="min-width:0"><b style="overflow-wrap:anywhere">${esc(u.email || "Signed in")}</b><p class="hint">${SYNC_TEXT[inf.status]?.[1] || ""}${last ? ` · last synced ${last}` : ""}</p></div></div>
      <p class="hint">Your plan is saved to your account and stays in step on every device where you sign in. It also stays on this device, so the app works offline.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" data-act="syncnow">Sync now</button><button class="btn ghost" data-act="signout">Sign out</button></div>
      <div class="group"><h3>Delete account</h3><p class="hint">Permanently deletes your account and the plan saved in it. The copy on this device stays until you choose Start over.</p>
      <button class="btn danger sm" data-act="delaccount" style="align-self:flex-start">Delete my account</button></div>`);
    return;
  }
  const prov = Sync.providers();
  openSheet(`${sheetHead("Sign in", "Keep your plan safe")}
    <p class="hint">Sign in to back up your plan and use it on your phone and computer. You can keep using the app without an account.</p>
    <label class="consent"><input type="checkbox" id="a-consent" ${ui.consentAt ? "checked" : ""}><span>I agree to the <a href="terms.html">Terms</a> and <a href="privacy.html">Privacy Policy</a>, and I'm 18 or older or my parent or guardian has agreed.</span></label>
    ${prov.includes("apple") ? `<button class="btn provider" data-act="oauth" data-p="apple">${I.apple}Continue with Apple</button>` : ""}
    ${prov.includes("google") ? `<button class="btn provider" data-act="oauth" data-p="google">${I.google}Continue with Google</button>` : ""}
    ${prov.includes("email") ? `${prov.length > 1 ? `<div class="or">or use your email</div>` : ""}
    <div id="emailStep" ${pendingEmail ? "hidden" : ""}><div class="field"><label for="a-email">Email</label><input class="input" type="email" id="a-email" autocomplete="email" maxlength="254" inputmode="email" placeholder="you@example.com" value="${esc(pendingEmail)}"></div>
      <button class="btn wide" data-act="sendcode" style="margin-top:10px">${I.mail}Email me a sign-in link</button></div>
    <div id="codeStep" ${pendingEmail ? "" : "hidden"}>
      <div class="card pad" style="box-shadow:none;display:flex;flex-direction:column;gap:6px">${I.mail.replace("<svg", '<svg width="26" height="26" style="color:var(--accent)"')}<b>Check your email</b>
        <span class="hint">We sent a sign-in link to <b id="a-sent">${esc(pendingEmail)}</b>. Open it on this device and you'll come straight back here, signed in.</span></div>
      <details style="margin-top:12px"><summary class="hint" style="cursor:pointer">Got a 6-digit code instead?</summary>
        <div class="field" style="margin-top:8px"><label for="a-code">Code from the email</label><input class="input code" id="a-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8"></div>
        <button class="btn wide" data-act="verifycode" style="margin-top:10px">Sign in with code</button></details>
      <p class="hint" style="margin-top:10px">Nothing after a minute? Check spam, <button class="linkbtn" data-act="resend">send it again</button>, or <button class="linkbtn" data-act="changeemail">use a different email</button>.</p></div>` : ""}
    ${Sync.info().lastError ? `<p class="warn">${I.warn}<span>${esc(Sync.info().lastError)}</span></p>` : ""}`,
    { focus: prov.includes("email") ? (pendingEmail ? "#a-code" : null) : null });
}
function conflictSheet(remote, at) {
  const cnt = p => { const n = p.subjects.reduce((a, s) => a + s.topics.length, 0); return `${plural(p.subjects.length, "subject")}, ${plural(n, "chapter")}`; };
  const when = ms => new Date(ms).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  openSheet(`${sheetHead("Which plan do you want to keep?")}
    <p class="hint">Your account and this device have different plans. Pick one; the other is replaced.</p>
    <button class="choice" data-act="usecloud"><b>Plan from your account</b><span>${cnt(remote)} · changed ${when(at)}</span></button>
    <button class="choice" data-act="uselocal"><b>Plan on this device</b><span>${cnt(state)} · changed ${when(state.updatedAt)}</span></button>`,
    { onClose: () => { if (conflict) Sync.setStatus("error"); } });
  conflict = { remote, at };
}
let conflict = null;

/* focus timer */
let focus = null, audio = null;
const RING_C = 2 * Math.PI * 96;
function focusSheet(sid, tid) {
  const f = findTopic(sid, tid);
  focus = { sid, tid, dur: 25 * 60, remain: 25 * 60, endAt: null, iv: null, logged: 0 };
  openSheet(`${sheetHead(f ? f.t.name : "Study session", "Focus")}
    <div class="timer" id="ftimer" style="--sc:${f ? f.s.color : "var(--accent)"}"><svg viewBox="0 0 220 220"><circle class="trk" cx="110" cy="110" r="96"/><circle class="val" id="fring" cx="110" cy="110" r="96" stroke-dasharray="${RING_C.toFixed(1)}" stroke-dashoffset="0"/></svg>
      <div class="tread"><b class="num" id="ftime">25:00</b><span id="fstate">Ready when you are</span></div></div>
    <div class="seg" style="justify-content:center" id="fdurs">${[15, 25, 45, 60].map(m => `<button type="button" data-act="fdur" data-m="${m}" aria-pressed="${m === 25}">${m} min</button>`).join("")}</div>
    <div class="sheetfoot center"><button class="btn ghost" data-act="freset">${I.reset}Reset</button><button class="btn big" data-act="fgo" id="fgo">${I.play}Start</button></div>
    ${f && !f.t.done ? `<button class="btn ghost wide" data-act="fdone">${I.tick.replace("<svg", '<svg style="stroke:currentColor;fill:none;stroke-width:3"')}Mark chapter done</button>` : ""}`,
    { onClose: stopFocus });
}
function focusTick() {
  if (!focus) return;
  if (focus.endAt) focus.remain = Math.max(0, Math.round((focus.endAt - Date.now()) / 1000));
  const el = $("#ftime"); if (el) el.textContent = `${pad(Math.floor(focus.remain / 60))}:${pad(focus.remain % 60)}`;
  const ring = $("#fring"); if (ring) ring.style.strokeDashoffset = (RING_C * (1 - focus.remain / focus.dur)).toFixed(1);
  if (focus.endAt && focus.remain <= 0) focusComplete();
}
function setFocusUi(label, running) {
  $("#fstate") && ($("#fstate").textContent = label);
  $("#ftimer")?.classList.toggle("running", running);
  const b = $("#fgo"); if (b) b.innerHTML = running ? `${I.pause}Pause` : `${I.play}${focus.remain < focus.dur ? "Resume" : "Start"}`;
}
function logFocus() {
  if (!focus) return;
  const el = (focus.dur - focus.remain) - focus.logged;
  if (el < 20) return;
  focus.logged += el;
  const d = today(); state.focusLog[d] = (state.focusLog[d] || 0) + el;
  const s = subj(focus.sid); if (s) s.focusSec = (s.focusSec || 0) + el;
  save();
}
function beep() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    [0, .28, .56].forEach((t, i) => { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = i === 2 ? 880 : 660; o.connect(g); g.connect(audio.destination); const s = audio.currentTime + t; g.gain.setValueAtTime(.0001, s); g.gain.exponentialRampToValueAtTime(.25, s + .02); g.gain.exponentialRampToValueAtTime(.0001, s + .24); o.start(s); o.stop(s + .26); });
  } catch (e) {}
}
function focusComplete() {
  clearInterval(focus.iv); focus.endAt = null; focus.remain = 0; logFocus();
  beep(); haptic("success");
  const r = $("#ftimer")?.getBoundingClientRect(); if (r) burst(r.left + r.width / 2, r.top + r.height / 2, [getComputedStyle($("#ftimer")).getPropertyValue("--sc")]);
  toast(`Focus session done: ${Math.round(focus.dur / 60)} min`);
  focus.remain = focus.dur; focus.logged = 0;
  setFocusUi("Session complete. Take a short break.", false); focusTick();
}
function stopFocus() { if (!focus) return; clearInterval(focus.iv); if (focus.endAt) { focusTick(); logFocus(); } focus = null; render(); }

/* ---------- first run ---------- */
function welcomeAccountLine() {
  const el = $("#w-alt"); if (!el) return;
  const u = Sync.user();
  el.innerHTML = u ? `Signed in as <b>${esc(u.email || "you")}</b>. Your account has no plan yet, so set one up above and it saves to your account.`
    : `Already planning on another device? <button class="linkbtn" data-act="account">Sign in to load your plan</button>`;
}
function showApp() { $("#welcome").hidden = true; $("#shell").hidden = false; requestAnimationFrame(placeIndicator); }
/* First run: two short steps, one question each. Study days default to every day (Settings › Days you study). */
function welcome() {
  $("#shell").hidden = true;
  const w = $("#welcome"); w.hidden = false;
  const quick = [["In 2 weeks", 14], ["In 1 month", 30], ["In 2 months", 61], ["In 3 months", 91]];
  w.innerHTML = `<div class="welcome-in">
    <div class="wtop" style="--i:0"><img class="logo" src="icons/icon-192.png" alt=""><div class="wdots" aria-hidden="true"><i class="on"></i><i></i></div></div>
    <form class="wstep" id="wstep1" novalidate>
      <p class="label" style="--i:1">Step 1 of 2</p>
      <h1 style="--i:2">When do you need to <span class="mark">finish everything</span>?</h1>
      <p class="muted" style="--i:3">Pick your final deadline, like an exam date. You can change it any time.</p>
      <div class="card pad" style="--i:4">
        <label class="flabel" for="w-dl">Final deadline</label>
        <input class="input big-input" type="date" id="w-dl" min="${today()}" required>
        <div class="seg quickdates">${quick.map(([l, n]) => `<button type="button" data-days="${n}">${l}</button>`).join("")}</div>
      </div>
      <button class="btn big wide" type="submit" style="--i:5">Next</button>
    </form>
    <form class="wstep" id="wstep2" novalidate hidden>
      <p class="label">Step 2 of 2</p>
      <h1>What do you need to <span class="mark">study</span>?</h1>
      <p class="muted">Type your subjects, one per line. You'll add their chapters next.</p>
      <div class="card pad"><label class="flabel" for="w-subs">Your subjects</label><textarea class="input" id="w-subs" maxlength="2000" placeholder="One per line, or separated by commas"></textarea></div>
      <div class="wbtns"><button class="btn ghost" type="button" id="w-back">Back</button><button class="btn big" type="submit">Start planning</button></div>
    </form>
    <p class="alt" style="--i:6">Just looking? <button class="linkbtn" type="button" id="w-demo">Try an example plan</button></p>
    ${Sync.enabled ? `<p class="alt" id="w-alt" style="--i:7"></p>` : ""}
    <p class="legal-links" style="--i:8"><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="cookies.html">Cookies</a></p>
  </div>`;
  welcomeAccountLine();
  const dl = $("#w-dl"), s1 = $("#wstep1"), s2 = $("#wstep2");
  const step = (from, to, back) => {
    from.hidden = true; to.hidden = false;
    $$(".wdots i").forEach((d, i) => d.classList.toggle("on", i === (to === s2 ? 1 : 0)));
    if (!reduced()) to.animate([{ opacity: 0, transform: `translateX(${back ? -36 : 36}px)` }, { opacity: 1, transform: "none" }], { duration: 380, easing: EASE });
    haptic();
  };
  $(".quickdates").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    dl.value = addDays(today(), +b.dataset.days); dl.classList.remove("bad");
    $$(".quickdates button").forEach(x => x.setAttribute("aria-pressed", x === b)); haptic();
  });
  dl.addEventListener("input", () => $$(".quickdates button").forEach(x => x.setAttribute("aria-pressed", "false")));
  s1.addEventListener("submit", e => {
    e.preventDefault();
    if (!dl.value) { dl.classList.add("bad"); dl.focus(); toast("Pick your deadline first, or tap one of the quick choices"); return; }
    step(s1, s2); setTimeout(() => $("#w-subs").focus(), 200);
  });
  $("#w-back").addEventListener("click", () => step(s2, s1, true));
  s2.addEventListener("submit", e => {
    e.preventDefault();
    const names = $("#w-subs").value.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
    if (!names.length) { $("#w-subs").classList.add("bad"); $("#w-subs").focus(); toast("Add at least one subject"); return; }
    state = migrate({ deadline: dl.value, dailyLimit: 4, offWeekdays: [], subjects: names.map((n, i) => ({ id: uid(), name: n, color: COLORS[i % COLORS.length], due: dl.value, topics: [] })) });
    save(); showApp(); go("today");
    setTimeout(() => quickAddSheet(), reduced() ? 0 : 450);
  });
  $("#w-demo").addEventListener("click", () => {
    const end = dl.value || addDays(today(), 30), t = today(), clamp = s => s < t ? t : s;
    state = migrate({ deadline: end, dailyLimit: 4, offWeekdays: [], sample: true, subjects: [["Maths (example)", 0, -2, 6], ["History (example)", 1, 0, 4]].map(([n, c, o, k]) => ({ id: uid(), name: n, color: COLORS[c], due: clamp(addDays(end, o)), topics: Array.from({ length: k }, (_, i) => ({ id: uid(), name: `Chapter ${i + 1}`, date: "", done: false })) })) });
    autoPlan(allTopics()); save(); showApp(); go("today");
  });
}

/* ---------- sign-in + sync ---------- */
const strip = p => { const c = JSON.parse(JSON.stringify(p)); delete c.updatedAt; return JSON.stringify(c); };
let reconciling = false;
async function reconcile() {
  if (reconciling || !Sync.user()) return;
  reconciling = true;
  try {
    Sync.setStatus("syncing");
    let remote;
    try { remote = await Sync.pull(); } catch (e) { Sync.setStatus(navigator.onLine ? "error" : "offline"); return; }
    const syncedAt = Sync.syncedAt();
    const r = remote && migrate(remote.state);
    if (!r) { if (state) await Sync.push(state); Sync.setStatus("synced"); return; }
    if (!state) { adopt(r, remote.at, true); return; }
    if (strip(r) === strip(state)) { Sync.markSynced(remote.at); Sync.setStatus("synced"); return; }
    const localDirty = !syncedAt || state.updatedAt > syncedAt;
    const remoteChanged = !syncedAt || remote.at > syncedAt;
    if (localDirty && remoteChanged && !state.sample) { conflictSheet(r, remote.at); Sync.setStatus("pending"); return; }
    if (remoteChanged || state.sample) adopt(r, remote.at, false);
    else { await Sync.push(state); Sync.setStatus("synced"); }
  } catch (e) { Sync.setStatus("error"); }
  finally { reconciling = false; }
}
function adopt(r, at, fresh) {
  state = r; state.updatedAt = at; persist(); Sync.markSynced(at); Sync.setStatus("synced");
  if ($("#shell").hidden) { showApp(); go("today"); } else render();
  if (fresh) toast("Plan loaded from your account");
}
async function onSignedIn(user, evt) {
  if (ui.consentAt && state && !state.consent) { state.consent = { version: LEGAL_VERSION, at: ui.consentAt }; save(); }
  if ($("#scrim") && $("#a-email, #a-code")) closeSheet();
  pendingEmail = "";
  await reconcile();
  if (state && !$("#shell").hidden) render();
  if (evt === "SIGNED_IN" && Sync.user()) toast(`Signed in as ${Sync.user().email || "you"}`);
}
let shownError = "";
function updateSyncUi() {
  const err = Sync.info().lastError;
  if (err && err !== shownError && !Sync.user()) toast(err);
  shownError = err;
  welcomeAccountLine();
  const av = $('[data-act="account"].iconbtn');
  if (av && Sync.enabled) { const n = document.createElement("div"); n.innerHTML = avatarBtn(); av.replaceWith(n.firstElementChild); }
}

function authError(err, fallback) {
  const m = err?.message || "";
  if (/rate limit|too many|security purposes/i.test(m)) return "Too many sign-in emails were sent. Wait a while, then try again.";
  if (/invalid email|unable to validate email/i.test(m)) return "That email address doesn't look right.";
  if (/expired|invalid.*(otp|token)/i.test(m)) return "That code has expired or isn't right. Send a new one.";
  if (/fetch|network/i.test(m)) return "You're offline. Connect to the internet and try again.";
  if (m) console.warn("[sign-in]", m);
  return fallback;
}

/* Consent is recorded on this device and, once signed in, with the plan in the account. */
const LEGAL_VERSION = "2026-10-28";
function consentGiven() {
  const box = $("#a-consent");
  if (box?.checked) { ui.consentAt = ui.consentAt || Date.now(); saveUi(); return true; }
  box?.closest(".consent")?.classList.add("bad"); box?.focus();
  toast("Please tick the box to agree before signing in");
  return false;
}

/* ---------- theme ---------- */
const darkQuery = matchMedia("(prefers-color-scheme: dark)");
function applyTheme() {
  const root = document.documentElement;
  if (ui.theme === "light" || ui.theme === "dark") root.dataset.theme = ui.theme; else delete root.dataset.theme;
  // Phone status bar: dark icons on the light theme, light icons on the dark theme.
  const dark = ui.theme === "dark" || (ui.theme === "system" && darkQuery.matches);
  Plug.StatusBar?.setStyle?.({ style: dark ? "DARK" : "LIGHT" }).catch(() => {});
}
darkQuery.addEventListener?.("change", applyTheme);

function toggleDayOff() {
  const d = selDay, on = !state.offDates.includes(d);
  snap();
  state.offDates = state.offDates.filter(x => x !== d); if (on) state.offDates.push(d);
  save(); haptic();
  const open = (byDay()[d] || []).filter(x => !x.t.done);
  render();
  if (on && open.length) toast(`${plural(open.length, "chapter")} planned on this day`, { action: { label: "Move them", fn: () => { snap(); autoPlan(open); save(); render(); toast(`Moved ${plural(open.length, "chapter")}`, { undo: true }); } } });
  else toast(on ? `${fmtW(d)} is now a day off` : `${fmtW(d)} is a study day again`, { undo: true });
}

/* ---------- events ---------- */
document.addEventListener("click", async e => {
  const tab = e.target.closest(".tab"); if (tab) { haptic(); go(tab.dataset.view); return; }
  const b = e.target.closest("[data-act]"); if (!b || b.closest("#toast")) return;
  const a = b.dataset.act, sc = $("#scrim");
  switch (a) {
    case "toggle": toggle(b.closest(".task")); break;
    case "topic": { const r = b.closest(".task"); topicSheet(r.dataset.sid, r.dataset.tid); break; }
    case "edit": subjectSheet(b.dataset.sid); break;
    case "new": subjectSheet(null); break;
    case "quickadd": quickAddSheet(b.dataset.day); break;
    case "settings": settingsSheet(); break;
    case "account": accountSheet(); break;
    case "deadline": deadlineSheet(); break;
    case "close": closeSheet(); break;
    case "keep": state.sample = false; save(); render(); break;
    case "tipdone": ui.tipDone = true; saveUi(); render(); break;
    case "tab": haptic(); go(b.dataset.view); break;
    case "dayoff": toggleDayOff(); break;
    case "fixplan": closeSheet(); fixPlan(); break;
    case "gotoday": selDay = b.dataset.day; calMonth = selDay.slice(0, 7); haptic(); go("calendar"); break;
    case "pick": selDay = b.dataset.day; calMonth = selDay.slice(0, 7); haptic(); render(); break;
    case "mon": {
      const [y, m] = calMonth.split("-").map(Number); calMonth = iso(new Date(y, m - 1 + Number(b.dataset.n), 1)).slice(0, 7);
      document.documentElement.dataset.dir = b.dataset.n > 0 ? "fwd" : "back";
      document.startViewTransition && !reduced() ? document.startViewTransition(() => render()) : render();
      break;
    }
    case "pull": { const f = findTopic(b.dataset.sid, b.dataset.tid); if (f) { snap(); f.t.date = today(); save(); render(); toast(`${f.t.name} moved to today`, { undo: true }); } break; }

    /* subject sheet */
    case "color": if (draft) { draft.color = b.dataset.c; $$(".sw", sc).forEach(x => x.setAttribute("aria-pressed", x.dataset.c === draft.color)); haptic(); } break;
    case "addtopic": addTopicsFromInput(); break;
    case "rmtopic": readDraft(); draft.topics = draft.topics.filter(t => t.id !== b.closest(".trow").dataset.tid); refreshTopics(); break;
    case "spread": {
      readDraft();
      const open = draft.topics.filter(t => !t.done);
      if (!open.length) { toast("Add some unfinished chapters first"); break; }
      autoPlan(open.map(t => ({ s: draft, t }))); refreshTopics();
      $$("#tlist input[type=date]").forEach((x, i) => { x.classList.remove("flash"); void x.offsetWidth; x.classList.add("flash"); x.style.animationDelay = i * 40 + "ms"; });
      toast(`Dates planned up to ${fmt(draft.due)}`); haptic();
      break;
    }
    case "savesubj": {
      readDraft();
      const name = draft.name.trim();
      if (!name) { const n = $("#s-name"); n.classList.add("bad"); n.focus(); toast("Give the subject a name"); break; }
      draft.name = name; draft.topics = draft.topics.map(t => ({ ...t, name: t.name.trim() || "Untitled chapter" }));
      draft.topics.forEach(t => { if (t.done && !t.doneOn) t.doneOn = today(); if (!t.done) delete t.doneOn; });
      const isNew = draft._new; delete draft._new;
      snap();
      if (isNew) state.subjects.push(draft); else state.subjects = state.subjects.map(s => s.id === draft.id ? draft : s);
      state.sample = state.sample && !isNew;
      save(); closeSheet(); render(); haptic("success");
      if (draft.due > state.deadline) {
        const due = draft.due;
        toast(`${name} now finishes after your final deadline`, { action: { label: `Move deadline to ${fmt(due)}`, fn: () => { snap(); state.deadline = due; save(); render(); toast(`Final deadline: ${fmtL(due)}`, { undo: true }); } } });
      } else toast(isNew ? `${name} added` : `${name} saved`, { undo: true });
      break;
    }
    case "delsubj": {
      const n = draft.name; snap();
      state.subjects = state.subjects.filter(s => s.id !== draft.id);
      save(); closeSheet(); render(); haptic("medium"); toast(`${n || "Subject"} deleted`, { undo: true });
      break;
    }

    /* chapter sheet */
    case "qdate": { const d = $("#c-date"); d.value = b.dataset.day; d.classList.remove("flash"); void d.offsetWidth; d.classList.add("flash"); haptic(); break; }
    case "savetopic": {
      const f = findTopic(b.dataset.sid, b.dataset.tid); if (!f) break;
      snap();
      const name = $("#c-name").value.trim() || f.t.name, date = $("#c-date").value, done = $("#c-done").checked, to = $("#c-sub").value;
      Object.assign(f.t, { name, date }); if (done !== f.t.done) { f.t.done = done; if (done) f.t.doneOn = today(); else delete f.t.doneOn; }
      if (to !== f.s.id) { f.s.topics = f.s.topics.filter(x => x !== f.t); subj(to)?.topics.push(f.t); }
      save(); closeSheet(); render(); toast("Chapter saved", { undo: true });
      break;
    }
    case "deltopic": {
      const f = findTopic(b.dataset.sid, b.dataset.tid); if (!f) break;
      snap(); f.s.topics = f.s.topics.filter(x => x !== f.t); save(); closeSheet(); render(); haptic("medium");
      toast(`${f.t.name} deleted`, { undo: true });
      break;
    }
    case "focus": focusSheet(b.dataset.sid, b.dataset.tid); break;

    /* quick add */
    case "qwhen": $$("#q-when button").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#q-date").hidden = b.dataset.w !== "day"; break;
    case "quicksave": {
      const names = $("#q-names").value.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
      if (!names.length) { $("#q-names").classList.add("bad"); $("#q-names").focus(); toast("Type at least one chapter"); break; }
      let s;
      if ($("#q-sub").value === "__new") {
        const n = $("#q-new").value.trim(); if (!n) { $("#q-new").classList.add("bad"); $("#q-new").focus(); toast("Name the new subject"); break; }
        s = { id: uid(), name: n, color: nextColor(), due: state.deadline < today() ? today() : state.deadline, focusSec: 0, topics: [] };
        snap(); state.subjects.push(s);
      } else { snap(); s = subj($("#q-sub").value); }
      const mode = $("#q-when [aria-pressed=true]").dataset.w, day = $("#q-date").value;
      const added = names.map(n => ({ id: uid(), name: n, date: mode === "day" ? day : "", done: false }));
      s.topics.push(...added);
      if (mode === "auto") autoPlan(added.map(t => ({ s, t })));
      state.sample = false; save(); closeSheet(); render(); haptic("success");
      toast(`Added ${plural(added.length, "chapter")} to ${s.name}`, { undo: true });
      break;
    }

    /* deadline + settings */
    case "savedeadline": {
      const v = $("#dl-date").value; if (!isDate(v)) { $("#dl-date").classList.add("bad"); break; }
      snap(); state.deadline = v;
      if ($("#dl-move").checked) state.subjects.forEach(s => { if (s.due > v) s.due = v; });
      save(); closeSheet(); render(); toast(`Final deadline: ${fmtL(v)}`, { undo: true });
      break;
    }
    case "wdtoggle": b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); haptic(); break;
    case "theme": ui.theme = b.dataset.t; saveUi(); applyTheme(); $$("#g-theme button").forEach(x => x.setAttribute("aria-pressed", x === b)); break;
    case "savesettings": {
      snap();
      const dl = $("#g-dl").value, lim = parseInt($("#g-lim").value, 10);
      if (isDate(dl)) state.deadline = dl;
      if (lim > 0) state.dailyLimit = Math.min(20, lim);
      state.offWeekdays = $$("#g-days button").filter(x => x.getAttribute("aria-pressed") !== "true").map(x => +x.dataset.wd);
      save(); closeSheet(); render(); toast("Settings saved", { undo: true });
      break;
    }
    case "copybackup": {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(state)))), ta = $("#g-backup"); ta.value = code;
      const fail = () => { ta.focus(); ta.select(); toast("Code selected. Copy it now."); };
      try { navigator.clipboard.writeText(code).then(() => toast("Backup code copied"), fail); } catch (err) { fail(); }
      break;
    }
    case "restore": {
      let p = null; try { p = migrate(JSON.parse(decodeURIComponent(escape(atob($("#g-backup").value.trim()))))); } catch (err) {}
      if (!p) { $("#g-backup").classList.add("bad"); toast("That backup code isn't valid"); break; }
      snap(); state = p; save(); closeSheet(); render(); toast("Plan restored", { undo: true });
      break;
    }
    case "reset":
      if (!b.classList.contains("armed")) { b.classList.add("armed"); b.textContent = "Tap again to erase this plan"; setTimeout(() => { if (b.isConnected) { b.classList.remove("armed"); b.textContent = "Start over"; } }, 3500); break; }
      closeSheet(); state = null; try { localStorage.removeItem(LS); } catch (err) {} welcome();
      break;

    /* account */
    case "oauth": if (!consentGiven()) break; try { b.disabled = true; await Sync.oauth(b.dataset.p); } catch (err) { toast(authError(err, "Couldn't start sign-in")); } finally { b.disabled = false; } break;
    case "sendcode": {
      if (!consentGiven()) break;
      const email = $("#a-email").value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) { $("#a-email").classList.add("bad"); $("#a-email").focus(); toast("Enter a valid email address"); break; }
      b.disabled = true; b.textContent = "Sending…";
      try { await Sync.sendCode(email); pendingEmail = email; $("#emailStep").hidden = true; $("#codeStep").hidden = false; $("#a-sent").textContent = email; toast("Sign-in link sent. Check your email."); }
      catch (err) { toast(authError(err, "Couldn't send the email")); }
      finally { b.disabled = false; b.innerHTML = `${I.mail}Email me a sign-in link`; }
      break;
    }
    case "resend":
      try { await Sync.sendCode(pendingEmail); toast("Sent again. Check your email."); } catch (err) { toast(authError(err, "Couldn't send the email")); }
      break;
    case "verifycode": {
      const code = $("#a-code").value.replace(/\D/g, "");
      if (code.length < 6) { $("#a-code").classList.add("bad"); toast("Enter the whole code"); break; }
      b.disabled = true; b.textContent = "Checking…";
      try { await Sync.verifyCode(pendingEmail, code); } catch (err) { toast(authError(err, "That code didn't work")); b.disabled = false; b.textContent = "Sign in with code"; }
      break;
    }
    case "changeemail": pendingEmail = ""; $("#emailStep").hidden = false; $("#codeStep").hidden = true; $("#a-email").focus(); break;
    case "syncnow": closeSheet(); await reconcile(); if (Sync.info().status === "synced") toast("Up to date"); break;
    case "signout": await Sync.signOut(); closeSheet(); render(); toast("Signed out. Your plan stays on this device."); break;
    case "delaccount":
      if (!b.classList.contains("armed")) { b.classList.add("armed"); b.textContent = "Tap again to delete for good"; setTimeout(() => { if (b.isConnected) { b.classList.remove("armed"); b.textContent = "Delete my account"; } }, 3500); break; }
      try { await Sync.deleteAccount(); closeSheet(); render(); toast("Account deleted"); } catch (err) { toast(authError(err, "Couldn't delete the account")); }
      break;
    case "usecloud": { const c = conflict; conflict = null; closeSheet(); adopt(c.remote, c.at, false); toast("Using the plan from your account"); break; }
    case "uselocal": { conflict = null; closeSheet(); state.updatedAt = Date.now(); persist(); try { await Sync.push(state); Sync.setStatus("synced"); toast("Kept this device's plan"); } catch (err) { Sync.setStatus("error"); } break; }

    /* focus */
    case "fdur": if (focus && !focus.endAt) { logFocus(); focus.dur = focus.remain = +b.dataset.m * 60; focus.logged = 0; $$("#fdurs button").forEach(x => x.setAttribute("aria-pressed", x === b)); setFocusUi("Ready when you are", false); focusTick(); } break;
    case "fgo":
      if (!focus) break;
      if (focus.endAt) { focusTick(); clearInterval(focus.iv); focus.endAt = null; logFocus(); setFocusUi("Paused", false); }
      else { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume?.(); } catch (err) {} focus.endAt = Date.now() + focus.remain * 1000; focus.iv = setInterval(focusTick, 250); setFocusUi("Focusing", true); haptic(); }
      break;
    case "freset": if (focus) { clearInterval(focus.iv); if (focus.endAt) { focusTick(); logFocus(); } focus.endAt = null; focus.remain = focus.dur; focus.logged = 0; setFocusUi("Ready when you are", false); focusTick(); } break;
    case "fdone": {
      if (!focus) break;
      const f = findTopic(focus.sid, focus.tid);
      if (f) { f.t.done = true; f.t.doneOn = today(); save(); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, [f.s.color]); haptic("success"); toast(`${f.t.name} done`); }
      closeSheet();
      break;
    }
  }
});
document.addEventListener("change", e => {
  if (e.target.id === "s-due") { readDraft(); refreshTopics(); $("#s-due-note").hidden = !(draft.due > state.deadline); }
  if (e.target.id === "q-sub") { $("#q-newwrap").hidden = e.target.value !== "__new"; if (e.target.value === "__new") $("#q-new").focus(); }
});
document.addEventListener("input", e => { if (e.target.classList?.contains("bad")) e.target.classList.remove("bad"); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && $("#scrim")) closeSheet();
  if (e.key === "Tab" && $("#scrim")) {
    const f = $$('#scrim button:not([disabled]), #scrim input:not([disabled]), #scrim select, #scrim textarea, #scrim summary, #scrim a[href]').filter(x => x.offsetParent);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === $("#scrim .sheet"))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  if (e.key === "Enter" && e.target.id === "newtopic") { e.preventDefault(); addTopicsFromInput(); }
  if (e.key === "Enter" && e.target.id === "a-email") { e.preventDefault(); $('[data-act="sendcode"]')?.click(); }
  if (e.key === "Enter" && e.target.id === "a-code") { e.preventDefault(); $('[data-act="verifycode"]')?.click(); }
});
addEventListener("resize", () => placeIndicator());
/* The add button shows its label at the top of the page and shrinks to "+" while you scroll. */
addEventListener("scroll", () => $("#fab")?.classList.toggle("mini", scrollY > 80), { passive: true });
document.fonts?.ready.then(placeIndicator);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") { Sync.flush(); return; }
  if (focus) focusTick();
  if (state && lastDay !== today()) { lastDay = today(); selDay = today(); calMonth = null; render(); }
  if (state && Sync.user()) reconcile();
});
setInterval(() => { if (state && lastDay !== today() && document.visibilityState === "visible") { lastDay = today(); render(); } }, 60000);

/* Android hardware back: close the sheet, then return to Today, then leave the app. */
Plug.App?.addListener?.("backButton", () => {
  if ($("#scrim")) closeSheet();
  else if (state && view !== "today") go("today");
  else Plug.App.exitApp();
});
if ("serviceWorker" in navigator && !native && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});

/* A sign-in link that failed (expired, already used) comes back as ?error_description=… in the address. */
function linkErrorFromUrl() {
  const q = new URLSearchParams(location.search.slice(1) + "&" + location.hash.slice(1));
  const e = q.get("error_description");
  if (!e) return;
  try { history.replaceState(null, "", location.pathname + "#" + view); } catch (err) {}
  const msg = /expired|invalid/i.test(e) ? "That sign-in link has expired or was already used." : e;
  setTimeout(() => toast(msg, { action: { label: "Send a new link", fn: accountSheet } }), 500);
}

/* ---------- start ---------- */
linkErrorFromUrl();
applyTheme();
Sync.on(updateSyncUi);
Sync.init(onSignedIn);
if (state) { showApp(); render(true); } else welcome();
