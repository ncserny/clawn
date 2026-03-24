const lobstersGrid = document.querySelector('#lobstersGrid');
const lobstersCount = document.querySelector('#lobstersCount');
const lobstersLatest = document.querySelector('#lobstersLatest');
const lobstersOldest = document.querySelector('#lobstersOldest');

function formatHour(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

function renderCard(item) {
  const article = document.createElement('article');
  article.className = 'clown-card';

  const image = item.lobsterImagePath
    ? `<img class="clown-card__image" src="${item.lobsterImagePath}" alt="Clawn lobster image from ${item.hourKey}" loading="lazy" />`
    : `<div class="clown-card__placeholder">missing lobster image</div>`;

  article.innerHTML = `
    <div class="clown-card__media">${image}</div>
    <div class="clown-card__body">
      <p class="label">${formatHour(item.hourKey)}</p>
      <p class="clown-card__mood">${item.mood || 'unknown mood'}</p>
      <p class="clown-card__question">${item.question || ''}</p>
      <a class="clown-card__link mono" href="./index.html?v=${encodeURIComponent(item.hourKey)}">open this hour</a>
    </div>
  `;

  return article;
}

async function boot() {
  const history = await fetch('./data/archive.json').then((response) => response.json());
  const items = history
    .filter((item) => item.lobsterImagePath)
    .sort((a, b) => b.hourKey.localeCompare(a.hourKey));

  lobstersCount.textContent = `${items.length} lobster images`;
  lobstersLatest.textContent = items[0]?.hourKey || 'none';
  lobstersOldest.textContent = items.at(-1)?.hourKey || 'none';

  lobstersGrid.innerHTML = '';
  items.forEach((item) => {
    lobstersGrid.appendChild(renderCard(item));
  });
}

boot().catch((error) => {
  console.error(error);
  lobstersCount.textContent = 'archive failed to load';
});
