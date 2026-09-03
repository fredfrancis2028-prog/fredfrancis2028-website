# Campaign Website Session Handoff — P17

**Date:** September 2, 2026
**Repo:** `github.com/fredfrancis2028-prog/fredfrancis2028-website`
**Live site:** `fredfrancis2028.com`
**Deployed via:** Cloudflare Pages (auto-deploys from `main` branch)

---

## Quick reference

| Item | Value |
|---|---|
| CSS version (style.css) | 55 |
| CSS version (style2.css, index only) | 26 |
| JS version (site.js) | 9 |
| build-config.json css_version | 55 |
| build-config.json js_version | 9 |
| index.html css_version (front matter) | 26 |
| PAT for git operations | (stored in Claude memory; ask Fred or check prior session) |
| PAT auth format | `https://x-access-token:TOKEN@github.com/...` |
| Git user.email | `contact@fredfrancis2028.com` |
| Git user.name | `Fred Francis 2028` |
| Token masking | Always pipe git output through `sed "s/${TOKEN}/***TOKEN***/g"` |

---

## Repository structure

```
fredfrancis2028-website/
├── build.py                  # Static site generator (custom Python)
├── build-config.json         # Global config (css_version, js_version, etc.)
├── README.md                 # Styleguide and conventions (READ THIS FIRST)
├── .github/workflows/
│   ├── cloudflare-purge.yml  # Auto-purges CDN cache on every push
│   └── discord-notify.yml    # Posts to Discord when updates.json changes
├── src/
│   ├── assets/
│   │   ├── style.css         # All pages except index
│   │   ├── style2.css        # Index page only
│   │   └── site.js           # Nav, comment forms, listen buttons, video modal
│   ├── data/
│   │   └── whatsnew.json     # Front page "What's New" entries
│   ├── layouts/
│   │   ├── template-base.html    # Root layout (head, body, nav, footer, scripts)
│   │   ├── template-generic.html # Extends base; used by most pages
│   │   └── template-issue.html   # Extends base; used by issue pages
│   ├── partials/
│   │   ├── template-nav.html     # Navigation (brand link + hamburger menu)
│   │   ├── template-footer.html  # Footer with social links
│   │   ├── template-head.html    # Meta tags, OG defaults
│   │   └── template-favicons.html
│   ├── components/               # Reusable HTML snippets (comment form, etc.)
│   ├── pages/                    # Source HTML with YAML front matter
│   │   ├── index.html
│   │   ├── contact.html
│   │   ├── meet-fred-francis.html
│   │   ├── issues/               # All issue pages
│   │   └── speeches/             # All speech pages
│   ├── static/                   # Copied to dist as-is
│   │   ├── rss.xml
│   │   ├── updates.json
│   │   ├── sitemap.xml
│   │   └── _headers              # Cloudflare cache-control headers
│   └── whitepapers/              # Source markdown for all whitepapers
│       ├── README.md
│       ├── healthcare-hmo-act-1973.md
│       ├── healthcare-clinical-assessment-2026.md
│       └── nafta-good-for-no-worker.md
├── whitepapers/                  # Compiled PDFs (copied to dist by build.py)
│   ├── healthcare-hmo-act-1973-v2.pdf
│   ├── healthcare-clinical-assessment-2026-v2.pdf
│   └── nafta-good-for-no-worker.pdf
└── dist/                         # Build output (not committed; Cloudflare builds)
```

---

## Build system

`build.py` is a custom static site generator.  It reads HTML pages from
`src/pages/`, resolves a layout/partial/component/slot template system,
injects variables from front matter + `build-config.json`, and writes to
`dist/`.

### Key build.py features
- `{{variable}}` — resolved from front matter or config
- `{{partial:name}}` — includes `src/partials/template-name.html`
- `{{component:name}}` — includes `src/components/component-name.html`
- `{{extends:base}}` / `{{define:slot}}` / `{{slot:name}}` — layout inheritance
- `{{whatsnew}}` — generated from `src/data/whatsnew.json`
- `{{last_updated_html}}` — auto-generated from `last_updated` front matter
- `set_nav_active()` — marks the active nav item
- `apply_nav_badges()` — adds "Updated" badge to nav items for pages with `recently_updated: true`
- `body_class` front matter — rendered as `<body class="value">`, cleaned to `<body>` when empty

### CSS version bumping rules
- Changed `style.css` → bump `css_version` in `build-config.json`
- Changed `style2.css` → bump `css_version` in `src/pages/index.html` front matter
- Changed `site.js` → bump `js_version` in `build-config.json`
- Always do this BEFORE building and committing

---

## Design system

