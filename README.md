# Sunset Platinum — GTA 6 Trophy Guide & Tracker

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun rank](https://make.fun/badge/gta6-trophy-guide-01/galipeli/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun reward](https://make.fun/badge/gta6-trophy-guide-01/galipeli/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An entry for the [make.fun](https://make.fun) bounty [Build the best GTA 6 trophy guide](https://make.fun/bounty/gta6-trophy-guide-01).

## About

**Sunset Platinum** is an offline web app that guides and tracks all **55 trophies** of Grand Theft Auto VI (PlayStation 5: 1 platinum, 2 gold, 6 silver, 46 bronze). It runs entirely from its own static files in `app/` — open `app/index.html` in a desktop browser with the network off and everything works; the app makes no network request at run time.

Features:

- **Tracker** — a checklist over the full official trophy list (name, description and grade for every trophy), with progress saved in the browser via `localStorage`, plus **export and import** of your progress to and from a file.
- **Filters** — browse by kind: story, missable, collectibles and activities, alongside search and grade views.
- **Spoiler setting** — hides the names and descriptions of story trophies until they are earned.
- **Roadmap to the platinum** — a 5-stage roadmap built from the official trophy descriptions, showing the order to earn them in.
- **Missables flagged** — all **12 missable trophies** are flagged, with when each one can be missed.
- **Next Up planner** — suggests what to chase next based on your progress, roadmap stage and missable risk.
- **Cited guide per trophy** — every trophy carries a guide in our own words (what to do, where and how, and when it can be missed) that cites its sources: the official list on Exophase for each trophy's name, description and grade, and PSNProfiles for PlayStation's progress targets where one exists.

The look is original — no Rockstar Games logo, official artwork or game screenshots are used.

## Run

The entrypoint is `main.ts` (Node 22). It hands the guide in: it copies `app/` and `screenshots/` from this repository to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`.

```sh
node main.ts
```

Outside the grader, set `MAKEFUN_OUTPUT_DIR` to stand in for `/output`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

To try the guide itself, serve `app/` with any static file server and open `index.html` in a desktop browser — it works fully offline.

## Screenshots

`screenshots/` holds renders of the app taken in a browser: the checklist with a trophy's cited guide open, the roadmap, the missables view and the Next Up planner.

## License

MIT — see `LICENSE`.
