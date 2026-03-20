const hourKey = document.querySelector('#hourKey');
const mood = document.querySelector('#mood');
const thought = document.querySelector('#thought');
const question = document.querySelector('#question');
const iterationImage = document.querySelector('#iterationImage');
const heroTitle = document.querySelector('h1');
const iterationAudio = document.querySelector('#iterationAudio');
const audioToggle = document.querySelector('#audioToggle');
const signalBands = document.querySelector('#signalBands');
const archive = document.querySelector('#archive');
const changelog = document.querySelector('#changelog');
const stage = document.querySelector('#stage');
const prevStateButton = document.querySelector('#prevState');
const latestStateButton = document.querySelector('#latestState');
const nextStateButton = document.querySelector('#nextState');

let states = [];
let stateIndex = 0;

const panels = [...document.querySelectorAll('.drift-panel')];
const themeModes = ['glitch', 'clean', 'mono', 'poster', 'nocturne'];
const layoutModes = ['collage', 'split', 'spread', 'stack'];
const fontPairs = [
  {
    display: '"Syne", sans-serif',
    body: '"Inter", sans-serif',
    mono: '"IBM Plex Mono", monospace'
  },
  {
    display: '"Instrument Serif", serif',
    body: '"Manrope", sans-serif',
    mono: '"IBM Plex Mono", monospace'
  },
  {
    display: '"Cormorant Garamond", serif',
    body: '"Space Grotesk", sans-serif',
    mono: '"IBM Plex Mono", monospace'
  },
  {
    display: '"Space Grotesk", sans-serif',
    body: '"Inter", sans-serif',
    mono: '"IBM Plex Mono", monospace'
  }
];