### Color palette (CSS custom properties in `:root`)
- Navy: `--blue` (#002868), `--blueDark` (#001845), `--blueRoyal` (#003494)
- Red: `--red` (#BF0A30), `--redDark` (#9B0826)
- Gold: `--gold` (#DAA520), `--goldLight` (#F0C75E)
- Neutrals: `--slate` (#1A1A2E), `--gray` (#444455), `--white`, `--cream` (#FFFCF5)
- `--border` (#C8D0DC)

### Fonts
- `--serif`: Times New Roman, Georgia, serif (headings, formal statements)
- `--sans`: Arial, Helvetica Neue, sans-serif (body text, UI elements)

### Nav bar
- Background: `--blue`
- Brand link (left): "Fred Francis 2028" in gold serif + "For President" in white uppercase sans
- Hamburger menu (right)
- Footer: gold "CONTACT THE CAMPAIGN" button (hidden on contact page via `body.page-contact`)
- Red stripe between content and footer
- Footer background: `--blueDark` with 3px solid gold top border

---

## Git workflow

1. Always `git pull --rebase` before pushing (GitHub Actions commit back to main)
2. Always mask the PAT in all git output via `sed`
3. Set `git config user.email` and `user.name` at session start
4. Cloudflare cache is auto-purged on every push (GitHub Action)
5. Build locally with `python3 build.py` and verify before pushing

---

## Writing conventions (summary)

- Two spaces after sentences: `sentence.&nbsp; Next sentence.`
- No em dashes (use semicolons, colons, commas, parentheses)
- That/which distinction enforced
- Comma bracketing on subordinate clauses
- "Pre-empted" hyphenated
- We/us pronouns in campaign content
- IEEE citation style; every claim cited or marked `[uncited/unverified]`
- `$43B / $18B pattern`: make subset relationships unambiguous

See `README.md` for full details.

---

## Issue page architecture

Three-layer structure on pages with full policy content:
1. **Key Points** (`.key-points`) — 5 bullets, 30-second read
2. **At a Glance / Donna Layer** (`.at-a-glance`) — plain-language summary, 2-3 min
3. **Deeper Dive** (`details.deeper-dive`) — full policy + Accountability Framework, 20+ min

Listen buttons: "Listen to Summary" above Key Points, "Listen to Full Policy" inside Deeper Dive.

Pages with three-layer architecture: healthcare, nafta, trades.
All other issue pages have simpler content structures.

---

## Current site pages

### Top-level
- Home (`index.html`)
- Meet Fred Francis / Where I'm From
- Some of My Thoughts (blog)
- Speeches (landing + 3 individual speeches)
- Contact
- Volunteers
- Tax Dollars at Work / Seeing the Budget
- Accountability Framework
- Endorsements (three-tab)
- Humor
- Privacy Policy, Accessibility, Sitemap, 404

### Issues (via Accountability Framework dropdown)
- **Domestic:** healthcare, trades, insurance, utilities, national-budget, epstein, right-to-repair, veterans
- **Foreign:** china, foreign-aid, nato, nafta
- **Governance:** civil-service, ai-standards, disinformation

### Whitepapers (PDFs)
- HMO Act of 1973 (`healthcare-hmo-act-1973-v2.pdf`)
- Administrative Capture of American Medicine (`healthcare-clinical-assessment-2026-v2.pdf`)
- NAFTA: Good for No Worker (`nafta-good-for-no-worker.pdf`)

---

## Speechwriting voices

- **Ted Sorensen** — structure, strategic precision, factual rigor
- **Aaron Sorkin** — dramatic stakes, the unknown candidate's advantage

---

## Key editorial decisions on record

- Band director / second-father story: held in reserve for speeches/interviews, not the bio page
- "They chose food." stands alone as the pivot line in the bio
- "Pull up a chair" closing in gold italic
- The campaign's philosophical foundation: Parable of the Good Samaritan as binding universal obligation; Code of Chivalry as its operational expression
- Campaign tagline: "Our voices.  Our government."

---

## Known issues and future work

- **Whitepaper source markdown** (`src/whitepapers/`): all three files were extracted from PDFs and have lost bold/italic/table formatting.  First revision of any paper should start by cleaning up the markdown.
- **Clinical assessment formatting** does not match HMO Act styling (different system generated the original; running headers require patched wkhtmltopdf).  Full reformatting requires either a patched wkhtmltopdf install or a ReportLab-based generator.
- **Contact page backend**: currently uses `mailto:` links; needs Google Apps Script backend for proper form submission.
- **Social media automation** via GitHub Actions: planned, not built.
- **Missing site elements** (from July 2026 audit): donation mechanism (ActBlue), email/newsletter signup, events calendar, press kit, video content, Spanish-language content, merchandise.
- **Primary/ballot access**: DNC early-state calendar ratification pending; delegate math model built but needs updating.

---

## Session P17 changes (September 2, 2026)

- What's New section on front page (data-driven, flex layout, bold italic)
- Nav "Updated" badges + last-updated timestamps on issue pages
- RSS feed expanded (3 new entries)
- Contact page rebuilt (volunteer signup, musician checkboxes, freeform comments, two buttons)
- "For President" tagline; brand link replaces HOME button
- Listen buttons (Web Speech API) on all content pages
- "Page X of Y" footers on both healthcare whitepapers
- `src/whitepapers/` directory with source markdown for all 3 papers
- Cloudflare cache purge GitHub Action (secrets configured)
- `_headers` file for CDN caching
- `body_class` front matter support in base layout
- PDF filenames changed to `-v2.pdf` to bust stale cache
