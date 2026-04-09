---
name: sync-omc-docs
description: Sync content/docs/ in this website with the upstream Yeachan-Heo/oh-my-claudecode repo. Bootstraps a shallow clone under .omc/upstream/, fast-forwards on every run, walks a known mapping table, preserves EN↔KO page parity, and bumps version references.
triggers:
  - "sync docs"
  - "sync omc"
  - "update docs from upstream"
  - "pull omc changes"
  - "/sync-omc-docs"
type: workflow
scope: project
---

# sync-omc-docs

Operational skill for keeping `content/docs/` aligned with the upstream
oh-my-claudecode repo.

## When to use

- A new OMC version was released and the website still shows the old version
- A new agent / skill / hook was added upstream
- A user reports stale information on `omc.vibetip.help`
- Routine "is anything out of date?" health check

## Constants

| Key | Value |
|---|---|
| `UPSTREAM_REPO` | `https://github.com/Yeachan-Heo/oh-my-claudecode.git` |
| `UPSTREAM_PATH` | `.omc/upstream/oh-my-claudecode` (relative to website repo root) |
| `UPSTREAM_BRANCH` | `main` |
| `WEBSITE_VERSION_FILE` | `src/app/[lang]/docs/layout.tsx` (search `v4.9.3` style) |
| `LANDING_AGENTS_CONST` | `src/app/[lang]/page.tsx` (`AGENTS` object) |
| `SYNC_NOTES` | `.omc/docs-sync-notes.md` |

## Workflow

### Step 1 — Bootstrap upstream clone (only if missing)

```bash
if [ ! -d .omc/upstream/oh-my-claudecode/.git ]; then
  mkdir -p .omc/upstream
  git clone --depth=1 https://github.com/Yeachan-Heo/oh-my-claudecode.git \
    .omc/upstream/oh-my-claudecode
fi
```

**CRITICAL prerequisite — eslint must ignore the upstream clone.** Running
`npm run lint` after the clone will scan the upstream `bridge/cli.cjs`,
`bridge/mcp-server.cjs`, `dist/__tests__/*` etc. and fail with
`@typescript-eslint/unbound-method` rule-not-found errors. This is a tooling
artifact, not a real defect.

Verify `eslint.config.mjs` includes `.omc/` in its ignores:

```js
{ ignores: [".next/", ".source/", "node_modules/", ".omc/", ".sisyphus/", "dist/"] }
```

If the ignores entry is missing `.omc/`, edit the flat config (NOT a separate
`.eslintignore` file — this project uses flat config) BEFORE running any
verification step.

### Step 2 — Fast-forward to latest upstream

```bash
cd .omc/upstream/oh-my-claudecode
git fetch --depth=1 origin main
git reset --hard origin/main
cd -
```

Use `reset --hard` rather than `pull` so the local clone is always a clean
mirror of upstream — no merge surprises.

### Step 3 — Read both versions

Upstream version (try in order):
1. `.omc/upstream/oh-my-claudecode/package.json` → `.version`
2. `.omc/upstream/oh-my-claudecode/VERSION`
3. Most-recent tag: `git -C .omc/upstream/oh-my-claudecode describe --tags --abbrev=0`
4. `.omc/upstream/oh-my-claudecode/CHANGELOG.md` first heading

Website version:
- `Grep "v[0-9]+\.[0-9]+\.[0-9]+" src/app/[lang]/docs/layout.tsx`
- Also check `src/app/[lang]/page.tsx` hero copy if any
- Also check `content/docs/reference/changelog.mdx` if present

If equal → STOP and report `Already at v{version}` unless user passed `--force`.

### Step 4 — Surface upstream changes

```bash
cd .omc/upstream/oh-my-claudecode
git log --oneline ^v{WEBSITE_VERSION} HEAD 2>/dev/null \
  || git log --oneline -50    # fallback if tag missing
```

Read the upstream `CHANGELOG.md` for the version range
`{WEBSITE_VERSION}..{UPSTREAM_VERSION}` and present it to the user as the
"what's new" summary BEFORE applying any changes.

### Step 5 — Walk the mapping table

This table mirrors the prior sync session documented in `.omc/docs-sync-notes.md`.
**Verify each row exists on first run** — mark stale entries and update this
SKILL.md as you go.

