#!/usr/bin/env python3
"""Posts the most recent entry in updates.json to a Discord webhook.

Called from .github/workflows/discord-notify.yml, which only invokes this
when updates.json changed in the pushed commit -- so this always assumes
the last item in the array is the new one worth announcing.
"""
import json
import os
import sys
import urllib.request

with open('updates.json') as f:
    items = json.load(f)

if not items:
    print("updates.json is empty, nothing to post.")
    sys.exit(0)

latest = items[-1]

message = (
    "\U0001F4E2 **New update from Fred Francis 2028**\n\n"
    f"**{latest['title']}**\n"
    f"{latest['description']}\n"
    f"{latest['link']}"
)
payload = json.dumps({"content": message}).encode("utf-8")

webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")
if not webhook_url:
    print("DISCORD_WEBHOOK_URL secret is not set -- skipping Discord post.")
    sys.exit(0)

req = urllib.request.Request(
    webhook_url,
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req) as resp:
    print("Discord responded with status:", resp.status)
