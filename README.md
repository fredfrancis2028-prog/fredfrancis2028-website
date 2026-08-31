# fredfrancis2028-website

## Conventions for future editors (AI or human)

**Two spaces after a sentence.**  This site's prose is written with two spaces after
each sentence-ending period, matching the author's typing style.  Because HTML
collapses consecutive plain spaces down to one when rendering, that style is
preserved in the markup as `sentence.&nbsp; Next sentence.` -- a literal `&nbsp;`
entity followed by a normal space -- rather than two plain spaces.  When editing or
adding prose anywhere on this site, match that pattern.  (This same reminder is
also left as a comment near the top of every `.html` page, `assets/style.css`, and
`assets/site.js`, so it's visible no matter which single file someone happens to
be looking at.)

**Cache-busting version strings.**  `assets/style.css` and `assets/site.js` are
referenced from every page as `style.css?vN` / `site.js?vN`.  Any time the
*content* of either file changes, the version number on **every page that
references it** must be bumped too, or browsers/CDN will keep serving the old
cached copy under the same URL and the change will silently appear not to have
happened.  (This bit twice in one session before the lesson stuck -- see git
history around July 2026 for the pattern of "edit CSS, forget to bump version,
fix it in the very next commit.")

**Type scale.**  There is no CSS-level abstraction for this yet (no custom
properties for font sizes, the way colors already have `--blue`, `--slate`,
etc. in `:root`) -- this table is the documented source of truth until/unless
someone builds that. Before adding a new class or changing an existing one's
size, check here first: does this text belong to an existing tier, or is it
genuinely new? "Looks kind of similar to X" is not the same question as "is
this the same tier as X" -- several sizes below look close to each other but
are deliberately different roles.

| Tier | Size | Used for | Classes |
|---|---|---|---|
| **Body** | `14pt` (~18.7px) | Standard reading prose -- the default for any paragraph a visitor is meant to actually read start-to-finish. | `.body-p`, `.body-list li`, `.entry-card p` (Thinking Aloud entries), `.bio-body` (candidate bio + Accountability Framework intro), `.framework-card p` (Goals/Metrics/Review/Severability/Sunset text) |
| **Caption / secondary** | `14px`–`15px` | Short, card-shaped supporting text -- deliberately smaller than Body. Not an oversight; these are captions, not reading paragraphs. | `.issue-card-short` (14px, issue-listing blurbs), `.endorse-card p` (14px, endorsement one-liners), `.did-you-know p` (15px, Tax Dollars callout box) |
| **Intro / quote** | `18px` | Distinct italic-serif introductory statements, set apart from Body on purpose. | `.contact-card p` |
| **Emphasis close** | `17px` | Bold italic closing line capping off a longer passage. | `.bio-closer` |
| **Subhead** | `19px`–`22px` | Section headings within a page (not the page title itself). | `h2.section-head` (22px), `.speech-subhead` (19px), `.framework-card h3` (19px), `.endorse-card h3` (17px) |
| **Nav / small UI** | `13px`–`15px` | Navigation, buttons, back-links -- interface chrome, not content. | `.nav-home-btn`, `.nav-menu a`, `.back-btn`, `.research-btn`, etc. |
| **Hero / title** | responsive `clamp()` | Large page-level titles that need to scale with viewport width rather than a fixed size. | `.issue-title`, `.issues-hero-subtitle` |

If you're asked to make some text "match" another element, find both in this
table first. If they're already the same tier, the sizes should already match
-- go look for a stray literal value instead of assuming CSS is broken. If
they're different tiers, changing one to match the other is a real design
decision (does the smaller one get promoted, or does the tier itself change?)
-- worth a moment's thought, not just a find-and-replace.

**Color palette** (defined once in `:root`, `assets/style.css` lines 7-14):
navy `--blue` / `--blueDark` / `--blueRoyal`, red `--red` / `--redDark`, gold
`--gold` / `--goldLight`, plus neutrals `--slate` (body text), `--gray`
(secondary text), `--white`, `--cream`, `--border`. Two font stacks:
`--serif` (Times New Roman/Georgia -- headings, formal statements) and
`--sans` (Arial/Helvetica -- body text, UI). Always reference these
variables rather than hardcoding a hex value or font stack inline.

---

## Issue page architecture

Every issue page follows a three-layer reading structure, ordered from
fastest to deepest.  All three layers are on the same page; the voter
chooses how far to go.

1. **Key Points** -- five bullets, maximum two sentences each, every
   claim cited.  CSS class `key-points` (red square markers, serif
   font, bordered list items).  A "New!" banner (`new-banner` div)
   sits between the `section-head` and the `ul` when the content is
   recently added or revised.  Thirty-second read.

2. **The Issue at a Glance** (Donna Layer) -- plain-language narrative
   summary of the issue, proposals, and core numbers.  No jargon.
   CSS class `at-a-glance` on the `section.block`.  Two-to-three
   minute read.

3. **A Deeper Dive** -- collapsible `<details class="deeper-dive">`
   containing the full Problem section (with citations and research
   paper links), What We Propose, and the complete Accountability
   Framework (Goals, Metrics, Review, Severability, Sunset).  The
   CTA text is "Click to read the full Issue".  Twenty-plus minute
   read.

Reference implementation: `issues/healthcare.html` and `issues/nafta.html`.

## Research papers section

When an issue has one or more research papers, they are presented in a
`div.research-papers` container inside the Deeper Dive section, between
the Problem narrative and the references.  Each paper is an anchor block
with class `research-paper-link` containing:

```html
<a href="/whitepapers/filename.pdf" class="research-paper-link">
  <strong>Paper Title</strong>
  <span class="research-paper-meta">Type &middot; Date</span>
  <span class="research-paper-desc">One-line description.</span>
</a>
```

Styled with blue border, red left accent, gold hover.  Scales to any
number of papers per issue.  Zero JavaScript.  PDFs live in `/whitepapers/`.

## Revision notes and archived pages

When an issue page is revised substantively, the current version gets a
`p.revision-note` at the top (blue background, blue left border) that
states what changed and links to the archived original.  The archived
page lives at the same path with `-v1` appended (e.g. `healthcare-v1`).
It is NOT added to the nav, sitemap.xml, or sitemap.html.  The archived
page gets a brief note at the top linking back to the current version.

## Writing conventions

These apply to all prose on the site, in both issue pages and research
papers.

- **Two spaces after sentences.**  Rendered as `&nbsp;` + space in HTML.
  (See top of this README for full explanation.)

- **No em dashes.**  Use semicolons where the em dash connects
  independent clauses, colons where it introduces a restatement or
  amplification, and commas where it brackets a parenthetical.
  Em dashes are widely perceived as characteristic of AI-generated
  text; avoiding them is a deliberate style choice.

- **That / which.**  "That" introduces restrictive (defining) clauses
  with no comma.  "Which" introduces non-restrictive (descriptive)
  clauses with a comma.  Example: "the documentation requirements
  that Meaningful Use criteria imposed" (restrictive); "the HITECH
  Act, which drove EHR adoption" (non-restrictive).

- **Comma bracketing.**  Subordinate clauses and parenthetical phrases
  get commas on both sides, not just the second.  Example: "The
  administrative burden, documented at the physician-practice level
  in Sections 3 and 4, aggregates to a staggering system-wide cost."

- **Hyphenation.**  "Pre-empted" not "preempted."  Standard compound
  modifiers: "evidence-based," "cost-containment," "out-of-network."

- **Voice.**  We/us pronouns in all campaign-facing content.  "I" is
  reserved for personal accountability statements only.  No named
  political figures in speech body or issue page body.

- **Accessible language.**  "The number of doctors per patient" not
  "per capita physician supply."  Technical terms are acceptable in
  research papers but the issue page layers (Key Points, Donna Layer)
  should use the language people actually use.

- **Citations.**  Every factual claim on every issue page must carry an
  inline reference number linking to the references section.  If a
  claim cannot be cited, mark it `[uncited/unverified]`.  Never
  present an unsourced claim bare.

- **$43B / $18B pattern.**  When a subset is part of a total, make the
  relationship unambiguous: "of that $43 billion, $18 billion went
  to..." not "and $18 billion" which reads as additive.

## Document defaults

- **Page size.**  All PDFs, whitepapers, and printable documents default
  to US Letter (8.5" × 11").  When generating PDFs via pandoc/wkhtmltopdf,
  use `-V papersize=letter` or equivalent.  When generating via ReportLab,
  use `from reportlab.lib.pagesizes import letter`.  Do not use A4 unless
  explicitly requested.

