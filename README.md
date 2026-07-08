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
