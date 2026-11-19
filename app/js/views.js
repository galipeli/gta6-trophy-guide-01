// Sunset Platinum — the views: tracker, roadmap, missables, planner,
// settings. Each view is a plain HTML string; main.js drops it into the
// page and wires the buttons. Nothing here fetches anything.

import { TROPHIES, ROADMAP_STAGES, missableTrophies, nextUpTrophies, trophyById } from "./trophies-data.js";
import { KIND_FILTERS, KIND_LABELS, filterTrophies, gradeCounts, isSpoilerHidden, spoilerName, stageCounts } from "./filters.js";

/** Escape text before it goes into the page. */
export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** The medal dot and grade word for one trophy. */
export function gradeBadge(trophy) {
  return `<span class="grade grade-${trophy.grade}" title="${trophy.grade} trophy">&#9679; ${trophy.grade}</span>`;
}

/** The header strip: big earned count, progress bar, per-grade counters. */
export function progressHeader(state) {
  const earned = state.earned.length;
  const pct = Math.round((earned / TROPHIES.length) * 100);
  const grades = gradeCounts(TROPHIES, state);
  const chips = Object.entries(grades)
    .map(([grade, c]) => `<span class="count-chip"><span class="dot dot-${grade}"></span>${grade} ${c.earned}/${c.total}</span>`)
    .join("");
  return `<section class="progress" aria-label="Progress">
    <div class="progress-big"><span class="big-count">${earned}<span class="big-total">/55</span></span>
    <span class="big-label">trophies earned &middot; ${pct}% to platinum</span></div>
    <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
    <div class="count-chips">${chips}<span class="count-chip">55 total &middot; 1 platinum, 2 gold, 6 silver, 46 bronze &middot; 28 hidden on PSN</span></div>
  </section>`;
}

/** One checklist row. Spoiler-hidden story trophies show a placeholder name. */
export function trophyRow(trophy, state, selectedId) {
  const earned = state.earned.includes(trophy.id);
  const hidden = isSpoilerHidden(trophy, state);
  const name = hidden ? spoilerName(trophy) : trophy.name;
  const desc = hidden ? "Hidden until earned — turn spoilers off in Settings to peek." : trophy.description;
  const target = trophy.psnTarget ? `<span class="target">PSN target: ${trophy.psnTarget.toLocaleString("en-US")} ${escapeHtml(trophy.psnTargetUnit || "")}</span>` : "";
  const miss = trophy.missable ? `<span class="flag-missable">MISSABLE</span>` : "";
  return `<li class="row ${earned ? "is-earned" : ""} ${trophy.id === selectedId ? "is-selected" : ""}" data-trophy="${trophy.id}">
    <label class="check"><input type="checkbox" data-action="toggle" data-id="${trophy.id}" ${earned ? "checked" : ""} aria-label="Mark ${escapeHtml(name)} earned"><span class="box" aria-hidden="true">${earned ? "&#10003;" : ""}</span></label>
    <button class="row-body" data-action="select" data-id="${trophy.id}">
      <span class="row-name">${escapeHtml(name)} ${miss}</span>
      <span class="row-desc">${escapeHtml(desc)}</span>
      <span class="row-meta">${gradeBadge(trophy)} <span class="kind">${KIND_LABELS[trophy.kind]}</span> <span class="stage-tag">Roadmap stage ${trophy.stage}</span> ${target}</span>
    </button>
  </li>`;
}

