// Sunset Platinum — the entrypoint.
// Copies the guide (app/) and its screenshots (screenshots/) into the
// output directory and writes dossier.json with the kit's buildDossier.
// Node 22, standard library only; no network, no install, no build step.
// The output directory is /output, or MAKEFUN_OUTPUT_DIR when set.
// Run it twice and the bytes are identical: the copy is plain files and
// the dossier is a deterministic function of them.

import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

// The gate's own caps for this bounty, so a dossier that builds here is
// the dossier the scorer rebuilds: 4 screenshots at most 256 KiB each,
// app/ at most 993 entries and 48 MiB, paths at most 1000 bytes, and
// the dossier text at most 163840 bytes.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, "app"), join(outputDir, "app"), { recursive: true });
cpSync(join(repoRoot, "screenshots"), join(outputDir, "screenshots"), { recursive: true });
writeFileSync(join(outputDir, "dossier.json"), buildDossier(outputDir, DOSSIER_CAPS));
console.log(`Wrote ${outputDir} (app/, screenshots/, dossier.json).`);
