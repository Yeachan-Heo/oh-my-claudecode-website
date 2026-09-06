#!/usr/bin/env node
/**
 * Auto-sync website metadata from the oh-my-claudecode source repo.
 *
 * Syncs:
 *   - version   -> index.html, data/stats.json (from package.json)
 *   - agents    -> count of agents/*.md
 *   - skills    -> count of skills/<name>/ directories
 *   - commands  -> count of commands/*.md
 *   - mcpTools  -> live tools/list count from the shipped bridge/mcp-server.cjs
 *
 * Static markup is only the no-JS fallback: js/services/statsService.js
 * resolves version/downloads/stars live from npm + GitHub on every page load.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const candidateRoots = [
  process.env.OMC_SOURCE_DIR,
  join(ROOT, 'oh-my-claudecode-source'),
  join(ROOT, '..', 'oh-my-claudecode'),
  join(ROOT, '..', 'oh-my-claudecode-main')
].filter(Boolean);

let sourceRoot = null;
let pkg = null;

for (const root of candidateRoots) {
  const pkgPath = join(root, 'package.json');
  if (!existsSync(pkgPath)) continue;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    sourceRoot = root;
    console.log(`Found source repo at: ${root}`);
    break;
  } catch (e) {
    console.warn(`Failed to parse ${pkgPath}: ${e.message}`);
  }
}

// OMC_VERSION lets the stats workflow push the published npm version into the
// static markup without a source checkout (counts then stay as-is).
const requestedVersion = process.env.OMC_VERSION || pkg?.version;

if (!requestedVersion) {
  console.error('ERROR: Could not find the oh-my-claudecode source repo in:');
  candidateRoots.forEach((p) => console.error(`  - ${p}`));
  console.error('\nSet OMC_SOURCE_DIR to a checkout, or OMC_VERSION to a published version.');
  process.exit(1);
}
if (!/^\d+\.\d+\.\d+/.test(requestedVersion)) {
  console.error(`ERROR: Unexpected source version: ${requestedVersion}`);
  process.exit(1);
}

/** Compare dotted numeric versions; prerelease suffixes sort below the release. */
function compareVersions(a, b) {
  const parse = (v) => {
    const [core, pre] = String(v).split('-', 2);
    return { nums: core.split('.').map(Number), pre: pre || null };
  };
  const left = parse(a);
  const right = parse(b);
  for (let i = 0; i < 3; i++) {
    const diff = (left.nums[i] || 0) - (right.nums[i] || 0);
    if (diff !== 0) return diff;
  }
  if (left.pre === right.pre) return 0;
  if (!left.pre) return 1;
  if (!right.pre) return -1;
  return left.pre < right.pre ? -1 : 1;
}

function countFiles(relative, suffix) {
  const dir = join(sourceRoot, relative);
  if (!existsSync(dir)) return null;
  return readdirSync(dir).filter((f) => f.endsWith(suffix)).length;
}

function countDirectories(relative) {
  const dir = join(sourceRoot, relative);
  if (!existsSync(dir)) return null;
  return readdirSync(dir).filter((entry) => statSync(join(dir, entry)).isDirectory()).length;
}

/**
 * Ask the shipped MCP bundle how many tools it actually exposes.
 * Counting registrations statically is unreliable: tools arrive from many
 * modules and some are arrays, so the real answer only exists at runtime.
 */
function countMcpTools() {
  const bundle = join(sourceRoot, 'bridge', 'mcp-server.cjs');
  if (!existsSync(bundle)) return Promise.resolve(null);

  return new Promise((resolve) => {
    const child = spawn('node', [bundle], {
      cwd: sourceRoot,
      stdio: ['pipe', 'pipe', 'ignore']
    });
    let buffer = '';
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      child.kill();
      resolve(value);
    };

    const send = (message) => child.stdin.write(JSON.stringify(message) + '\n');

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (!line) continue;
        let message;
        try {
          message = JSON.parse(line);
        } catch (e) {
          continue;
        }
        if (message.id === 1) {
          send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
        }
        if (message.id === 2) {
          const tools = message.result && message.result.tools;
          finish(Array.isArray(tools) ? tools.length : null);
        }
      }
    });

    child.on('error', () => finish(null));
    send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'website-sync', version: '1' }
      }
    });
    setTimeout(() => finish(null), 30000);
  });
}

const counts = sourceRoot
  ? {
      agents: countFiles('agents', '.md'),
      skills: countDirectories('skills'),
      commands: countFiles('commands', '.md'),
      mcpTools: await countMcpTools()
    }
  : { agents: null, skills: null, commands: null, mcpTools: null };
console.log('Source counts:', counts);

// ---------------------------------------------------------------------------
// data/stats.json — canonical offline fallback consumed by the stats service
// ---------------------------------------------------------------------------
const statsPath = join(ROOT, 'data', 'stats.json');
let stats = {};
try {
  stats = JSON.parse(readFileSync(statsPath, 'utf8'));
} catch (e) {
  console.warn(`Recreating ${statsPath}: ${e.message}`);
}

