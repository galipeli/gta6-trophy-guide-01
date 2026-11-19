// Sunset Platinum — saved progress.
// One localStorage key holds everything the tracker remembers: which
// trophies are earned, the reader's notes, and the spoiler setting.
// Export writes that state to a file; import reads one back. Nothing
// here touches the network, and nothing leaves the browser unless the
// reader asks for an export.

export const STORAGE_KEY = "sunset-platinum-v1";

/** The fresh state for a reader who has never used the guide. */
export function freshState() {
  return { earned: [], notes: {}, spoiler: true, filter: "all", query: "" };
}

/** Read the saved state, falling back to fresh state on any bad data. */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.earned)) return freshState();
    return {
      earned: parsed.earned.filter((n) => Number.isInteger(n)),
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
      spoiler: parsed.spoiler !== false,
      filter: typeof parsed.filter === "string" ? parsed.filter : "all",
      query: typeof parsed.query === "string" ? parsed.query : "",
    };
  } catch {
    return freshState();
  }
}

/** Persist the state. */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // A full or blocked store must not break the guide.
  }
}

/** Flip one trophy's earned flag and save. */
export function toggleEarned(state, id) {
  const at = state.earned.indexOf(id);
  if (at >= 0) state.earned.splice(at, 1);
  else state.earned.push(id);
  saveState(state);
  return state;
}

/** Save a reader's note on one trophy. */
export function setNote(state, id, text) {
  if (text.trim() === "") delete state.notes[id];
  else state.notes[id] = text;
  saveState(state);
  return state;
}

/** The state as a file's text, for export. */
export function exportText(state) {
  return JSON.stringify(
    { app: "sunset-platinum", game: "Grand Theft Auto VI", exportedAt: new Date().toISOString(), earned: state.earned, notes: state.notes },
    null,
    2,
  );
}

/** Parse an imported file's text into a state. Returns null when it is not our export. */
export function importText(text) {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.earned)) return null;
    const earned = parsed.earned.filter((n) => Number.isInteger(n) && n >= 1 && n <= 55);
    const notes = parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {};
    const cleanNotes = {};
    for (const [k, v] of Object.entries(notes)) {
      if (Number.isInteger(Number(k)) && typeof v === "string") cleanNotes[k] = v.slice(0, 2000);
    }
    return { earned, notes: cleanNotes };
  } catch {
    return null;
  }
}

/** Wipe the saved state entirely. */
export function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore a store we cannot clear.
  }
  return freshState();
}

/** Apply a screenshot / deep-link seed from the page's URL, if one is given.
 *  ?seed=2,3,8 earns those trophies, ?view=roadmap picks a tab,
 *  ?detail=17 opens a trophy's guide, ?spoiler=on|off sets the setting.
 *  A seed replaces the stored earned list, so a shared link shows the
 *  same progress its maker saw. */
export function applyUrlSeed(state) {
  const params = new URLSearchParams(window.location.search);
  const out = { view: null, detail: null };
  const seed = params.get("seed");
  if (seed !== null) {
    state.earned = seed.split(",").map((s) => Number.parseInt(s, 10)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 55);
    saveState(state);
  }
  const view = params.get("view");
  if (view) out.view = view;
  const detail = params.get("detail");
  if (detail) out.detail = Number.parseInt(detail, 10);
  const spoiler = params.get("spoiler");
  if (spoiler === "on" || spoiler === "off") {
    state.spoiler = spoiler === "on";
    saveState(state);
  }
  const search = params.get("search");
  if (search) state.query = search;
  return out;
}
