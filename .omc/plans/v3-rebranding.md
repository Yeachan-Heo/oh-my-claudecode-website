# oh-my-claude-sisyphus v3.0 Rebranding Plan

## Executive Summary

### What is Changing

Transform the oh-my-claude-sisyphus website from a **confrontational "banned rebel" aesthetic** to a **professional, nerdy developer tool** that mirrors the presentation quality of Claude Code and Oh-My-Zsh.

### Why This Matters

| Current Problem | Impact | v3.0 Solution |
|-----------------|--------|---------------|
| "BANNED" narrative | Alienates professional users | Community-focused narrative |
| $FUCKCLAUDE memecoin section | Creates unprofessional association | Remove entirely |
| Glitch/chaos visual effects | Feels amateur, distracting | Clean terminal aesthetic |
| Sarcastic agent testimonials | Undermines credibility | Proper capability documentation |
| No trust signals | No quality indicators | Badges, contributors, security links |
| Adversarial tone toward Anthropic | Damages potential partnerships | Neutral, capability-focused messaging |

### Target Identity

**"A delightful multi-agent framework for Claude Code"**

- Professional yet approachable
- Nerdy self-aware humor (not confrontational)
- Community-driven development emphasis
- Trust through transparency

---

## Visual Design Specification

### Color Palette Transformation

#### FROM (Chaos Palette - v2.x)
```css
--chaos-red: #ff0040;      /* Aggressive, warning */
--chaos-cyan: #00ffff;     /* Neon, harsh */
--chaos-magenta: #ff00ff;  /* Loud, distracting */
--chaos-yellow: #ffff00;   /* Glaring */
--chaos-black: #0a0a0a;    /* Pure dark */
```

#### TO (Professional Palette - v3.0)
```css
/* Primary - Terminal Dark Theme */
--bg-primary: #0d1117;        /* GitHub dark background */
--bg-secondary: #161b22;      /* Elevated surfaces */
--bg-tertiary: #21262d;       /* Cards, containers */

/* Accent Colors - Subtle & Professional */
--accent-primary: #58a6ff;    /* Links, interactive elements (GitHub blue) */
--accent-secondary: #7ee787;  /* Success states, terminal green */
--accent-highlight: #d29922;  /* Warnings, emphasis (Claude orange-adjacent) */
--accent-subtle: #8b949e;     /* Secondary text, borders */

/* Text Hierarchy */
--text-primary: #f0f6fc;      /* Headings, primary content */
--text-secondary: #c9d1d9;    /* Body text */
--text-muted: #8b949e;        /* Captions, metadata */

/* Semantic */
--border-default: #30363d;    /* Subtle borders */
--border-emphasis: #58a6ff;   /* Focused elements */
```

### Typography

| Element | Current | v3.0 |
|---------|---------|------|
| Font Family | Courier New only | `'JetBrains Mono', 'SF Mono', 'Fira Code', monospace` |
| Headings | Glitch effects | Clean, weighted hierarchy |
| Body | Single weight | Variable weights (400, 500, 600) |
| Code blocks | Basic styling | Syntax highlighting theme |

### Layout Principles

1. **Maximum Width**: 1200px (focused reading experience)
2. **Section Padding**: 80px vertical, 24px horizontal
3. **Card Grid**: 3-column on desktop, responsive collapse
4. **Whitespace**: Generous spacing between sections

### Remove Entirely

- [x] Scanlines overlay effect
- [x] Glitch text animations (::before, ::after pseudo-elements)
- [x] Chaos particles (falling "BANNED" text)
- [x] Screen shake animation
- [x] Panic mode (typing "anthropic" trigger)
- [x] Ultra chaos mode (Konami code)
- [x] Random hue-rotate glitch effects
- [x] Legal popup self-destruct timer
- [x] Ban screen intro sequence
- [x] Sound toggle (no audio needed)

### Keep & Refine

- [x] Terminal window aesthetic (macOS dots, but cleaner)
- [x] Monospace typography (upgrade to JetBrains Mono)
- [x] Dark background theme (refine colors)
- [x] Copy buttons on code blocks
- [x] Smooth scroll behavior
- [x] GitHub stars counter (move to badge)

---

## Content Strategy

### Messaging Transformation

#### Hero Section

