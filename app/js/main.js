// Sunset Platinum — boot and wiring.
// Renders the shell, switches tabs, and handles every click and key
// through one delegated listener. The views own the HTML; the store owns
// the saved state; this file only connects the two.

import { TROPHIES, trophyById } from "./trophies-data.js";
import { applyUrlSeed, exportText, importText, loadState, resetState, saveState, setNote, toggleEarned } from "./store.js";
import { progressHeader, renderMissables, renderPlanner, renderRoadmap, renderSettings, renderTracker } from "./views.js";

const TABS = [
  { key: "tracker", label: "Tracker" },
  { key: "roadmap", label: "Roadmap" },
  { key: "missables", label: "Missables" },
  { key: "planner", label: "Next Up" },
  { key: "settings", label: "Settings" },
];

let state = loadState();
let view = "tracker";
let selectedId = null;

const seed = applyUrlSeed(state);
if (seed.view && TABS.some((t) => t.key === seed.view)) view = seed.view;
if (seed.detail && trophyById(seed.detail)) selectedId = seed.detail;

/** The static shell: header, tabs, and the mount point. */
function shellHtml() {
  const tabs = TABS.map((t) => `<button class="tab ${view === t.key ? "is-on" : ""}" data-action="tab" data-id="${t.key}">${t.label}${t.key === "missables" ? " (12)" : ""}</button>`).join("");
  return `<header class="masthead">
    <div class="mast-title">
      <h1>Sunset Platinum</h1>
      <p class="tagline">The offline GTA 6 trophy guide &amp; tracker — all 55 PlayStation 5 trophies, with cited guides</p>
    </div>
    <nav class="tabs" aria-label="Sections">${tabs}</nav>
  </header>
  ${progressHeader(state)}
  <main id="view"></main>
  <footer class="foot">Grand Theft Auto VI &middot; PlayStation 5 &middot; 55 trophies &middot; Names, descriptions and grades are PlayStation's own words. Guides are our own words, with named sources. Works offline — no network requests.</footer>`;
}

/** Paint the current tab into the mount point. */
function render() {
  const mount = document.getElementById("view");
  if (!mount) return;
  if (view === "roadmap") mount.innerHTML = renderRoadmap(state);
  else if (view === "missables") mount.innerHTML = renderMissables(state);
  else if (view === "planner") mount.innerHTML = renderPlanner(state);
  else if (view === "settings") mount.innerHTML = renderSettings(state);
  else mount.innerHTML = renderTracker(state, selectedId);
  const header = document.querySelector(".progress");
  if (header) header.outerHTML = progressHeader(state);
  for (const tab of document.querySelectorAll(".tab")) {
    tab.classList.toggle("is-on", tab.dataset.id === view);
  }
}

/** Re-render in place, keeping the search box focused where it was. */
function rerender(keepFocus) {
  const active = keepFocus ? document.activeElement : null;
  const wasSearch = active && active.classList && active.classList.contains("search");
  render();
  if (wasSearch) {
    const box = document.querySelector(".search");
    if (box) {
      box.focus();
      box.setSelectionRange(box.value.length, box.value.length);
    }
  }
}

/** Download the exported state as a file. */
function downloadExport() {
  const blob = new Blob([exportText(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sunset-platinum-progress.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Read an imported file and merge its earned list and notes. */
function handleImport(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const parsed = importText(String(reader.result || ""));
    const note = document.getElementById("save-note");
    if (!parsed) {
      if (note) note.textContent = "That file is not a Sunset Platinum export — nothing was changed.";
      return;
    }
    state.earned = parsed.earned;
    state.notes = parsed.notes;
    saveState(state);
    if (note) note.textContent = `Imported ${parsed.earned.length} earned trophies.`;
    render();
  };
  reader.readAsText(file);
}

/** Clicks: tabs, filters, selecting a trophy, export and reset.
 *  Checkboxes are handled by the change listener below, never here —
 *  a checkbox fires both click and change, and handling both would
 *  toggle it twice. */
function onClick(event) {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id ? Number.parseInt(el.dataset.id, 10) : null;
  if (action === "tab") {
    view = el.dataset.id;
    render();
  } else if (action === "filter") {
    state.filter = el.dataset.id;
    saveState(state);
    rerender(false);
  } else if (action === "select") {
    selectedId = id;
    if (view !== "tracker") view = "tracker";
    render();
    const pane = document.querySelector(".detail");
    if (pane) pane.scrollIntoView({ block: "nearest" });
  } else if (action === "export") {
    downloadExport();
  } else if (action === "reset") {
    if (window.confirm("Reset all progress and notes?")) {
      state = resetState();
      selectedId = null;
      render();
    }
  }
}

/** Changes: earned checkboxes, the spoiler switch, and file import. */
function onChange(event) {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id ? Number.parseInt(el.dataset.id, 10) : null;
  if (action === "toggle") {
    toggleEarned(state, id);
    rerender(false);
  } else if (action === "spoiler") {
    state.spoiler = el.checked;
    saveState(state);
    rerender(false);
  } else if (action === "import") {
    handleImport(el.files && el.files[0]);
    el.value = "";
  }
}

/** Typing: the search box and the note field. */
function onInput(event) {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id ? Number.parseInt(el.dataset.id, 10) : null;
  if (action === "search") {
    state.query = el.value;
    saveState(state);
    rerender(true);
  } else if (action === "note") {
    setNote(state, id, el.value);
  }
}

document.getElementById("app").innerHTML = shellHtml();
render();
document.addEventListener("click", onClick);
document.addEventListener("change", onChange);
document.addEventListener("input", onInput);
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
    event.preventDefault();
    const box = document.querySelector(".search");
    if (box) box.focus();
  }
  const tabIndex = ["1", "2", "3", "4", "5"].indexOf(event.key);
  if (tabIndex >= 0 && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
    view = TABS[tabIndex].key;
    render();
  }
});
