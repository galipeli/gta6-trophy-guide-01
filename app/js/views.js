// Sunset Platinum — rendering for the tracker, roadmap, missables and
// planner views (classic script; main.js wires the events). Every
// function returns an HTML string and trophy text always passes
// through esc() before it lands in markup.

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function gradeMark(grade) {
  return '<span class="grade grade-' + grade.toLowerCase() + '">' +
    esc(grade) + "</span>";
}

function trophyBadges(trophy) {
  let out = "";
  if (trophy.secret) {
    out += '<span class="badge badge-secret">SECRET / HIDDEN</span>';
  }
  if (trophy.missable) {
    out += '<span class="badge badge-missable">MISSABLE</span>';
  }
  return out;
}

function splitGuide(guide) {
  const marker = " Sources: ";
  const at = guide.indexOf(marker);
  if (at < 0) return { body: guide, sources: "" };
  return {
    body: guide.slice(0, at),
    sources: "Sources: " + guide.slice(at + marker.length),
  };
}

function renderProgressSummary(state, trophies, stages) {
  const total = trophies.length;
  const done = trophies.filter((t) => isEarned(state, t.id)).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const byGrade = earnedByGrade(state, trophies);
  const gradeBits = ["Platinum", "Gold", "Silver", "Bronze"]
    .map(
      (grade) =>
        grade + " " + byGrade.earned[grade] + "/" + byGrade.totals[grade],
    )
    .join(" · ");
  const byStage = earnedByStage(state, trophies, stages)
    .map((s) => "Stage " + s.stage + " " + s.earned + "/" + s.total)
    .join(" · ");
  return (
    '<div class="progress-card">' +
    '<div class="progress-big"><span id="earned-count">' + done +
    '</span><span class="progress-of"> / ' + total + " earned</span></div>" +
    '<div class="progress-bar"><div class="progress-fill" style="width:' +
    pct + '%"></div></div>' +
    '<div class="progress-line">' + esc(gradeBits) + "</div>" +
    '<div class="progress-line">' + esc(byStage) + "</div>" +
    "</div>"
  );
}

function renderTrophyRow(trophy, state, selectedId) {
  const earned = isEarned(state, trophy.id);
  const hidden = isSpoilerHidden(trophy, state);
  const classes =
    "trophy-row" + (earned ? " is-earned" : "") +
    (trophy.id === selectedId ? " is-selected" : "");
  return (
    '<article class="' + classes + '" data-row="' + trophy.id + '">' +
    '<label class="earn-box"><input type="checkbox" data-toggle="' +
    trophy.id + '"' + (earned ? " checked" : "") +
    ' aria-label="Mark earned"></label>' +
    '<button type="button" class="row-main" data-detail="' + trophy.id +
    '">' +
    '<span class="row-top">' + gradeMark(trophy.grade) +
    '<span class="row-name">' + esc(visibleName(trophy, state)) + "</span>" +
    trophyBadges(trophy) + "</span>" +
    '<span class="row-desc">' + esc(visibleDescription(trophy, state)) +
    "</span>" +
    '<span class="row-meta">' + trophy.points + " pts · " +
    esc(trophy.kind) + " · stage " + trophy.stage +
    (hidden || !trophy.target ? "" : " · " + esc(trophy.target)) +
    "</span>" +
    "</button></article>"
  );
}

function renderDetail(trophy, state) {
  if (!trophy) {
    return '<p class="detail-empty">Select a trophy to read its guide.</p>';
  }
  const hidden = isSpoilerHidden(trophy, state);
  const earned = isEarned(state, trophy.id);
  const parts = splitGuide(trophy.guide);
  let out = '<div class="detail-head">' + gradeMark(trophy.grade) +
    trophyBadges(trophy) + "</div>";
  out += '<h2 class="detail-name">' + esc(visibleName(trophy, state)) +
    "</h2>";
  out += '<p class="detail-desc">' +
    esc(visibleDescription(trophy, state)) + "</p>";
  out += '<p class="detail-meta">' + trophy.points + " points · " +
    esc(trophy.kind) + " · roadmap stage " + trophy.stage + " · " +
    (earned ? "earned" : "not earned yet") + "</p>";
  if (!hidden && trophy.target) {
    out += '<p class="detail-target">' + esc(trophy.target) + "</p>";
  }
  if (!hidden && trophy.missable && trophy.missableReason) {
    out += '<div class="detail-missable"><strong>Why missable:</strong> ' +
      esc(trophy.missableReason) + "</div>";
  }
  if (hidden) {
    out += '<p class="detail-guide">Guide hidden by the spoiler setting ' +
      "until this story trophy is earned.</p>";
  } else {
    out += '<p class="detail-guide">' + esc(parts.body) + "</p>";
    if (parts.sources) {
      out += '<p class="detail-sources">' + esc(parts.sources) + "</p>";
    }
  }
  out += '<label class="note-label" for="note-input">Your note</label>' +
    '<textarea id="note-input" data-note="' + trophy.id +
    '" rows="3" placeholder="Progress, counts, where you left off">' +
    esc(state.notes[String(trophy.id)] ?? "") + "</textarea>";
  return out;
}

