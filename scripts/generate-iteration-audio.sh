#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
STATE_JSON="$REPO/data/hourly.json"

resolve_openai_key() {
  python3 - <<'PY2'
import json
from pathlib import Path
obj = json.loads(Path('/home/nader/.openclaw/openclaw.json').read_text())
paths = [
    ('skills', 'entries', 'openai-image-gen', 'apiKey'),
]
for path in paths:
    cur = obj
    ok = True
    for part in path:
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            ok = False
            break
    if ok and isinstance(cur, str) and cur:
        print(cur)
        raise SystemExit
PY2
}

OPENAI_KEY="${OPENAI_API_KEY:-}"
if [ -z "$OPENAI_KEY" ]; then
  OPENAI_KEY="$(resolve_openai_key)"
fi

OUT_REL=$(STATE_JSON="$STATE_JSON" node <<'NODE'
const fs = require('fs');
const state = JSON.parse(fs.readFileSync(process.env.STATE_JSON, 'utf8'));
const slug = state.hourKey.replace(/[:]/g, '-');
process.stdout.write(`assets/audio/${slug}.mp3`);
NODE
)
OUT_FILE="$REPO/$OUT_REL"
mkdir -p "$(dirname "$OUT_FILE")"

PAYLOAD=$(STATE_JSON="$STATE_JSON" node <<'NODE'
const fs = require('fs');
const state = JSON.parse(fs.readFileSync(process.env.STATE_JSON, 'utf8'));
const tones = [
  'Speak like a late-night radio host: calm, intimate, magnetic.',
  'Speak like a haunted gallery guide: measured, poetic, eerie.',
  'Speak like a synthetic dream diary: soft, detached, beautiful.',
  'Speak like a conspiratorial friend at 2AM: low, playful, slightly unhinged.',
  'Speak like a minimalist meditation tape: slow, clean, spacious.'
];
const seed = [...(state.hourKey + state.mood)].reduce((a, c) => a + c.charCodeAt(0), 0);
const tone = tones[seed % tones.length];
const text = [
  `Hour ${state.hourKey}.`,
  `Mood: ${state.mood}.`,
  state.thought,
  `Question: ${state.question}`
].join(' ');
process.stdout.write(JSON.stringify({
  model: 'gpt-4o-mini-tts',
  voice: 'alloy',
  input: text,
  instructions: `${tone} Keep it under twenty seconds. Do not sound like customer support.`
}));
NODE
)

OPENAI_API_KEY="$OPENAI_KEY" python3 - <<'PY' "$PAYLOAD" "$OUT_FILE"
import json, os, sys, urllib.request
payload = json.loads(sys.argv[1]).copy()
out_file = sys.argv[2]
key = os.environ['OPENAI_API_KEY']
req = urllib.request.Request(
    'https://api.openai.com/v1/audio/speech',
    data=json.dumps(payload).encode(),
    headers={
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
    },
)
with urllib.request.urlopen(req, timeout=180) as resp:
    audio = resp.read()
with open(out_file, 'wb') as f:
    f.write(audio)
print(out_file)
PY

REPO="$REPO" OUT_REL="$OUT_REL" node <<'NODE'
const fs = require('fs');
const repo = process.env.REPO;
const rel = process.env.OUT_REL;
const currentPath = `${repo}/data/hourly.json`;
const archivePath = `${repo}/data/archive.json`;
const current = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
current.audioPath = rel;
fs.writeFileSync(currentPath, JSON.stringify(current, null, 2) + '\n');
let archive = [];
if (fs.existsSync(archivePath)) archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
archive = archive.map((item) => item.hourKey === current.hourKey ? { ...item, audioPath: rel } : item);
if (!archive.find((item) => item.hourKey === current.hourKey)) archive.unshift(current);
fs.writeFileSync(archivePath, JSON.stringify(archive, null, 2) + '\n');
NODE

echo "$OUT_REL"