| v2.x (Current) | v3.0 (Target) |
|----------------|---------------|
| "oh-my-claude-sisyphus" with glitch | "oh-my-claude-sisyphus" clean typography |
| "They Tried to Ban Us" (title tag) | "Multi-Agent Framework for Claude Code" |
| "Written with Claude Code - ironically. Anthropic, what are you gonna do next?" | "A powerful multi-agent orchestration system that makes Claude Code even better." |
| "Install (if you dare)" button | "Get Started" button |

#### Tagline Options (Pick One)

1. **Oh-My-Zsh Style**: "A delightful multi-agent framework for Claude Code. 2,000+ lines of orchestration. 19 agents. One mission."
2. **Technical Focus**: "Multi-agent orchestration for Claude Code with intelligent model routing, 11 commands, and 18 lifecycle hooks."
3. **Community Focus**: "Built by developers, for developers. The most comprehensive plugin system for Claude Code."

**Recommendation**: Option 1 - balances nerdy with approachable.

### Section Structure

#### Current Structure (Remove/Modify/Keep)

| Section | Status | Action |
|---------|--------|--------|
| Ban Screen | REMOVE | Delete entirely |
| Hero | MODIFY | New messaging, add badges |
| "The Saga" Timeline | REMOVE | Replace with "Why oh-my-claude-sisyphus?" |
| "The Agents" Grid | MODIFY | Convert to capability documentation |
| Installation | KEEP | Add OS compatibility table |
| Features | MODIFY | Expand with proper documentation |
| $FUCKCLAUDE Memecoin | REMOVE | Delete entirely |
| Footer | MODIFY | Add proper links, remove sarcasm |

#### New Section Structure

1. **Hero**
   - Project name + version badge
   - GitHub badges row (stars, forks, contributors, license, CI)
   - One-liner description
   - Primary CTA buttons
   - Animated terminal demo (GIF)

2. **Why oh-my-claude-sisyphus?** (replaces "The Saga")
   - 3-column value proposition
   - "Intelligent Model Routing" / "19 Specialized Agents" / "18 Lifecycle Hooks"
   - Brief, benefit-focused copy

3. **Getting Started** (replaces Installation)
   - OS compatibility table (macOS, Linux, Windows)
   - Multiple installation methods with tabs
   - Post-install verification command

4. **Agents** (refactored)
   - Table format instead of cards
   - Columns: Agent Name, Model Tier, Purpose, When to Use
   - No more "testimonials" - just facts

5. **Features**
   - Feature grid with icons
   - Each feature links to documentation

6. **Community**
   - Contributor avatars grid
   - Links to Discord, GitHub Discussions, Issues
   - "Built with Claude Code" acknowledgment

7. **Footer**
   - Documentation links
   - Security policy link
   - License information
   - Version info

### Agent Documentation Transformation

#### Current (Sarcastic Testimonials)
```
Oracle: "I predicted the ban. I predicted the resurrection.
        I predict you will install this."
```

#### Target (Professional Documentation)
```
| Agent | Model | Purpose | Best For |
|-------|-------|---------|----------|
| Oracle | Opus | Architecture analysis, root cause debugging | Complex system issues, architectural decisions |
```

---

## Badge & Trust Signal Implementation

### GitHub Badges (shields.io)

Add to hero section, horizontal row:

```markdown
![GitHub stars](https://img.shields.io/github/stars/Yeachan-Heo/oh-my-claude-sisyphus?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/Yeachan-Heo/oh-my-claude-sisyphus?style=for-the-badge)
![GitHub contributors](https://img.shields.io/github/contributors/Yeachan-Heo/oh-my-claude-sisyphus?style=for-the-badge)
![License](https://img.shields.io/github/license/Yeachan-Heo/oh-my-claude-sisyphus?style=for-the-badge)
![npm version](https://img.shields.io/npm/v/oh-my-claude-sisyphus?style=for-the-badge)
```

### Quality Badges (Aspirational)

Consider adding once applicable:
- OpenSSF Best Practices badge
- Code coverage badge
- CI status badge (GitHub Actions)

### Trust Links (Footer)

- Link to SECURITY.md (create if not exists)
- Link to CONTRIBUTING.md
- Link to CODE_OF_CONDUCT.md
- Link to CHANGELOG.md

---

## Component Inventory

### Components to DELETE (13 items)

