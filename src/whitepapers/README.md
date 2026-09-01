# Whitepaper Source Files

This directory holds the source markdown for every PDF in `/whitepapers/`.

## Convention

Every whitepaper PDF **must** have a corresponding `.md` file here with the
same base name.  When a whitepaper is created or revised, update the markdown
first, regenerate the PDF, and commit both.

## Regeneration command

All whitepapers use the same pandoc/wkhtmltopdf pipeline:

```bash
pandoc src/whitepapers/FILENAME.md \
  -o whitepapers/FILENAME.pdf \
  --pdf-engine=wkhtmltopdf \
  -V margin-top=25mm \
  -V margin-bottom=25mm \
  -V margin-left=25mm \
  -V margin-right=25mm \
  -V papersize=letter \
  --metadata title="TITLE"
```

## Important notes

- **Page size**: US Letter (8.5" x 11") always.  See README.md § Document defaults.
- **Page numbers**: Added as a post-processing overlay via reportlab (see build
  notes), not via wkhtmltopdf footer options (which require patched Qt).
- **Running headers**: The HMO Act paper's running header was generated on a
  system with patched Qt wkhtmltopdf.  This cannot be reproduced on standard
  installs.  If running headers are needed in the future, either use a patched
  build or add them as reportlab overlays.
- **Never modify a PDF without its source markdown.**  If the markdown is
  missing or outdated, reconstruct and verify it first.
