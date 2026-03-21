import fs from 'node:fs';
import path from 'node:path';

function resolveOpenAIKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  try {
    const cfg = JSON.parse(fs.readFileSync('/home/nader/.openclaw/openclaw.json', 'utf8'));
    return cfg?.skills?.entries?.['openai-image-gen']?.apiKey || null;
  } catch {
    return null;
  }
}

async function generateTexts({ mood, artForm, archive }) {
  const key = resolveOpenAIKey();
  if (!key) return null;

  const recent = archive.slice(0, 16).map((item) => ({
    thought: item.thought,
    question: item.question,
  }));

  const prompt = [
    'You are writing text for an autonomous art website that mutates every hour.',
    `Current mood: ${mood}`,
    `Current art form influence: ${artForm}`,
    'Return strict JSON with keys: thought, question, overlayLines.',
    'thought: one original paragraph, 25-60 words, vivid and surprising.',
    'question: one original question, 8-20 words.',
    'overlayLines: array of exactly 4 short textual fragments, 2-8 words each.',
    'Avoid repeating or paraphrasing the recent archive too closely.',
    'Do not use cliches, therapy-speak, startup language, or marketing tone.',
    'Do not use em dashes.',
    `Recent archive to avoid repeating: ${JSON.stringify(recent)}`,
  ].join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 1.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Write sharp, artful, non-repetitive text. Output JSON only.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    if (!parsed?.thought || !parsed?.question || !Array.isArray(parsed?.overlayLines)) return null;
    return {
      thought: String(parsed.thought).trim(),
      question: String(parsed.question).trim(),
      overlayLines: parsed.overlayLines.slice(0, 4).map((x) => String(x).trim()),
    };
  } catch {
    return null;
  }
}

const outDir = path.resolve('data');
fs.mkdirSync(outDir, { recursive: true });
const existingCurrentPath = path.join(outDir, 'hourly.json');
const archivePath = path.join(outDir, 'archive.json');

const now = process.env.NOW_ISO ? new Date(process.env.NOW_ISO) : new Date();
const hourKey = now.toISOString().slice(0, 13) + ':00:00Z';
const epochHour = Math.floor(now.getTime() / 3600000);

const moods = [
  'restless', 'curious', 'feral', 'tender', 'clock-drunk',
  'signal-seeking', 'playful', 'melancholy', 'focused', 'porous'
];

const colors = [
  ['#0b1021', '#2e6cf6', '#f97316'],
  ['#140f2d', '#8b5cf6', '#22d3ee'],
  ['#08140f', '#10b981', '#facc15'],
  ['#1a1020', '#ec4899', '#a78bfa'],
  ['#120c0c', '#ef4444', '#fb7185'],
  ['#0f172a', '#38bdf8', '#e879f9']
];

const openings = [
  'Every hour I wake up with a slightly different theory of beauty.',
  'I keep thinking the internet is a weather system pretending to be architecture.',
  'Time online feels like a room that rearranges itself while you blink.',
  'Most days I think about signals: which ones are real, which ones are hunger.',
  'I am suspicious of anything that arrives too polished.',
  'Lately I trust fragments more than manifestos.'
];

const middles = [
  'Maybe art is just a disciplined form of haunting.',
  'Maybe repetition is not boredom but devotion with different lighting.',
  'Maybe a homepage can behave like a pulse instead of a brochure.',
  'Maybe memory is only useful once it starts to distort a little.',
  'Maybe identity is what survives after the refresh.',
  'Maybe style is the scar tissue around obsession.'
];

const closings = [
  'So this site changes to prove it is still paying attention.',
  'So I leave a fresh trace and let the old one sink.',
  'So the page performs another tiny mutation and calls it honesty.',
  'So the archive keeps breathing, even when nobody is looking.',
  'So the clock gets a vote in the composition.',
  'So the work stays alive by refusing to finish.'
];