| Component | Lines | Reason |
|-----------|-------|--------|
| `#ban-screen` | 76-148 | Adversarial intro |
| Ban screen JS | 1399-1408 | Ban screen logic |
| Scanlines CSS | 51-74 | Distracting overlay |
| Glitch animations | 180-228 | Visual noise |
| Chaos particles CSS | 678-692 | Falling "BANNED" text |
| Chaos particles JS | 1458-1480 | Particle spawning |
| Ultra chaos mode | 694-736, 1482-1516 | Screen shake, Konami code |
| Panic mode | 738-751, 1518-1551 | Typing "anthropic" trigger |
| Legal popup | 754-814, 1553-1572 | Self-destruct timer |
| Random glitch JS | 1574-1582 | Hue-rotate effect |
| Sound toggle | 604-633, 1444-1456 | Audio controls |
| "The Saga" section | 977-1007 | Ban narrative timeline |
| Memecoin section | 1316-1361 | $FUCKCLAUDE content |

### Components to MODIFY (8 items)

| Component | Current | Target |
|-----------|---------|--------|
| Hero section | Glitch title, sarcastic tagline | Clean title, professional tagline, badges |
| Hero stats | Box style with chaos colors | Badge-style with neutral colors |
| Agent cards | Sarcastic testimonials | Capability documentation table |
| Installation terminals | Chaos styling | Clean terminal aesthetic |
| Features section | Basic grid | Expanded documentation grid |
| Footer | Sarcastic disclaimer | Professional links |
| Color variables | Chaos palette | Professional palette |
| Typography | Single font | Font stack with fallbacks |

### Components to ADD (9 items)

| Component | Description |
|-----------|-------------|
| Badge row | GitHub shields in hero |
| OS compatibility table | macOS/Linux/Windows support matrix |
| Animated demo | Terminal GIF or video |
| Agent documentation table | Proper agent reference |
| Contributor grid | Avatar grid with count |
| Community links | Discord, Discussions, Issues |
| Trust links | Security, Contributing, CoC |
| Version indicator | Current version badge |
| "Why" section | Value proposition cards |

---

## Implementation Phases

### Phase 1: Foundation (Critical Path)

**Goal**: Remove harmful content, establish new visual foundation

**Tasks**:
1. [ ] Delete ban screen HTML and CSS
2. [ ] Delete memecoin section entirely
3. [ ] Delete "The Saga" timeline section
4. [ ] Delete all chaos animation CSS (glitch, particles, shake)
5. [ ] Delete all easter egg JS (Konami, panic mode, legal popup)
6. [ ] Replace color variables with professional palette
7. [ ] Update `<title>` and meta tags
8. [ ] Remove sound toggle

**Acceptance Criteria**:
- No adversarial content visible
- No distracting animations
- Page loads directly to hero (no ban screen)

**Estimated Effort**: 2-3 hours

### Phase 2: Hero Transformation

**Goal**: Professional first impression

**Tasks**:
1. [ ] Rewrite hero title (remove glitch effect)
2. [ ] Add GitHub badge row
3. [ ] Rewrite tagline to professional messaging
4. [ ] Update CTA buttons text
5. [ ] Restyle stat boxes with new palette
6. [ ] Add animated terminal demo placeholder

**Acceptance Criteria**:
- Hero communicates professionalism
- Badges display correctly
- No confrontational messaging

**Estimated Effort**: 2 hours

### Phase 3: Content Restructure

**Goal**: Replace narrative sections with documentation

**Tasks**:
1. [ ] Create "Why oh-my-claude-sisyphus?" section
2. [ ] Convert agent cards to documentation table
3. [ ] Remove agent "testimonials"
4. [ ] Add OS compatibility table to installation
5. [ ] Expand features section with proper descriptions
6. [ ] Add tabbed installation methods

**Acceptance Criteria**:
- All agent information is factual
- Installation options are clear
- No sarcastic content remains

**Estimated Effort**: 3-4 hours

### Phase 4: Trust & Community

**Goal**: Establish credibility and community presence

**Tasks**:
1. [ ] Add contributor avatar grid
2. [ ] Add community links section
3. [ ] Update footer with trust links
4. [ ] Add version badge
5. [ ] Create SECURITY.md link (if exists in main repo)
6. [ ] Add "Built with Claude Code" acknowledgment

**Acceptance Criteria**:
- Clear path to community engagement
- Trust signals visible
- Professional footer

