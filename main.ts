// Sunset Platinum — hand-in program for the GTA 6 trophy guide entry.
//
// Node 22, standard library only, fully deterministic: it copies the
// static app and the screenshots from this repository into the output
// directory, then writes the dossier with the vendored library, so two
// runs over the same tree produce byte-identical output.

import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const dossierTextCapBytes = 163_840;

async function copyTreeFresh(sourceName: string): Promise<void> {
  const from = join(repoRoot, sourceName);
  const to = join(outputDir, sourceName);
  await rm(to, { recursive: true, force: true });
  await cp(from, to, { recursive: true });
}

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await copyTreeFresh("app");
  await copyTreeFresh("screenshots");
  const dossierBytes = buildDossier(outputDir, {
    text_max_bytes: dossierTextCapBytes,
  });
  await writeFile(join(outputDir, "dossier.json"), dossierBytes);
}

await main();