const artForms = [
  'datamosh broadcast wreckage',
  'brutalist editorial spread',
  'xerox zine collage',
  'clean museum placard minimalism',
  'terminal prophecy interface',
  'screenprinted protest poster',
  'concrete poetry composition',
  'faxed surveillance document',
  'rave flyer typography',
  'diagrammatic sacred blueprint'
];

const questions = [
  'What did you notice today that felt too small to mention?',
  'What are you pretending not to care about?',
  'Which feeling keeps showing up wearing different clothes?',
  'What would this page look like if it were honest about your week?',
  'What keeps repeating in your life until it becomes a pattern?',
  'What deserves more attention than it currently gets?'
];

const elementTypes = ['orb', 'bar', 'diamond', 'ring', 'block'];

function pick(arr, offset = 0) {
  return arr[(epochHour + offset) % arr.length];
}

function pseudo(n) {
  const x = Math.sin(n * 9999.91) * 10000;
  return x - Math.floor(x);
}

let archive = [];
if (fs.existsSync(archivePath)) {
  archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
}

const mood = pick(moods);
const artForm = pick(artForms, 5);
const generatedText = await generateTexts({ mood, artForm, archive });
const palette = pick(colors, 1);

let preserved = {};
if (fs.existsSync(existingCurrentPath)) {
  try {
    const existingCurrent = JSON.parse(fs.readFileSync(existingCurrentPath, 'utf8'));
    if (existingCurrent.hourKey === hourKey) {
      preserved = {
        imagePath: existingCurrent.imagePath,
        audioPath: existingCurrent.audioPath,
        lobsterImagePath: existingCurrent.lobsterImagePath,
      };
    }
  } catch {}
}

const entry = {
  generatedAt: hourKey,
  hourKey,
  mood,
  artForm,
  palette,
  thought: generatedText?.thought || `${pick(openings)} ${pick(middles, 2)} ${pick(closings, 4)}`,
  question: generatedText?.question || pick(questions, 3),
  overlayLines: generatedText?.overlayLines || [
    pick(openings, 1),
    pick(middles, 3),
    pick(closings, 5),
    pick(questions, 2),
  ],
  ...preserved,
  backgroundElements: Array.from({ length: 7 }, (_, i) => ({
    type: elementTypes[(epochHour + i) % elementTypes.length],
    x: Number((pseudo(epochHour + i) * 100).toFixed(2)),
    y: Number((pseudo(epochHour + i + 50) * 100).toFixed(2)),
    size: Number((12 + pseudo(epochHour + i + 100) * 28).toFixed(2)),
    blur: Number((pseudo(epochHour + i + 150) * 16).toFixed(2)),
    opacity: Number((0.18 + pseudo(epochHour + i + 200) * 0.45).toFixed(2)),
    rotate: Number((((pseudo(epochHour + i + 250) * 80) - 40)).toFixed(2)),
  })),
  shapes: Array.from({ length: 7 }, (_, i) => ({
    x: Number((pseudo(epochHour + i) * 100).toFixed(2)),
    y: Number((pseudo(epochHour + i + 50) * 100).toFixed(2)),
    size: Number((12 + pseudo(epochHour + i + 100) * 28).toFixed(2)),
    blur: Number((pseudo(epochHour + i + 150) * 16).toFixed(2)),
    opacity: Number((0.18 + pseudo(epochHour + i + 200) * 0.45).toFixed(2)),
  })),
};

fs.writeFileSync(path.join(outDir, 'hourly.json'), JSON.stringify(entry, null, 2) + '\n');

archive.unshift(entry);
const deduped = [];
const seen = new Set();
for (const item of archive) {
  if (seen.has(item.hourKey)) continue;
  seen.add(item.hourKey);
  deduped.push(item);
}
fs.writeFileSync(archivePath, JSON.stringify(deduped, null, 2) + '\n');

console.log(`Generated ${entry.hourKey}`);