| Upstream source | Website target(s) | Notes |
|---|---|---|
| `docs/GETTING-STARTED.md` | `content/docs/getting-started/index.mdx` | EN canonical |
| `docs/ARCHITECTURE.md` | `content/docs/concepts/index.mdx` + `content/docs/agents/**` | Agent catalog spans many files |
| `docs/HOOKS.md` | `content/docs/hooks/{index,core-hooks,context-hooks,lifecycle-events,magic-keywords}.mdx` | 5 pages |
| `docs/TOOLS.md` | `content/docs/tools/**` | 7 pages |
| `docs/REFERENCE.md` | `content/docs/reference/{index,environment,configuration,quick-commands}.mdx` | |
| `docs/MIGRATION.md` | `content/docs/reference/migration.mdx` + `changelog.mdx` | Pure version-history feed |
| `docs/CJK-IME-KNOWN-ISSUES.md` | `content/docs/reference/cjk-ime.mdx` | |
| `agents/<name>/AGENT.md` (or `definitions.ts`) | `content/docs/agents/{lane}/<name>.mdx` | One file per agent |
| `claude-skills/<name>/SKILL.md` (or skill catalog) | `content/docs/skills/{utility|workflow}/<name>.mdx` | One file per skill |
| Magic-keyword detector source (`keyword-detector.mjs`) | `content/docs/hooks/magic-keywords.mdx` | Triggers must match runtime |

### Step 6 — Diff each pair

For every mapping row:

1. Read upstream source file (`.omc/upstream/oh-my-claudecode/<src>`)
2. Read website target MDX (`content/docs/<target>`)
3. Strip MDX wrapping (frontmatter, JSX components, layout chrome)
4. Compare semantic content — focus on:
   - Code blocks and command examples (must match upstream verbatim)
   - Numbered lists and step counts
   - Counts (number of agents, skills, hooks, tools) — **use case-INSENSITIVE
     grep with multiple patterns**: e.g. `"30 Skills"`, `"30 skills"`,
     `"30개 스킬"`, `"30개의 스킬이"`
   - Version strings (`v4.X.Y` AND `4.X.Y` — both forms appear)
   - Trigger keyword lists
5. Surface differences as a structured list before editing

### Step 6.5 — Update Fumadocs `meta.json` for new pages (BLOCKING)

**This step is mandatory whenever a new MDX file is added.** Without it, the
new page renders at its route but **does not appear in the sidebar / page
tree**. Routes work, navigation does not.

For each new MDX page:

1. Identify the parent directory's `meta.json` and `meta.ko.json` (Fumadocs
   uses these to order the sidebar). Example: a new file at
   `content/docs/skills/utility/foo.mdx` requires updates to
   `content/docs/skills/utility/meta.json` AND `meta.ko.json`.
2. Add the new page slug (without `.mdx` / `.ko.mdx` extension) to the
   `pages` array. Pick a sensible position based on adjacency / category.
3. **Update BOTH `meta.json` AND `meta.ko.json`.** EN/KO parity here is its
   own invariant — the website silently builds even if `meta.ko.json` is
   missing the entry, but the Korean sidebar will be incomplete.
4. After update, also audit existing meta files for stale EN/KO drift —
   the parallel files commonly diverge by one entry over time.

Verification grep:

```bash
diff <(jq -r '.pages[]' content/docs/skills/utility/meta.json | sort) \
     <(jq -r '.pages[]' content/docs/skills/utility/meta.ko.json | sort)
```

Empty diff = parity. Any drift = bug.

### Step 7 — Apply changes (interactive by default)

For each diff:
- **Verbatim region** (code, commands, shell): replace exactly
- **Prose region**: edit MDX while preserving site-specific framing
   (Fumadocs `<Steps>`, `<Tabs>`, `<Mermaid>` etc.)
- **New section upstream**: add new MDX section with site styling
- **Deleted section upstream**: remove from MDX, leave a note in changelog

If `--auto` flag was passed, apply non-prose diffs automatically and prompt
only for prose-level edits.

### Step 8 — Enforce EN ↔ KO parity (load-bearing invariant)

For every `.mdx` file edited in Step 7, the matching `.ko.mdx` MUST be
updated in the same commit. Two acceptable strategies:

- **Translate now**: edit the `.ko.mdx` with a Korean translation matching the
  EN edit. Use Claude itself for translation; do not invoke external TM.
- **Mark for translation**: prepend a `<Callout>TODO ko-translation: {summary}</Callout>`
  banner inside the affected section, keeping the rest of the KO file intact.

The current parity is **74 EN ↔ 74 KO** (verified 2026-04-09 via
`find content/docs -name "*.mdx"`). Drift here breaks the
[[../wiki/i18n-system|i18n fallback assumption]].

