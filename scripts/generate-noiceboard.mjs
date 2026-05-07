#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDemoStats, DEFAULT_ORDINAL, DEFAULT_REPO, DEFAULT_USER, renderProfileSnippet, renderSvg } from "../src/noiceboard.mjs";
import { fetchGitHubStats } from "../src/github.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const user = process.env.GITHUB_USER || process.env.GITHUB_REPOSITORY_OWNER || DEFAULT_USER;
const targetRepoName = process.env.NICE_REPO || DEFAULT_REPO;
const repoOrdinal = Number(process.env.REPO_ORDINAL || DEFAULT_ORDINAL);
const outDir = path.resolve(root, process.env.NOICEBOARD_OUT_DIR || "data");
const useDemo = process.env.NOICEBOARD_DEMO === "1" || process.argv.includes("--demo");
const strict = process.env.NOICEBOARD_STRICT === "1";

await mkdir(outDir, { recursive: true });

let stats;
let source = "live";

if (useDemo) {
  stats = buildDemoStats({ user });
  source = "demo";
} else {
  try {
    stats = await fetchGitHubStats({
      user,
      token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "",
      repoOrdinal,
      targetRepoName
    });
  } catch (error) {
    if (strict) {
      throw error;
    }
    source = "demo fallback";
    stats = buildDemoStats({ user });
    console.warn(`[noiceboard] ${error.message}`);
    console.warn("[noiceboard] Using demo data. Set GITHUB_TOKEN or run from GitHub Actions for live stats.");
  }
}

const svg = renderSvg(stats);
const snippet = renderProfileSnippet(user, targetRepoName);

await writeFile(path.join(outDir, "noiceboard.svg"), svg, "utf8");
await writeFile(path.join(outDir, "stats.json"), `${JSON.stringify(stats, null, 2)}\n`, "utf8");
await writeFile(path.join(outDir, "profile-snippet.md"), `${snippet}\n`, "utf8");

console.log(`[noiceboard] Generated ${source} board for ${stats.user.login}.`);
console.log(`[noiceboard] Repo #${stats.niceRepo.ordinal}: ${stats.niceRepo.name}.`);
console.log(`[noiceboard] Wrote ${path.relative(root, outDir)}/noiceboard.svg and stats.json.`);
