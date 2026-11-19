// Sunset Platinum — filtering, the spoiler rule and the Next Up
// planner (classic script; uses isEarned from store.js at call time).
//
// Kinds follow the brief: story, missable, collectibles, activities.
// Missable is a flag on top of a kind, earned and todo cut across all
// kinds. The spoiler rule hides a story trophy's name, description,
// guide, missable reason and PSN target until that trophy is earned.

const KIND_FILTERS = [
  { key: "all", label: "All 55" },
  { key: "story", label: "Story" },
  { key: "missable", label: "Missable" },
  { key: "collectibles", label: "Collectibles" },
  { key: "activities", label: "Activities" },
  { key: "earned", label: "Earned" },
  { key: "todo", label: "To do" },
];

function matchesKindFilter(trophy, filterKey, state) {
  if (filterKey === "all") return true;
  if (filterKey === "missable") return trophy.missable === true;
  if (filterKey === "earned") return isEarned(state, trophy.id);
  if (filterKey === "todo") return !isEarned(state, trophy.id);
  return trophy.kind === filterKey;
}

function matchesSearch(trophy, query) {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return true;
  const haystack = [
    trophy.name,
    trophy.description,
    trophy.guide,
    trophy.grade,
    trophy.kind,
    trophy.target ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function filterTrophies(trophies, filterKey, query, state) {
  return trophies.filter(
    (trophy) =>
      matchesKindFilter(trophy, filterKey, state) &&
      matchesSearch(trophy, query),
  );
}

function isSpoilerHidden(trophy, state) {
  return (
    state.spoiler === true &&
    trophy.kind === "story" &&
    !isEarned(state, trophy.id)
  );
}

function visibleName(trophy, state) {
  return isSpoilerHidden(trophy, state) ? "Hidden story trophy" : trophy.name;
}

function visibleDescription(trophy, state) {
  return isSpoilerHidden(trophy, state)
    ? "Hidden until earned (spoiler setting is on)."
    : trophy.description;
}

// Next Up planner: five suggestions, missable trophies first because
// they can be lost, then the earliest roadmap stage, then the lowest
// stage order in the official list. Platinum comes last by design: it
// unlocks itself once everything else is done.
function nextUp(trophies, state, limit = 5) {
  const remaining = trophies.filter((t) => !isEarned(state, t.id));
  const score = (trophy) => {
    let value = 0;
    if (trophy.missable) value -= 1000;
    value += trophy.stage * 10;
    if (trophy.kind === "platinum") value += 500;
    value += trophy.id / 100;
    return value;
  };
  return remaining
    .slice()
    .sort((a, b) => score(a) - score(b))
    .slice(0, limit);
}

function plannerReason(trophy) {
  if (trophy.missable) {
    return "Missable: secure it before the story moves past its moment.";
  }
  if (trophy.kind === "platinum") {
    return "Unlocks itself when the other 54 are earned.";
  }
  return "Earliest open roadmap stage: stage " + trophy.stage + ".";
}
