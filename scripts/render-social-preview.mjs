#!/usr/bin/env node
// Renders scripts/social-preview/banner.html -> social-preview.jpg (1280x640)
// using headless Chrome. Stats chips are filled from data/stats.json.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, "scripts", "social-preview");
const out = join(root, "social-preview.jpg");

const chromeCandidates = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const chrome = chromeCandidates.find((p) => existsSync(p));
if (!chrome) {
  console.error("No Chrome binary found; set CHROME_BIN");
  process.exit(1);
}

const stats = JSON.parse(readFileSync(join(root, "data", "stats.json"), "utf8"));
let html = readFileSync(join(srcDir, "banner.html"), "utf8");
for (const key of ["agents", "skills", "mcpTools"]) {
  html = html.replace(
    new RegExp(`(<b data-stat="${key}">)[^<]*(</b>)`),
    `$1${stats[key]}$2`,
  );
}

const work = mkdtempSync(join(tmpdir(), "omc-banner-"));
writeFileSync(join(work, "banner.html"), html);
copyFileSync(join(srcDir, "omc-golem.png"), join(work, "omc-golem.png"));

const res = spawnSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1280,640",
    "--virtual-time-budget=5000",
    `--screenshot=${out}`,
    `file://${join(work, "banner.html")}`,
  ],
  { stdio: "inherit" },
);
rmSync(work, { recursive: true, force: true });
if (res.status !== 0) process.exit(res.status ?? 1);
console.log(`wrote ${out}`);
