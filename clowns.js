const clownsGrid = document.querySelector('#clownsGrid');
const clownsCount = document.querySelector('#clownsCount');
const clownsLatest = document.querySelector('#clownsLatest');
const clownsOldest = document.querySelector('#clownsOldest');

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

  const image = item.imagePath
    ? `<img class="clown-card__image" src="${item.imagePath}" alt="Clawn clown image from ${item.hourKey}" loading="lazy" />`
    : `<div class="clown-card__placeholder">missing clown image</div>`;

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
    .filter((item) => item.imagePath)
    .sort((a, b) => b.hourKey.localeCompare(a.hourKey));

  clownsCount.textContent = `${items.length} clown images`;
  clownsLatest.textContent = items[0]?.hourKey || 'none';
  clownsOldest.textContent = items.at(-1)?.hourKey || 'none';

  clownsGrid.innerHTML = '';
  items.forEach((item) => {
    clownsGrid.appendChild(renderCard(item));
  });
}

boot().catch((error) => {
  console.error(error);
  clownsCount.textContent = 'archive failed to load';
});
