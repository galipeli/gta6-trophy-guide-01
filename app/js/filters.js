// Sunset Platinum — filtering, searching and the spoiler rule.
// One place owns how the list is narrowed, so the tracker, the roadmap
// and the planner all agree on what "earned" and "hidden" mean.

/** The filter chips the tracker offers, in order. */
export const KIND_FILTERS = [
  { key: "all", label: "All 55" },
  { key: "story", label: "Story" },
  { key: "missable", label: "Missable" },
  { key: "collectibles", label: "Collectibles" },
  { key: "activities", label: "Activities" },
  { key: "side", label: "Side strands" },
  { key: "heist", label: "Heists" },
  { key: "earned", label: "Earned" },
  { key: "todo", label: "Still to earn" },
];

/** Human labels for the trophy kinds. */
export const KIND_LABELS = {
  story: "Story",
  side: "Side strand",
  activities: "Activity",
  collectibles: "Collectible",
  heist: "Heist",
};

/** Grade order for sorting and for the progress counters. */
export const GRADES = ["platinum", "gold", "silver", "bronze"];

/** Narrow the trophy list by kind filter, search text and earned state. */
export function filterTrophies(trophies, state) {
  const query = (state.query || "").trim().toLowerCase();
  return trophies.filter((t) => {
    if (state.filter === "missable" && !t.missable) return false;
    if (state.filter === "earned" && !state.earned.includes(t.id)) return false;
    if (state.filter === "todo" && state.earned.includes(t.id)) return false;
    if (["story", "collectibles", "activities", "side", "heist"].includes(state.filter) && t.kind !== state.filter) return false;
    if (query) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

/** The spoiler rule: a story trophy the reader has not earned yet hides
 *  its name and description while spoilers are on. Its grade, kind and
 *  guide button stay visible, so the list never looks broken. */
export function isSpoilerHidden(trophy, state) {
  return state.spoiler && trophy.kind === "story" && !state.earned.includes(trophy.id);
}

/** What the list shows for a hidden trophy instead of its real name. */
export function spoilerName(trophy) {
  return `Hidden story trophy #${trophy.id}`;
}

/** Earned counts per grade, for the progress counters. */
export function gradeCounts(trophies, state) {
  const out = {};
  for (const grade of GRADES) {
    out[grade] = {
      total: trophies.filter((t) => t.grade === grade).length,
      earned: trophies.filter((t) => t.grade === grade && state.earned.includes(t.id)).length,
    };
  }
  return out;
}

/** Earned counts per roadmap stage, for the roadmap's progress bars. */
export function stageCounts(trophies, state) {
  const out = {};
  for (let n = 1; n <= 5; n++) {
    out[n] = {
      total: trophies.filter((t) => t.stage === n).length,
      earned: trophies.filter((t) => t.stage === n && state.earned.includes(t.id)).length,
    };
  }
  return out;
}