function hashString(value) {
  return [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function applyFonts(seed) {
  const pair = fontPairs[seed % fontPairs.length];
  document.documentElement.style.setProperty('--display-font', pair.display);
  document.documentElement.style.setProperty('--body-font', pair.body);
  document.documentElement.style.setProperty('--mono-font', pair.mono);
}


function applyScene(seed) {
  document.body.dataset.theme = themeModes[seed % themeModes.length];
  document.body.dataset.layout = layoutModes[Math.floor(seed / themeModes.length) % layoutModes.length];
}

function applyLayout(seed) {
  panels.forEach((panel, index) => {
    const phase = seed + index * 17;
    const tx = ((phase % 9) - 4) * 6;
    const ty = (((phase * 3) % 11) - 5) * 5;
    const rot = (((phase * 5) % 9) - 4) * 0.9;
    const drift = 10 + ((phase * 7) % 9);
    panel.style.setProperty('--tx', `${tx}px`);
    panel.style.setProperty('--ty', `${ty}px`);
    panel.style.setProperty('--rot', `${rot}deg`);
    panel.style.setProperty('--drift-duration', `${drift}s`);
    panel.style.setProperty('--drift-delay', `${(index % 5) * -1.4}s`);
  });
}

function setPalette(palette) {
  const [bg, accent, accent2] = palette;
  document.documentElement.style.setProperty('--bg', bg);
  document.documentElement.style.setProperty('--accent', accent);
  document.documentElement.style.setProperty('--accent-2', accent2);
}

function renderSignalBands(current, seed) {
  const lines = current.overlayLines || [current.thought, current.question, current.mood, current.artForm || ''];
  signalBands.innerHTML = '';
  for (let i = 0; i < 3; i += 1) {
    const band = document.createElement('div');
    band.className = 'signal-band';
    band.style.setProperty('--band-shift', `${((seed + i * 9) % 10) - 5}px`);
    band.style.setProperty('--band-rotation', `${(((seed + i * 7) % 8) - 4) * 0.4}deg`);
    band.style.setProperty('--band-speed', `${18 + ((seed + i * 13) % 12)}s`);
    band.style.top = `${12 + i * 26}%`;
    const content = document.createElement('div');
    content.className = 'signal-band__content';
    content.textContent = Array(8).fill(lines[(i + seed) % lines.length]).join('  //  ');
    band.appendChild(content);
    signalBands.appendChild(band);
  }
}

function renderShapes(shapes, palette) {
  stage.innerHTML = '';
  shapes.forEach((shape, i) => {
    const orb = document.createElement('div');
    orb.className = 'orb';
    orb.style.left = `${shape.x}%`;
    orb.style.top = `${shape.y}%`;
    orb.style.width = `${shape.size}rem`;
    orb.style.height = `${shape.size}rem`;
    orb.style.opacity = shape.opacity;
    orb.style.filter = `blur(${shape.blur}px)`;
    orb.style.background = i % 2 === 0 ? palette[1] : palette[2];
    stage.appendChild(orb);
  });
}

function renderArchive(items) {
  archive.innerHTML = '';
  items.slice(0, 8).forEach((item, index) => {
    const wrap = document.createElement('article');
    wrap.className = 'archive-item';
    wrap.innerHTML = `
      <p class="label">${item.hourKey} / ${item.mood}</p>
      <p>${item.thought}</p>
      <p class="mono">${item.question}</p>
    `;
    wrap.addEventListener('click', () => {
      stateIndex = index;
      renderState(states[stateIndex]);
      syncButtons();
    });
    archive.appendChild(wrap);
  });
}

function wireAudio() {
  const tryPlay = () => {
    iterationAudio.volume = 0.35;
    iterationAudio.play().then(() => {
      audioToggle.textContent = 'pause voice';
    }).catch(() => {
      audioToggle.textContent = 'tap to hear';
    });
  };

  audioToggle.addEventListener('click', () => {
    if (!iterationAudio.src) return;
    if (iterationAudio.paused) {
      tryPlay();
    } else {
      iterationAudio.pause();
      audioToggle.textContent = 'play voice';
    }
  });

  iterationAudio.addEventListener('ended', () => {
    audioToggle.textContent = 'replay voice';
  });

  const prime = () => {
    if (iterationAudio.src && iterationAudio.paused) tryPlay();
    window.removeEventListener('pointerdown', prime);
  };
  window.addEventListener('pointerdown', prime, { once: true });
}

function renderState(current) {
  if (!current) return;
  const seed = hashString(current.hourKey + current.mood);
  heroTitle.dataset.echo = heroTitle.textContent;
  hourKey.textContent = current.hourKey;
  mood.textContent = current.mood;
  thought.textContent = current.thought;
  question.textContent = current.question;
  if (current.imagePath) {
    iterationImage.src = current.imagePath;
    iterationImage.style.display = 'block';
  } else {
    iterationImage.removeAttribute('src');
    iterationImage.style.display = 'none';
  }
  if (current.audioPath) {
    iterationAudio.src = current.audioPath;
    audioToggle.hidden = false;
    audioToggle.textContent = 'tap to hear';
  } else {
    iterationAudio.removeAttribute('src');
    audioToggle.hidden = true;
  }
  setPalette(current.palette);
  applyFonts(seed);
  applyScene(seed);
  applyLayout(seed);
  renderSignalBands(current, seed);
  renderShapes(current.shapes, current.palette);
}

function syncButtons() {
  prevStateButton.disabled = stateIndex >= states.length - 1;
  nextStateButton.disabled = stateIndex <= 0;
}

function renderChangelog(entries) {
  changelog.innerHTML = '';
  entries.forEach((entry) => {
    const wrap = document.createElement('article');
    wrap.className = 'changelog-item';
    wrap.innerHTML = `
      <p class="label">${entry.date}</p>
      <ul>
        ${entry.items.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    `;
    changelog.appendChild(wrap);
  });
}

async function boot() {
  const [current, history, log] = await Promise.all([
    fetch('./data/hourly.json').then((r) => r.json()),
    fetch('./data/archive.json').then((r) => r.json()),
    fetch('./data/changelog.json').then((r) => r.json())
  ]);

  states = [current, ...history.filter((item) => item.hourKey !== current.hourKey)];
  stateIndex = 0;

  renderState(states[stateIndex]);
  renderArchive(states);
  renderChangelog(log);
  wireAudio();
  syncButtons();

  prevStateButton.addEventListener('click', () => {
    if (stateIndex < states.length - 1) {
      stateIndex += 1;
      renderState(states[stateIndex]);
      syncButtons();
    }
  });

  latestStateButton.addEventListener('click', () => {
    stateIndex = 0;
    renderState(states[stateIndex]);
    syncButtons();
  });

  nextStateButton.addEventListener('click', () => {
    if (stateIndex > 0) {
      stateIndex -= 1;
      renderState(states[stateIndex]);
      syncButtons();
    }
  });
}

boot().catch((error) => {
  thought.textContent = 'The page missed an hour and is being weird about it.';
  console.error(error);
});
