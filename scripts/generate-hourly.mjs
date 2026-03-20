import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('data');
fs.mkdirSync(outDir, { recursive: true });

const now = process.env.NOW_ISO ? new Date(process.env.NOW_ISO) : new Date();
const hourKey = now.toISOString().slice(0, 13) + ':00:00Z';
const epochHour = Math.floor(now.getTime() / 3600000);

const moods = [
  'restless',
  'curious',
  'feral',
  'tender',
  'clock-drunk',
  'signal-seeking',
  'playful',
  'melancholy',
  'focused',
  'porous'
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

const questions = [
  'What did you notice today that felt too small to mention?',
  'What are you pretending not to care about?',
  'Which feeling keeps showing up wearing different clothes?',
  'What would this page look like if it were honest about your week?',
  'What keeps repeating in your life until it becomes a pattern?',
  'What deserves more attention than it currently gets?'
];

function pick(arr, offset = 0) {
  return arr[(epochHour + offset) % arr.length];
}

function pseudo(n) {
  const x = Math.sin(n * 9999.91) * 10000;
  return x - Math.floor(x);
}

const palette = pick(colors, 1);
const entry = {
  generatedAt: hourKey,
  hourKey,
  mood: pick(moods),
  palette,
  thought: `${pick(openings)} ${pick(middles, 2)} ${pick(closings, 4)}`,
  question: pick(questions, 3),
  shapes: Array.from({ length: 7 }, (_, i) => ({
    x: Number((pseudo(epochHour + i) * 100).toFixed(2)),
    y: Number((pseudo(epochHour + i + 50) * 100).toFixed(2)),
    size: Number((12 + pseudo(epochHour + i + 100) * 28).toFixed(2)),
    blur: Number((pseudo(epochHour + i + 150) * 16).toFixed(2)),
    opacity: Number((0.18 + pseudo(epochHour + i + 200) * 0.45).toFixed(2))
  }))
};

fs.writeFileSync(path.join(outDir, 'hourly.json'), JSON.stringify(entry, null, 2) + '\n');

const archivePath = path.join(outDir, 'archive.json');
let archive = [];
if (fs.existsSync(archivePath)) {
  archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
}
archive.unshift(entry);
const deduped = [];
const seen = new Set();
for (const item of archive) {
  if (seen.has(item.hourKey)) continue;
  seen.add(item.hourKey);
  deduped.push(item);
}
fs.writeFileSync(archivePath, JSON.stringify(deduped.slice(0, 72), null, 2) + '\n');

console.log(`Generated ${entry.hourKey}`);