### Step 9 — Bump version references

Search and replace the OLD version with NEW version in these locations
(grep first to confirm):

- `src/app/[lang]/docs/layout.tsx` — `nav.title` version chip
- `src/app/[lang]/page.tsx` — hero copy if version mentioned
- `content/docs/reference/changelog.mdx` — add new entry at top
- `.omc/wiki/project-overview.md` and `nextjs-app-architecture.md` — update if
  the meta-wiki exists ([[../wiki/index]])

### Step 10 — Reconcile counts on landing page

Open `src/app/[lang]/page.tsx`. The `AGENTS` constant must satisfy:

```ts
const AGENTS = {
  'Build & Analysis': [...],   // count A
  Review:             [...],   // count B
  Domain:             [...],   // count C
  Coordination:       [...],   // count D
};
// total = A + B + C + D
```

The hero copy `'19 Specialized Agents'` (and Korean equivalent
`'19개 전문 에이전트'`) MUST match `total` (or `total` minus `deep-executor`
if it's still being treated as an executor variant — see commit `50bacf4`
for the current convention).

Cross-check against upstream `agents/` directory:

```bash
ls .omc/upstream/oh-my-claudecode/agents/ 2>/dev/null
```

Same exercise for skill counts (`'30 Automation Skills'`).

### Step 11 — Verify

Run sequentially:

1. `npm install` — only if package files changed (rare for doc sync)
2. `npm run lint` — catches MDX syntax errors and unused imports
3. `npm run build` (run_in_background recommended) — full Next.js build catches:
   - Broken MDX
   - Missing referenced files
   - Type errors in any touched `.tsx`
4. **Spot-check rendering**: load the changed pages in dev (`npm run dev`) and
   verify Mermaid blocks, Steps, Tabs render correctly

DO NOT mark sync complete until build is green.

### Step 12 — Commit & update notes

Single commit per sync session. Message format:

```
docs: sync website with omc-fork v{NEW_VERSION} source

- updated {N} pages: {list}
- bumped version refs from v{OLD} to v{NEW}
- agent count: {OLD_COUNT} → {NEW_COUNT}
- skill count: {OLD_COUNT} → {NEW_COUNT}
- ko parity: {translated|marked}
```

Append a new section to `.omc/docs-sync-notes.md`:

```markdown
## Sync log

### {YYYY-MM-DD} — v{OLD} → v{NEW}
- Upstream commit: {sha}
- Changed pages: {list}
- Open KO translations: {list or 'none'}
- Surprises / mapping updates: {notes}
```

## Hard rules

1. **Never `git push --force` or rewrite published commits** for the website.
2. **Never edit `.omc/upstream/`** — it's a read-only mirror. All edits land in
   `content/docs/` and `src/`.
3. **Never delete a `.ko.mdx`** without a matching plan — it breaks i18n
   fallback semantics.
4. **Never bypass the build verification** in Step 11. A passing diff is not
   the same as a passing build.
5. **Never run this skill on a dirty working tree** — `git status` must be
   clean before Step 1, otherwise unrelated changes get tangled into the
   sync commit.

## Idempotency contract

Running this skill twice in succession with no upstream changes MUST produce:
- Zero file modifications
- Zero git changes
- A `Already at v{version}` report

If the second run wants to write anything, it's a bug in the skill or in
the previous run.

## Known gotchas

### Cancel trap: global `~/.omc/state/ralph-state.json` (discovered 2026-04-09)

The persistent-mode hook (`persistent-mode.mjs`) reads ralph state from
MULTIPLE locations, including a **global fallback** at
`~/.omc/state/ralph-state.json` — NOT just the project-local
`.omc/state/sessions/{sessionId}/ralph-state.json`. When you ran
`state_clear(mode=ralph)` via MCP, the MCP tool only cleared the project-
local copy. The global copy still contained `active: true` + iteration
counter, so the hook kept firing on every Stop event with
`[RALPH LOOP - ITERATION N/100]`.

**Fix:** when cancelling ralph mode, also remove (or mark inactive) any
global state at `~/.omc/state/ralph-state.json`. Check for it even after
`state_clear` reports success. The MCP `state_clear` tool should eventually
cover this path but doesn't as of 4.11.x.

Reproduction:
```bash
# After state_clear via MCP:
cat ~/.omc/state/ralph-state.json  # might still show active: true
rm -f ~/.omc/state/ralph-state.json  # manual cleanup
```

### Discovered during Codex review of first dogfood run (2026-04-09)

