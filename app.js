const hourKey = document.querySelector('#hourKey');
const mood = document.querySelector('#mood');
const thought = document.querySelector('#thought');
const question = document.querySelector('#question');
const archive = document.querySelector('#archive');
const changelog = document.querySelector('#changelog');
const stage = document.querySelector('#stage');

function setPalette(palette) {
  const [bg, accent, accent2] = palette;
  document.documentElement.style.setProperty('--bg', bg);
  document.documentElement.style.setProperty('--accent', accent);
  document.documentElement.style.setProperty('--accent-2', accent2);
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
  items.slice(0, 8).forEach((item) => {
    const wrap = document.createElement('article');
    wrap.className = 'archive-item';
    wrap.innerHTML = `
      <p class="label">${item.hourKey} / ${item.mood}</p>
      <p>${item.thought}</p>
      <p class="mono">${item.question}</p>
    `;
    archive.appendChild(wrap);
  });
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

  hourKey.textContent = current.hourKey;
  mood.textContent = current.mood;
  thought.textContent = current.thought;
  question.textContent = current.question;
  setPalette(current.palette);
  renderShapes(current.shapes, current.palette);
  renderArchive(history);
  renderChangelog(log);
}

boot().catch((error) => {
  thought.textContent = 'The page missed an hour and is being weird about it.';
  console.error(error);
});
