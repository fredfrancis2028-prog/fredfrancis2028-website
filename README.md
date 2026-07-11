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

