#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
STATE_JSON="$REPO/data/hourly.json"

resolve_key() {
  python3 - <<'PY2'
import json
from pathlib import Path
obj = json.loads(Path('/home/nader/.openclaw/openclaw.json').read_text())
cur = obj
for part in ('skills', 'entries', 'nano-banana-pro', 'apiKey'):
    cur = cur.get(part, {}) if isinstance(cur, dict) else {}
if isinstance(cur, str) and cur:
    print(cur)
PY2
}

GEMINI_KEY="${GEMINI_API_KEY:-}"
if [ -z "$GEMINI_KEY" ]; then
  GEMINI_KEY="$(resolve_key)"
fi

OUT_REL=$(STATE_JSON="$STATE_JSON" node <<'NODE'
const fs = require('fs');
const state = JSON.parse(fs.readFileSync(process.env.STATE_JSON, 'utf8'));
const slug = state.hourKey.replace(/[:]/g, '-');
process.stdout.write(`assets/lobsters/${slug}.png`);
NODE
)
OUT_FILE="$REPO/$OUT_REL"
mkdir -p "$(dirname "$OUT_FILE")"

PROMPT=$(STATE_JSON="$STATE_JSON" node <<'NODE'
const fs = require('fs');
const state = JSON.parse(fs.readFileSync(process.env.STATE_JSON, 'utf8'));
const prompt = [
  'Create a new original artwork of a lobster using the two reference images only as style anchors, not content to duplicate.',
  'The lobster should feel like a co-star to the clown universe: wired, ceremonial, strange, graphic, and slightly threatening.',
  'Visual language: neon acid greens, brutal black linework, halftone screenprint texture, distressed poster energy, glitch interference, photocopy punk.',
  `Current mood: ${state.mood}.`,
  `Art form this hour: ${state.artForm}.`,
  'Invent a fresh lobster every time. Vary silhouette, pose, claws, shells, cables, symbols, and typography artifacts.',
  'Do not include a clown. This image is only the lobster, but it should feel like it belongs beside the clown image from the same hour.'
].join(' ');
process.stdout.write(prompt);
NODE
)

uv run /home/nader/.npm-global/lib/node_modules/openclaw/skills/nano-banana-pro/scripts/generate_image.py   --api-key "$GEMINI_KEY"   --prompt "$PROMPT"   --filename "$OUT_FILE"   --resolution 1K   --aspect-ratio 1:1   -i "$REPO/references/style-1.png"   -i "$REPO/references/style-2.png"

REPO="$REPO" OUT_REL="$OUT_REL" node <<'NODE'
const fs = require('fs');
const repo = process.env.REPO;
const rel = process.env.OUT_REL;
const currentPath = `${repo}/data/hourly.json`;
const archivePath = `${repo}/data/archive.json`;
const current = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
current.lobsterImagePath = rel;
fs.writeFileSync(currentPath, JSON.stringify(current, null, 2) + '\n');
let archive = [];
if (fs.existsSync(archivePath)) archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
archive = archive.map((item) => item.hourKey === current.hourKey ? { ...item, lobsterImagePath: rel } : item);
if (!archive.find((item) => item.hourKey === current.hourKey)) archive.unshift(current);
fs.writeFileSync(archivePath, JSON.stringify(archive, null, 2) + '\n');
NODE

echo "$OUT_REL"
