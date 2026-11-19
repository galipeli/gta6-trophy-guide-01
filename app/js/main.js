// Sunset Platinum — boot, routing and event wiring (classic script,
// loaded last; uses the globals from trophies-data.js, store.js,
// filters.js and views.js).
//
// The app is fully offline and works from file://: trophy data is an
// embedded script, state lives in localStorage, and deep links use
// query parameters (?view=&detail=&filter=&q=&spoiler=&seed=) so any
// staged state can be reproduced, for example for screenshots.

const params = new URLSearchParams(globalThis.location.search);

const state = loadState();

// A seed parameter stages an earned subset (used for screenshots and
// shared links). It replaces the earned set for this load and is then
// saved like any other progress.
if (params.has("seed")) {
  state.earned = {};
  for (const part of params.get("seed").split(",")) {
    const id = Number.parseInt(part, 10);
    if (Number.isInteger(id)) state.earned[String(id)] = true;
  }
  saveState(state);
}
if (params.has("spoiler")) {
  setSpoiler(state, params.get("spoiler") === "on");
}

let currentView = params.get("view") ?? "tracker";
let currentFilter = params.get("filter") ?? "all";
let currentQuery = params.get("q") ?? "";
let selectedId = Number.parseInt(params.get("detail") ?? "", 10);
if (!TROPHIES.some((t) => t.id === selectedId)) {
  selectedId = TROPHIES[0].id;
}

function el(id) {
  return document.getElementById(id);
}

function render() {
  el("progress-slot").innerHTML =
    renderProgressSummary(state, TROPHIES, ROADMAP_STAGES);

  el("filter-chips").innerHTML = KIND_FILTERS.map(
    (f) =>
      '<button type="button" class="chip' +
      (f.key === currentFilter ? " is-active" : "") +
      '" data-filter="' + f.key + '">' + esc(f.label) + "</button>",
  ).join("");

  const visible = filterTrophies(
    TROPHIES, currentFilter, currentQuery, state);
  el("list-count").textContent =
    "Showing " + visible.length + " of " + TROPHIES.length + " trophies";
  el("trophy-list").innerHTML = visible
    .map((t) => renderTrophyRow(t, state, selectedId))
    .join("");

  const selected = TROPHIES.find((t) => t.id === selectedId);
  el("detail-panel").innerHTML = renderDetail(selected, state);

  el("roadmap-view").innerHTML =
    renderRoadmap(state, TROPHIES, ROADMAP_STAGES);
  el("missables-view").innerHTML = renderMissables(state, TROPHIES);
  el("planner-view").innerHTML =
    renderPlanner(state, TROPHIES, nextUp(TROPHIES, state, 5));

  for (const viewName of ["tracker", "roadmap", "missables", "planner"]) {
    el(viewName + "-view").hidden = viewName !== currentView;
    const nav = document.querySelector(
      '[data-nav="' + viewName + '"]');
    if (nav) nav.classList.toggle("is-active", viewName === currentView);
  }
  const spoilerBox = el("spoiler-toggle");
  if (spoilerBox) spoilerBox.checked = state.spoiler;
}

function downloadExport() {
  const blob = new Blob([exportStateJson(state)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sunset-platinum-progress.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function handleImportFile(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = importStateJson(String(reader.result));
      state.earned = imported.earned;
      state.notes = imported.notes;
      state.spoiler = imported.spoiler;
      saveState(state);
      render();
      el("import-status").textContent = "Progress imported.";
    } catch {
      el("import-status").textContent =
        "That file could not be imported.";
    }
  });
  reader.readAsText(file);
}

function wireEvents() {
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("[data-toggle]")) {
      toggleEarned(state, Number(target.dataset.toggle));
      render();
    } else if (target.id === "spoiler-toggle") {
      setSpoiler(state, target.checked);
      render();
    } else if (target.id === "import-file" && target.files?.[0]) {
      handleImportFile(target.files[0]);
    } else if (target.matches("[data-note]")) {
      setNote(state, Number(target.dataset.note), target.value);
    }
  });

  document.addEventListener("click", (event) => {
    const detailButton = event.target.closest("[data-detail]");
    if (detailButton) {
      selectedId = Number(detailButton.dataset.detail);
      render();
      return;
    }
    const chip = event.target.closest("[data-filter]");
    if (chip) {
      currentFilter = chip.dataset.filter;
      render();
      return;
    }
    const nav = event.target.closest("[data-nav]");
    if (nav) {
      currentView = nav.dataset.nav;
      render();
      return;
    }
    if (event.target.id === "export-button") downloadExport();
  });

  el("search-input").addEventListener("input", (event) => {
    currentQuery = event.target.value;
    render();
  });
  el("search-input").value = currentQuery;

  document.addEventListener("keydown", (event) => {
    const typing =
      /INPUT|TEXTAREA/.test(document.activeElement?.tagName ?? "");
    if (event.key === "/" && !typing) {
      event.preventDefault();
      el("search-input").focus();
    } else if (!typing && ["1", "2", "3", "4"].includes(event.key)) {
      currentView = ["tracker", "roadmap", "missables", "planner"][
        Number(event.key) - 1];
      render();
    } else if (!typing && event.key.toLowerCase() === "s") {
      setSpoiler(state, !state.spoiler);
      render();
    }
  });
}

// Exposed for automated checks and for curious players in devtools.
globalThis.__sunset = {
  state,
  trophies: TROPHIES,
  exportStateJson: () => exportStateJson(state),
  importStateJson: (text) => {
    const imported = importStateJson(text);
    state.earned = imported.earned;
    state.notes = imported.notes;
    state.spoiler = imported.spoiler;
    saveState(state);
    render();
  },
  nextUp: () => nextUp(TROPHIES, state, 5),
};

wireEvents();
render();
