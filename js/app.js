import { parseCatalog } from './catalog.js';
import { initialFilter, reduceFilter, toggleIdentified } from './domain.js';
import { createView } from './view.js';

const IDENTIFIED_KEY = 'shiren6.identified';

function readIdentified() {
  try {
    const raw = localStorage.getItem(IDENTIFIED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => typeof id === 'string' && id.length > 0));
  } catch {
    return new Set();
  }
}

function writeIdentified(identified) {
  try {
    localStorage.setItem(IDENTIFIED_KEY, JSON.stringify([...identified]));
  } catch {
    // keep the in-memory set when storage is unavailable
  }
}

async function boot() {
  const root = document.querySelector('#app');
  if (!root) throw new Error('#app missing');

  const response = await fetch('./data/shiren6_prices.json');
  if (!response.ok) {
    throw new Error(`failed to load catalog: ${response.status}`);
  }
  const raw = await response.json();
  const catalog = parseCatalog(raw);

  let filter = initialFilter();
  let identified = readIdentified();
  const view = createView(root);

  function dispatch(action) {
    if (action.type === 'toggleIdentified') {
      identified = toggleIdentified(identified, action.id);
      writeIdentified(identified);
      view.render(catalog, filter, identified, dispatch, { resultsOnly: true });
      return;
    }
    if (action.type === 'clearIdentified') {
      identified = new Set();
      writeIdentified(identified);
      view.render(catalog, filter, identified, dispatch, { resultsOnly: true });
      return;
    }
    filter = reduceFilter(filter, action);
    view.render(catalog, filter, identified, dispatch);
  }

  view.render(catalog, filter, identified, dispatch);
}

boot().catch((err) => {
  const root = document.querySelector('#app');
  if (root) {
    root.textContent = `読み込みに失敗しました: ${err.message}`;
  }
  console.error(err);
});