/** The guide pane for the selected trophy: official text, our guide, sources. */
export function detailPane(trophy, state) {
  if (!trophy) {
    return `<aside class="detail"><h2>Guide</h2><p class="muted">Pick a trophy on the left to read its guide. Every guide names its sources, and says plainly where a place or a step is not yet checked in the game.</p></aside>`;
  }
  const earned = state.earned.includes(trophy.id);
  const hidden = isSpoilerHidden(trophy, state);
  const name = hidden ? spoilerName(trophy) : trophy.name;
  const desc = hidden ? "Hidden until earned." : trophy.description;
  const note = state.notes[trophy.id] || "";
  // A spoiler-hidden trophy hides its guide and its missable reason too:
  // the guide itself would give the story away.
  const guide = hidden ? "Hidden until earned — the guide stays hidden with the trophy's name." : trophy.guide;
  const warn = trophy.missable && !hidden
    ? `<p class="warn"><strong>Missable.</strong> ${escapeHtml(trophy.missableReason || "")} Read the missables page before this moment passes.</p>`
    : "";
  const targetLine = trophy.psnTarget && !hidden
    ? `<p class="target-line">PSN target: <strong>${trophy.psnTarget.toLocaleString("en-US")} ${escapeHtml(trophy.psnTargetUnit || "")}</strong> (PSNProfiles)</p>`
    : "";
  return `<aside class="detail">
    <h2>${escapeHtml(name)}</h2>
    <p class="detail-meta">${gradeBadge(trophy)} <span class="kind">${KIND_LABELS[trophy.kind]}</span> <span class="stage-tag">Roadmap stage ${trophy.stage}</span></p>
    <p class="official"><span class="label">Official description</span> ${escapeHtml(desc)}</p>
    ${targetLine}
    ${warn}
    <h3>Guide</h3>
    <p class="guide">${escapeHtml(guide)}</p>
    <p class="sources">${escapeHtml(trophy.sources)}</p>
    <label class="check earned-line"><input type="checkbox" data-action="toggle" data-id="${trophy.id}" ${earned ? "checked" : ""}><span class="box" aria-hidden="true">${earned ? "&#10003;" : ""}</span> Earned</label>
    <label class="note-label">Your note<textarea data-action="note" data-id="${trophy.id}" rows="2" placeholder="Where you found it, what worked…">${escapeHtml(note)}</textarea></label>
  </aside>`;
}

/** The tracker tab: search, filter chips, checklist and guide pane. */
export function renderTracker(state, selectedId) {
  const list = filterTrophies(TROPHIES, state);
  const chips = KIND_FILTERS.map((f) => `<button class="chip ${state.filter === f.key ? "is-on" : ""}" data-action="filter" data-id="${f.key}">${f.label}</button>`).join("");
  const rows = list.map((t) => trophyRow(t, state, selectedId)).join("");
  const selected = trophyById(selectedId) || list[0] || null;
  return `<section class="tracker">
    <div class="toolbar">
      <input class="search" type="search" placeholder="Search trophies, descriptions and guides…" value="${escapeHtml(state.query || "")}" data-action="search" aria-label="Search trophies">
      <div class="chips">${chips}</div>
      <label class="spoiler-toggle"><input type="checkbox" data-action="spoiler" ${state.spoiler ? "checked" : ""}> Spoilers off: hide story names until earned</label>
    </div>
    <p class="list-count">${list.length} of 55 trophies shown &middot; ${state.earned.length} earned</p>
    <div class="split">
      <ul class="list">${rows || `<li class="empty">Nothing matches. Clear the search or pick another filter.</li>`}</ul>
      ${detailPane(selected, state)}
    </div>
  </section>`;
}

/** The roadmap tab: five stages, each with its trophies and a progress bar. */
export function renderRoadmap(state) {
  const counts = stageCounts(TROPHIES, state);
  const cards = ROADMAP_STAGES.map((stage) => {
    const items = TROPHIES.filter((t) => t.stage === stage.n);
    const c = counts[stage.n];
    const pct = c.total ? Math.round((c.earned / c.total) * 100) : 0;
    const chips = items
      .map((t) => {
        const earned = state.earned.includes(t.id);
        const hidden = isSpoilerHidden(t, state);
        return `<span class="mini ${earned ? "is-earned" : ""} ${t.missable ? "is-missable" : ""}" data-action="select" data-id="${t.id}">${escapeHtml(hidden ? spoilerName(t) : t.name)}${t.missable ? " &#9873;" : ""}</span>`;
      })
      .join("");
    return `<article class="stage-card">
      <h3>Stage ${stage.n} — ${escapeHtml(stage.title)} <span class="stage-count">${c.earned}/${c.total}</span></h3>
      <p class="muted">${escapeHtml(stage.note)}</p>
      <div class="bar small"><span style="width:${pct}%"></span></div>
      <div class="minis">${chips}</div>
    </article>`;
  }).join("");
  return `<section class="roadmap">
    <p class="intro">The road to platinum, built from the official descriptions: story first, then side strands, activities, collectibles, and the heist and robbery cleanup last. A flag (&#9873;) marks a missable trophy — read its guide before the moment passes.</p>
    ${cards}
    <p class="muted">Platinum “Vice Got a Price!” unlocks with the other 54. “A Long Road” (100% completion) lands in stage 5, with the cleanup.</p>
  </section>`;
}