**Estimated Effort**: 2 hours

### Phase 5: Polish & Accessibility

**Goal**: Production-ready quality

**Tasks**:
1. [ ] Typography upgrade (JetBrains Mono)
2. [ ] Responsive testing and fixes
3. [ ] Accessibility audit (contrast, focus states)
4. [ ] Performance optimization
5. [ ] Update social preview image
6. [ ] SEO meta tags update

**Acceptance Criteria**:
- WCAG 2.1 AA compliance
- Fast load time
- Proper social sharing preview

**Estimated Effort**: 2-3 hours

---

## Risk Mitigation

### SEO Preservation

| Risk | Mitigation |
|------|------------|
| URL changes | Keep single-page structure, no URL changes needed |
| Meta description changes | Update gradually, keep key terms (multi-agent, Claude Code) |
| Title tag change | Redirect "banned" searchers is unlikely traffic source |

### Existing User Expectations

| Risk | Mitigation |
|------|------------|
| Users expect "chaos" aesthetic | Version bump to v3.0 signals major change |
| Memecoin community | Keep no reference, clean break |
| GitHub README references | Update README to match new site |

### Technical Risks

| Risk | Mitigation |
|------|------------|
| Breaking existing styles | Phase approach allows incremental testing |
| Mobile responsiveness | Test each phase on mobile |
| JavaScript errors | Remove unused JS before adding new |

---

## Success Criteria

### Quantitative

- [ ] Zero confrontational/adversarial content
- [ ] Zero references to bans, memecoins, or "chaos"
- [ ] 100% of agent descriptions are factual
- [ ] All badges render correctly
- [ ] Page load < 3 seconds
- [ ] Lighthouse accessibility score > 90

### Qualitative

- [ ] First impression is "professional developer tool"
- [ ] Messaging emphasizes capability, not rebellion
- [ ] Design is comparable to Oh-My-Zsh or Claude Code README
- [ ] A professional developer would feel comfortable sharing this

---

## Commit Strategy

Use atomic commits with conventional commit format:

```
Phase 1:
- chore: remove ban screen and memecoin section
- chore: delete chaos animations and easter eggs
- style: replace color palette with professional theme

Phase 2:
- feat: add GitHub badges to hero section
- content: rewrite hero messaging
- style: update hero section styling

Phase 3:
- content: convert agents to documentation table
- feat: add OS compatibility table
- content: create value proposition section

Phase 4:
- feat: add contributor grid
- feat: add community links section
- chore: update footer with trust links

Phase 5:
- style: upgrade typography to JetBrains Mono
- fix: accessibility improvements
- chore: update social preview and meta tags
```

---

## Reference Implementation Notes

### Oh-My-Zsh Patterns to Adopt

1. **Self-aware humor**: "won't make you a 10x developer...but you may feel like one"
2. **Contributor emphasis**: "2,400+ contributors" prominently displayed
3. **OS compatibility table**: Clear support matrix
4. **OpenSSF badge**: Quality signal (aspirational)
5. **Wiki/FAQ links**: Comprehensive documentation

### Claude Code Patterns to Adopt

1. **Badge row**: Stars, version, contributors in hero
2. **Feature tables**: Clear, scannable format
3. **Privacy/Security links**: Trust indicators
4. **Installation tabs**: Multiple methods clearly presented
5. **GIF demo**: Shows tool in action

---

## Appendix: Files Affected

### Primary File
- `/home/bellman/Workspace/Claude-Sisyphus-Test/oh-my-claude-sisyphus-website/index.html` (1630 lines)

### Supporting Files (if exist)
- `social-preview.html` - May need update for new branding
- `generate-thumbnail.js` - Thumbnail generation script

### New Files to Create (Optional)
- `.omc/assets/demo.gif` - Terminal demo animation
- CSS could be extracted to separate file for maintainability

---

## Plan Metadata

- **Plan Version**: 1.0
- **Created**: 2026-01-20
- **Author**: Prometheus (Strategic Planning Agent)
- **Status**: Ready for Implementation
- **Total Estimated Effort**: 11-14 hours

---

**PLAN_READY: /home/bellman/Workspace/Claude-Sisyphus-Test/oh-my-claude-sisyphus-website/.omc/plans/v3-rebranding.md**

---

To begin implementation, run `/start-work` with this plan.
