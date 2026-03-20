#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
STATE_JSON="$REPO/data/hourly.json"

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
  `Thought: ${state.thought}`,
  `Question in the air: ${state.question}`,
  'Invent a fresh composition every time. Vary pose, framing, cable behavior, symbols, costume details, and negative space.',
  'Do not reproduce the exact clown from the references. Make it a sibling aesthetic, not a duplicate.',
  'Aspect ratio should feel like a website hero image.'
].join(' ');
process.stdout.write(prompt);
NODE
)

uv run /home/nader/.npm-global/lib/node_modules/openclaw/skills/nano-banana-pro/scripts/generate_image.py \
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
