#!/usr/bin/env python3
"""Pings IndexNow (Bing, Yandex, Seznam, Naver) about the URL in the newest
updates.json entry, and updates that URL's <lastmod> in sitemap.xml.

Called from .github/workflows/discord-notify.yml, which only invokes this
when updates.json changed in the pushed commit -- so, same as the Discord
poster, this always assumes the last item in the array is the new one.

Note on scope: this deliberately does NOT touch Google. Google retired its
unauthenticated sitemap "ping" endpoint at the end of 2023 (it now 404s), and
its only real-time API (the Indexing API) is contractually restricted to
JobPosting/BroadcastEvent content -- using it for ordinary pages risks
Google revoking access. For Google, the durable, sanctioned signal is an
accurate lastmod in the sitemap (which this script maintains) plus manual
Request Indexing in Search Console for anything urgent.
"""
import datetime
import json
import os
import re
import sys
import urllib.request

INDEXNOW_KEY = "0654dc34fa14a19a9bcef414709bb1ab"
HOST = "fredfrancis2028.com"
KEY_LOCATION = f"https://{HOST}/{INDEXNOW_KEY}.txt"
SITEMAP_PATH = "sitemap.xml"

with open("updates.json") as f:
    items = json.load(f)

if not items:
    print("updates.json is empty, nothing to announce.")
    sys.exit(0)

latest = items[-1]
url = latest["link"]
print(f"Announcing: {url}")

# --- 1. Update sitemap.xml lastmod for this URL, line-based (matches the
#         file's existing one-<url>-per-line style; safer than a blanket
#         regex across the whole document). ---
today = datetime.date.today().isoformat()
loc_pattern = re.escape(f"<loc>{url}</loc>")

with open(SITEMAP_PATH, encoding="utf-8") as f:
    lines = f.readlines()

updated = False
for i, line in enumerate(lines):
    if re.search(loc_pattern, line):
        if "<lastmod>" in line:
            lines[i] = re.sub(
                r"<lastmod>.*?</lastmod>", f"<lastmod>{today}</lastmod>", line
            )
        else:
            lines[i] = line.replace(
                "</loc></url>", f"</loc><lastmod>{today}</lastmod></url>"
            )
        updated = True
        break

if updated:
    with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"sitemap.xml: set lastmod={today} for {url}")
else:
    print(f"WARNING: {url} not found in sitemap.xml -- lastmod not updated. "
          f"(Add it to sitemap.xml if this is a genuinely new page.)")

# --- 2. Ping IndexNow (covers Bing, Yandex, Seznam.cz, Naver) ---
payload = json.dumps({
    "host": HOST,
    "key": INDEXNOW_KEY,
    "keyLocation": KEY_LOCATION,
    "urlList": [url],
}).encode("utf-8")

req = urllib.request.Request(
    "https://api.indexnow.org/indexnow",
    data=payload,
    headers={"Content-Type": "application/json; charset=utf-8"},
    method="POST",
)
try:
    with urllib.request.urlopen(req) as resp:
        print("IndexNow responded with status:", resp.status)
except urllib.error.HTTPError as e:
    # IndexNow returns 200/202 on success; don't fail the whole workflow
    # over a single search engine's hiccup.
    print(f"IndexNow returned an error (non-fatal): {e.code} {e.reason}")