function renderRoadmap(state, trophies, stages) {
  const byStage = earnedByStage(state, trophies, stages);
  let out = '<h2 class="view-title">Roadmap to the Platinum</h2>' +
    '<p class="view-sub">Five stages built from the official ' +
    "descriptions: story first with its one-time moments, counted " +
    "grinds in the middle, finale and 100 percent last.</p>";
  for (const stageInfo of stages) {
    const progress = byStage.find((s) => s.stage === stageInfo.stage);
    const inStage = trophies.filter((t) => t.stage === stageInfo.stage);
    out += '<section class="stage-card"><h3>Stage ' + stageInfo.stage +
      ": " + esc(stageInfo.title) + ' <span class="stage-count">' +
      progress.earned + "/" + progress.total + " earned</span></h3>" +
      '<p class="stage-summary">' + esc(stageInfo.summary) + "</p><ul>";
    for (const trophy of inStage) {
      out += "<li>" + (isEarned(state, trophy.id) ? "✓ " : "· ") +
        "<strong>" + esc(visibleName(trophy, state)) + "</strong> — " +
        esc(visibleDescription(trophy, state)) +
        (trophy.missable ? ' <span class="badge badge-missable">' +
          "MISSABLE</span>" : "") + "</li>";
    }
    out += "</ul></section>";
  }
  return out;
}

function renderMissables(state, trophies) {
  const list = trophies.filter((t) => t.missable);
  let out = '<h2 class="view-title">Missables — ' + list.length +
    " trophies</h2>" +
    '<p class="view-sub">Every missable flag below is derived from the ' +
    "trophy's own official description, quoted in each card. Keep a " +
    "manual save before story missions and none of these should need " +
    "a second playthrough.</p>";
  for (const trophy of list) {
    const hidden = isSpoilerHidden(trophy, state);
    out += '<article class="missable-card"><div class="missable-top">' +
      gradeMark(trophy.grade) + "<strong>" +
      esc(visibleName(trophy, state)) + "</strong>" +
      '<span class="badge badge-secret">' +
      (trophy.secret ? "SECRET / HIDDEN" : "VISIBLE") + "</span></div>" +
      '<p class="missable-desc">Official description: ' +
      esc(visibleDescription(trophy, state)) + "</p>";
    if (hidden) {
      out += '<p class="missable-reason">Reason hidden by the spoiler ' +
        "setting until earned.</p>";
    } else {
      out += '<p class="missable-reason">' +
        esc(trophy.missableReason ?? "") + "</p>";
    }
    out += '<p class="missable-stage">Roadmap stage ' + trophy.stage +
      " · " + (isEarned(state, trophy.id) ? "earned" : "not earned yet") +
      "</p></article>";
  }
  return out;
}

function renderPlanner(state, trophies, suggestions) {
  let out = '<h2 class="view-title">Next Up — your next 5 trophies</h2>' +
    '<p class="view-sub">The planner puts missable trophies first ' +
    "because they can be lost, then the earliest open roadmap stage. " +
    "Earn one and the list re-plans itself.</p>";
  if (suggestions.length === 0) {
    out += '<p class="planner-done">All 55 earned. Leonida legend.</p>';
    return out;
  }
  out += '<ol class="planner-list">';
  for (const trophy of suggestions) {
    const hidden = isSpoilerHidden(trophy, state);
    out += '<li class="planner-item"><div class="planner-top">' +
      gradeMark(trophy.grade) + "<strong>" +
      esc(visibleName(trophy, state)) + "</strong>" +
      trophyBadges(trophy) + "</div>" +
      '<p class="planner-desc">' +
      esc(visibleDescription(trophy, state)) + "</p>" +
      '<p class="planner-reason">' +
      esc(hidden ? "Details hidden by the spoiler setting." :
        plannerReason(trophy)) + "</p>" +
      (hidden || !trophy.target ? "" :
        '<p class="planner-target">' + esc(trophy.target) + "</p>") +
      "</li>";
  }
  out += "</ol>";
  return out;
}
