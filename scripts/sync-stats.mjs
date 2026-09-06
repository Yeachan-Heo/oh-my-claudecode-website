#!/usr/bin/env node
/**
 * Refresh data/stats.json from public npm + GitHub APIs.
 *
 * This file is the offline fallback for js/services/statsService.js (the browser
 * resolves the same endpoints live on every page load), but keeping it fresh
 * means the first paint and no-JS crawlers also see current numbers.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATS_PATH = join(ROOT, 'data', 'stats.json');
const PACKAGE = 'oh-my-claude-sisyphus';
const REPO = 'Yeachan-Heo/oh-my-claudecode';

async function fetchJson(url) {
  const headers = { Accept: 'application/json' };
  if (process.env.GITHUB_TOKEN && url.startsWith('https://api.github.com/')) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return response.json();
}

const stats = JSON.parse(readFileSync(STATS_PATH, 'utf8'));

const [latest, downloads, repo] = await Promise.all([
  fetchJson(`https://registry.npmjs.org/${PACKAGE}/latest`).catch((e) => {
    console.warn(`npm version lookup failed: ${e.message}`);
    return null;
  }),
  fetchJson(`https://api.npmjs.org/downloads/point/last-month/${PACKAGE}`).catch((e) => {
    console.warn(`npm downloads lookup failed: ${e.message}`);
    return null;
  }),
  fetchJson(`https://api.github.com/repos/${REPO}`).catch((e) => {
    console.warn(`GitHub lookup failed: ${e.message}`);
    return null;
  })
]);

if (!latest && !downloads && !repo) {
  console.error('ERROR: every metadata source failed; leaving data/stats.json untouched');
  process.exit(1);
}

const next = { ...stats };
if (latest && typeof latest.version === 'string') next.version = latest.version;
if (downloads && typeof downloads.downloads === 'number') next.downloads = downloads.downloads;
if (repo && typeof repo.stargazers_count === 'number') {
  next.stars = repo.stargazers_count;
  next.forks = repo.forks_count;
}

const changed = Object.keys(next).some((key) => key !== 'lastUpdated' && next[key] !== stats[key]);
if (!changed) {
  console.log('Stats already up-to-date:', JSON.stringify(next));
  process.exit(0);
}

next.lastUpdated = new Date().toISOString();
writeFileSync(STATS_PATH, JSON.stringify(next, null, 2) + '\n');
console.log('Updated data/stats.json:', JSON.stringify(next));
