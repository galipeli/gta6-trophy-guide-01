// Sunset Platinum — progress store (classic script, loads before
// filters.js, views.js and main.js; shares the page's global scope).
//
// All tracker state lives in one localStorage record: which trophies
// are earned, the free-text note per trophy and the spoiler setting.
// Export serialises that record to JSON and import restores it, so a
// round trip through a file loses nothing.

const STORAGE_KEY = "sunset-platinum-tracker-v2";

function emptyState() {
  return { earned: {}, notes: {}, spoiler: false };
}

function loadState() {
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return normaliseState(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

function normaliseState(value) {
  const state = emptyState();
  if (value && typeof value === "object") {
    if (value.earned && typeof value.earned === "object") {
      for (const key of Object.keys(value.earned)) {
        if (value.earned[key]) state.earned[key] = true;
      }
    }
    if (value.notes && typeof value.notes === "object") {
      for (const key of Object.keys(value.notes)) {
        const note = value.notes[key];
        if (typeof note === "string" && note.length > 0) {
          state.notes[key] = note;
        }
      }
    }
    state.spoiler = value.spoiler === true;
  }
  return state;
}

function saveState(state) {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode, file quotas). The
    // tracker keeps working in memory for the session.
  }
}

function isEarned(state, trophyId) {
  return state.earned[String(trophyId)] === true;
}

function toggleEarned(state, trophyId) {
  const key = String(trophyId);
  if (state.earned[key]) delete state.earned[key];
  else state.earned[key] = true;
  saveState(state);
  return isEarned(state, trophyId);
}

function setNote(state, trophyId, text) {
  const key = String(trophyId);
  if (text && text.trim().length > 0) state.notes[key] = text;
  else delete state.notes[key];
  saveState(state);
}

function setSpoiler(state, on) {
  state.spoiler = on === true;
  saveState(state);
}

function exportStateJson(state) {
  return JSON.stringify(
    {
      app: "sunset-platinum",
      version: 2,
      earned: state.earned,
      notes: state.notes,
      spoiler: state.spoiler,
    },
    null,
    2,
  );
}

function importStateJson(text) {
  return normaliseState(JSON.parse(text));
}

function earnedByGrade(state, trophies) {
  const totals = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  const earned = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  for (const trophy of trophies) {
    totals[trophy.grade] += 1;
    if (isEarned(state, trophy.id)) earned[trophy.grade] += 1;
  }
  return { totals, earned };
}

function earnedByStage(state, trophies, stages) {
  return stages.map((stageInfo) => {
    const inStage = trophies.filter((t) => t.stage === stageInfo.stage);
    const done = inStage.filter((t) => isEarned(state, t.id)).length;
    return { stage: stageInfo.stage, total: inStage.length, earned: done };
  });
}