/** The missables tab: all 12, with the reason each one can pass you by. */
export function renderMissables(state) {
  const items = missableTrophies();
  const done = items.filter((t) => state.earned.includes(t.id)).length;
  const rows = items
    .map((t) => {
      const earned = state.earned.includes(t.id);
      const hidden = isSpoilerHidden(t, state);
      return `<li class="miss-row ${earned ? "is-earned" : ""}">
        <button class="miss-body" data-action="select" data-id="${t.id}">
          <span class="row-name">${escapeHtml(hidden ? spoilerName(t) : t.name)} ${gradeBadge(t)}</span>
          <span class="row-desc">${escapeHtml(t.description)}</span>
          <span class="miss-why"><strong>Why it can be missed:</strong> ${escapeHtml(t.missableReason || "")}</span>
        </button>
        <label class="check"><input type="checkbox" data-action="toggle" data-id="${t.id}" ${earned ? "checked" : ""} aria-label="Mark earned"><span class="box" aria-hidden="true">${earned ? "&#10003;" : ""}</span></label>
      </li>`;
    })
    .join("");
  return `<section class="missables">
    <p class="warn-banner"><strong>12 missable trophies — ${done} earned.</strong> No chapter select is confirmed in the official descriptions, so treat every moment below as one chance: read the guide, save first, then attempt it. Anything not listed here is earned by story progress or by a cumulative count, and can be finished later.</p>
    <ul class="list miss-list">${rows}</ul>
  </section>`;
}

/** The Next Up planner: the next five trophies the roadmap suggests. */
export function renderPlanner(state) {
  const next = nextUpTrophies(state.earned, 5);
  if (next.length === 0) {
    return `<section class="planner"><p class="intro">Everything is earned. The platinum is yours — congratulations, Leonida Legend.</p></section>`;
  }
  const rows = next
    .map((t, i) => {
      const hidden = isSpoilerHidden(t, state);
      const why = t.missable
        ? "Do it now — it is missable, and the moment may not come back."
        : t.stage <= 2
          ? "Next in the roadmap: it unlocks story or side progress you are already on."
          : "Cheapest next win in its roadmap stage — a count that builds while you play.";
      return `<li class="next-row">
        <span class="next-rank">${i + 1}</span>
        <button class="miss-body" data-action="select" data-id="${t.id}">
          <span class="row-name">${escapeHtml(hidden ? spoilerName(t) : t.name)} ${gradeBadge(t)}</span>
          <span class="row-desc">${escapeHtml(hidden ? "Hidden until earned." : t.description)}</span>
          <span class="miss-why"><strong>Why next:</strong> ${why} Roadmap stage ${t.stage}.</span>
        </button>
      </li>`;
    })
    .join("");
  return `<section class="planner">
    <p class="intro">Next up, in roadmap order — earliest stage first, missables before the rest. Tick one off and the list re-sorts itself.</p>
    <ol class="next-list">${rows}</ol>
  </section>`;
}

/** The settings tab: spoiler setting, export, import, reset, and sources. */
export function renderSettings(state) {
  return `<section class="settings">
    <h2>Settings &amp; your save</h2>
    <label class="spoiler-toggle big"><input type="checkbox" data-action="spoiler" ${state.spoiler ? "checked" : ""}> Spoilers off — hide story trophy names and descriptions until earned (28 trophies are hidden on PSN until earned)</label>
    <div class="save-row">
      <button class="btn" data-action="export">Export progress (.json)</button>
      <label class="btn file-btn">Import progress<input type="file" accept=".json,application/json" data-action="import" hidden></label>
      <button class="btn danger" data-action="reset">Reset progress</button>
    </div>
    <p class="muted" id="save-note">Progress is saved in this browser (localStorage). Export keeps a copy as a file; import restores one. ${state.earned.length} of 55 earned.</p>
    <h2>Where the facts come from</h2>
    <p>Names, descriptions and grades are the official PlayStation list, as Exophase and PSNProfiles listed it before this guide was built; the two agree on every name, description and grade. PSN counts (250 stunts, 42 Shooting Range challenges, and the rest) come from PSNProfiles. Every guide is written for this entry, in our own words, from the official description — and where a place or a step cannot be pinned down from the description, the guide says “not yet checked in the game” instead of guessing. No Rockstar logo or artwork is used; the look is our own. This guide works fully offline: it loads only its own files and makes no network request.</p>
    <h2>Keyboard</h2>
    <p class="muted">Press <kbd>/</kbd> to search, <kbd>1</kbd>–<kbd>5</kbd> to switch tabs (Tracker, Roadmap, Missables, Next Up, Settings).</p>
  </section>`;
}
