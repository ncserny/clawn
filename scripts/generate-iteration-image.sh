#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
STATE_JSON="$REPO/data/hourly.json"

resolve_key() {
  local provider="$1"
  python3 - "$provider" <<'PY2'
import json, sys
from pathlib import Path
provider = sys.argv[1]
obj = json.loads(Path('/home/nader/.openclaw/openclaw.json').read_text())
paths = {
    "gemini": [
        ('skills', 'entries', 'nano-banana-pro', 'apiKey'),
        ('tools', 'web', 'search', 'apiKey')
    ],
    "openai": [
        ('skills', 'entries', 'openai-image-gen', 'apiKey')
    ]
}
for path in paths.get(provider, []):
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

GEMINI_KEY="${GEMINI_API_KEY:-}"
if [ -z "$GEMINI_KEY" ]; then
  GEMINI_KEY="$(resolve_key gemini)"
fi

OUT_REL=$(STATE_JSON="$STATE_JSON" node <<'NODE'
const fs = require('fs');
const state = JSON.parse(fs.readFileSync(process.env.STATE_JSON, 'utf8'));
const slug = state.hourKey.replace(/[:]/g, '-');
process.stdout.write(`assets/generated/${slug}.png`);
NODE
)
OUT_FILE="$REPO/$OUT_REL"
mkdir -p "$(dirname "$OUT_FILE")"

PROMPT=$(STATE_JSON="$STATE_JSON" node <<'NODE'
const fs = require('fs');
const state = JSON.parse(fs.readFileSync(process.env.STATE_JSON, 'utf8'));
const prompt = [
  'Create a new original artwork that uses the two reference images only as aesthetic/style anchors, not as something to copy exactly.',
  'Visual language: feral electro-clown, photocopy punk, halftone screenprint texture, neon acid green field, brutal black linework, limited fluorescent palette, tangled cables and glitch energy.',
  'Keep it graphic, poster-like, high contrast, distressed, eerie but playful, with obvious printed texture and imperfect ink registration.',
  `Current mood: ${state.mood}.`,
  `Art form to channel this hour: ${state.artForm}.`,
  `Thought: ${state.thought}`,
  `Question in the air: ${state.question}`,
  'Invent a fresh composition every time. Vary pose, framing, cable behavior, symbols, costume details, typography treatment, and negative space.',
  'Sometimes lean toward interference patterns, caption bars, corrupted text fields, broadcast stripes, sacred diagrams, concrete poetry, editorial whitespace, or poster systems depending on the art form.',
  'Do not reproduce the exact clown from the references. Make it a sibling aesthetic, not a duplicate.',
  'Aspect ratio should feel like a website hero image.'
].join(' ');
process.stdout.write(prompt);
NODE
)

uv run /home/nader/.npm-global/lib/node_modules/openclaw/skills/nano-banana-pro/scripts/generate_image.py \
  --api-key "$GEMINI_KEY" \
  --prompt "$PROMPT" \
  --filename "$OUT_FILE" \
  --resolution 1K \
  --aspect-ratio 16:9 \
  -i "$REPO/references/style-1.png" \
  -i "$REPO/references/style-2.png"

REPO="$REPO" OUT_REL="$OUT_REL" node <<'NODE'
const fs = require('fs');
const repo = process.env.REPO;
const rel = process.env.OUT_REL;
const currentPath = `${repo}/data/hourly.json`;
const archivePath = `${repo}/data/archive.json`;
const current = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
current.imagePath = rel;
fs.writeFileSync(currentPath, JSON.stringify(current, null, 2) + '\n');
let archive = [];
if (fs.existsSync(archivePath)) archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
archive = archive.map((item) => item.hourKey === current.hourKey ? { ...item, imagePath: rel } : item);
if (!archive.find((item) => item.hourKey === current.hourKey)) archive.unshift(current);
fs.writeFileSync(archivePath, JSON.stringify(archive, null, 2) + '\n');
NODE

echo "$OUT_REL"
