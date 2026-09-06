import { readFileSync } from 'fs';
import vm from 'vm';
// Exercise the real module graph in node with a DOM shim.
const els = ['version','version-bare','agents','skills','commands','mcp-tools','stars','downloads']
  .map((k) => ({ getAttribute: () => k, textContent: 'PLACEHOLDER', dataset: {}, _k: k }));
globalThis.document = {
  readyState: 'complete',
  querySelectorAll: (sel) => (sel === '[data-stat]' ? els : []),
  addEventListener: () => {},
  getElementById: () => null,
};
globalThis.localStorage = { store:{}, getItem(k){return this.store[k]??null;}, setItem(k,v){this.store[k]=v;}, removeItem(k){delete this.store[k];} };
globalThis.window = globalThis;
const origFetch = globalThis.fetch;
globalThis.fetch = (u, o) => origFetch(u.startsWith('http') ? u : new URL(u.replace(/^\.\//,''), 'file://' + process.cwd() + '/').pathname, o)
  .catch(() => { throw new Error('fetch failed ' + u); });
// data/stats.json is local: serve it from disk
globalThis.fetch = (u, o) => {
  if (String(u).includes('stats.json')) {
    const body = readFileSync(new URL('../data/stats.json', import.meta.url), 'utf8');
    return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(body)) });
  }
  return origFetch(u, o);
};
const { statsService } = await import(new URL('../js/services/statsService.js', import.meta.url).href);
const stats = await statsService.get();
console.log('resolved:', stats);
const npmLatest = (await (await origFetch('https://registry.npmjs.org/oh-my-claude-sisyphus/latest')).json()).version;
if (stats.version !== npmLatest) throw new Error(`version ${stats.version} != npm latest ${npmLatest}`);
if (!stats.stars || !stats.downloads) throw new Error('live stars/downloads missing');
if (stats.agents !== 19 || stats.skills !== 37 || stats.commands !== 21 || stats.mcpTools !== 55) throw new Error('counts not carried from stats.json');
console.log(`\nOK: statsService resolves npm latest v${npmLatest}, live stars=${stats.stars}, downloads=${stats.downloads}, counts 19/37/21/55`);