// Never move the site backwards: the hourly source sync and the 2-hourly npm
// stats sync both write here, and either input can briefly be the older one.
const version =
  stats.version && compareVersions(stats.version, requestedVersion) > 0
    ? stats.version
    : requestedVersion;
console.log(
  `Target version: v${version}` +
    (version === requestedVersion ? '' : ` (kept ahead of requested v${requestedVersion})`)
);

const nextStats = {
  version,
  agents: counts.agents ?? stats.agents ?? 0,
  skills: counts.skills ?? stats.skills ?? 0,
  commands: counts.commands ?? stats.commands ?? 0,
  mcpTools: counts.mcpTools ?? stats.mcpTools ?? 0,
  downloads: stats.downloads ?? 0,
  stars: stats.stars ?? 0,
  forks: stats.forks ?? 0,
  lastUpdated: new Date().toISOString()
};

const statsChanged = Object.keys(nextStats).some(
  (key) => key !== 'lastUpdated' && nextStats[key] !== stats[key]
);
if (statsChanged) {
  writeFileSync(statsPath, JSON.stringify(nextStats, null, 2) + '\n');
  console.log(`Updated ${statsPath}`);
} else {
  console.log('data/stats.json already up-to-date');
}

// ---------------------------------------------------------------------------
// HTML version + count references
// ---------------------------------------------------------------------------
const statValues = {
  version: `v${version}`,
  'version-bare': version,
  agents: counts.agents !== null ? String(counts.agents) : null,
  skills: counts.skills !== null ? String(counts.skills) : null,
  commands: counts.commands !== null ? String(counts.commands) : null,
  'mcp-tools': counts.mcpTools !== null ? String(counts.mcpTools) : null
};

/** Rewrite the text of `<tag ... data-stat="key" ...>text</tag>` elements. */
function syncStatElements(content) {
  let updated = content;
  for (const [key, value] of Object.entries(statValues)) {
    if (value === null) continue;
    const pattern = new RegExp(`(<(\\w+)([^>]*\\bdata-stat="${key}"[^>]*)>)[^<]*(</\\2>)`, 'g');
    updated = updated.replace(pattern, `$1${value}$4`);
  }
  return updated;
}

/**
 * Meta tags and social-card copy cannot carry a `data-stat` element, so the
 * capability counts embedded in that prose are rewritten by pattern instead.
 */
function syncProseCounts(content) {
  let updated = content;
  const prose = [
    [counts.agents, /\b\d+ specialized agents\b/g, (n) => `${n} specialized agents`],
    [counts.skills, /\b\d+ skills\b/g, (n) => `${n} skills`],
    [counts.commands, /\b\d+ commands\b/g, (n) => `${n} commands`],
    [counts.mcpTools, /\b\d+ MCP tools\b/g, (n) => `${n} MCP tools`]
  ];
  for (const [value, pattern, render] of prose) {
    if (value === null) continue;
    updated = updated.replace(pattern, render(value));
  }
  return updated;
}

const indexPath = join(ROOT, 'index.html');
const original = readFileSync(indexPath, 'utf8');
const versionMatch = original.match(/v(\d+\.\d+\.\d+)/);
const currentVersion = versionMatch ? versionMatch[1] : null;

if (!currentVersion) {
  console.error(`ERROR: Could not detect current website version in ${indexPath}`);
  process.exit(1);
}

if (currentVersion === version) {
  console.log(`Website version already up-to-date: v${version}`);
} else {
  console.log(`Updating version: v${currentVersion} -> v${version}`);
}

/**
 * Historical release notes must keep naming their own version, so only the
 * live surfaces are rewritten: `data-stat` elements, prose counts, meta
 * descriptions, the docs sidebar badge, and unpinned install guidance.
 */
function syncLiveVersionClaims(content) {
  return content
    .replace(
      /(<meta[^>]*content="[^"]*?)v\d+\.\d+\.\d+([^"]*")/g,
      `$1v${version}$2`
    )
    .replace(
      /(<span class="sidebar-brand__version"[^>]*>)v\d+\.\d+\.\d+(<\/span>)/g,
      `$1v${version}$2`
    )
    .replace(
      /(<span class="whats-new-badge__version"[^>]*>)v\d+\.\d+\.\d+(<\/span>)/g,
      `$1v${version}$2`
    )
    .replace(
      /(releases\/tag\/)v\d+\.\d+\.\d+/g,
      `$1v${version}`
    );
}

for (const file of ['index.html', 'docs/index.html']) {
  const filePath = join(ROOT, file);
  if (!existsSync(filePath)) continue;

  const before = readFileSync(filePath, 'utf8');
  let content = before;

  if (currentVersion !== version) {
    const escaped = currentVersion.replace(/\./g, '\\.');
    content = content
      .replace(new RegExp(`(oh-my-claude-sisyphus@)${escaped}\\b`, 'g'), `$1${version}`)
      .replace(new RegExp(`(What's New in )${escaped}\\b`, 'g'), `$1${version}`);
  }

  content = syncLiveVersionClaims(syncProseCounts(syncStatElements(content)));

  if (content !== before) {
    writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

console.log('Metadata sync complete!');