- **Fumadocs `meta.json` requires manual update for new pages.** Routes auto-
  register from `[[...slug]]`, but the sidebar / page tree reads
  `content/docs/<section>/meta.json` (and `meta.ko.json`) to determine ORDER
  and VISIBILITY. New MDX files must be added to BOTH meta files explicitly.
  Build passes either way; the bug is silent. See Step 6.5.
- **Release-note anomaly: identical bodies on consecutive tags.** Upstream
  occasionally publishes a new tag (e.g. `v4.11.4`) whose release body is an
  unchanged copy of the previous tag's body (`v4.11.3`). Same for `v4.11.2`
  vs `v4.11.1`. **DO NOT synthesize a new narrative for the duplicate tag.**
  Mark it as a re-release of the previous tag and link to the canonical entry.
  Sync should detect this pattern automatically: if two adjacent release
  bodies hash-equal, stop and require manual review.
- **Skill count precision: total ≠ user-invocable.** Upstream `skills/`
  directory has 37 entries, but one (`omc-reference`) has
  `user-invocable: false` in its frontmatter. So:
  - "37 built-in skills" — accurate, includes internal `omc-reference`
  - "36 user-callable skills + 1 internal" — more precise
  Pick one phrasing and apply consistently. Don't mix.

### Discovered on first dogfood run (2026-04-09 sync v4.9.3 → v4.11.4)

- **ESLINT scans cloned upstream code** — `npm run lint` after cloning to
  `.omc/upstream/` scans `bridge/cli.cjs`, `bridge/mcp-server.cjs`,
  `dist/__tests__/*` and fails with `@typescript-eslint/unbound-method` rule-
  not-found errors. **Fix:** add `.omc/` to `eslint.config.mjs` ignores
  BEFORE running lint (see Step 1). This project uses flat config, not
  `.eslintignore`.
- **Skill count discrepancy: REFERENCE.md says 32, dir has 37.** Upstream
  `docs/REFERENCE.md` is internally stale ("Skills (32 Total)") but
  `.claude-plugin/skills/` actually has 37 entries. Trust the directory, not
  REFERENCE.md, for the user-facing count.
- **`omc-plan` vs `plan` directory naming.** Upstream `skills/plan/` is
  renamed to `omc-plan` at runtime registration via SKILL.md frontmatter.
  Don't double-count.
- **`vision` agent in REFERENCE.md but not `agents/` dir.** REFERENCE.md
  table mentions `vision` but `agents/` has no `vision.md` file. Source of
  truth: the directory listing, not the table.
- **`deep-executor`, `build-fixer` are former agent names** (deprecated,
  removed in v4.x). The `agents/build-analysis/{executor,debugger}.mdx` files
  document them under "Former Name" tables — keep those as compatibility
  references; do NOT add them back to the landing `AGENTS` const.
- **`(current)` marker timing trap.** When adding new changelog entries,
  the bump needs to be split: strip `(current)` from the old entry in early
  phase, add the new entry with `(current)` in later phase (when the new
  entry actually exists). Doing both in one phase leaves an inconsistent
  intermediate state.
- **Case-sensitive grep traps.** Counting strings can appear in mixed cases:
  `"30 Skills"`, `"30 skills"`, `"30개 스킬"`, `"30개의 스킬이"`. The first
  diff pass should use case-insensitive grep + multiple count patterns.

### Older notes (from `.omc/docs-sync-notes.md`)

- **Upstream rename of `claude-skills/` ↔ `skills/`**: as of 4.x the canonical
  upstream directory is `skills/`. Older docs still reference `claude-skills/`.
- **`SKILL.md` triggers ≠ `keyword-detector.mjs` patterns**: when syncing
  magic-keywords page, source of truth is the `keyword-detector.mjs` file,
  NOT individual `SKILL.md` triggers.
- **`team` keyword is explicit-only**: not auto-detected. Don't accidentally
  add it to the magic-keywords list.
- **`security-reviewer` runtime model is sonnet, not opus** — even though
  `definitions.ts` may suggest otherwise. Verify against the running config.
- **`generate-thumbnail.js`, `social-preview.html`** are listed as legacy in
  `.gitignore`; don't touch them when syncing.

## Cross-references

- [[../wiki/index|Wiki Index]] — meta-doc for the website itself
- [[../wiki/docs-taxonomy|Docs Taxonomy]] — current EN/KO parity baseline
- [[../wiki/i18n-system|i18n System]] — why parity matters
- `.omc/docs-sync-notes.md` — historical sync context
