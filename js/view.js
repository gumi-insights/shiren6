import { parameterOptions, priceChips, queryMatches, statusChoices } from './domain.js';

const CATEGORIES = ['草', '巻物', '腕輪', '壺', '杖'];
const CATEGORY_FILE = {
  草: 'grass',
  巻物: 'scroll',
  腕輪: 'bracelet',
  壺: 'pot',
  杖: 'staff',
};
const numberFmt = new Intl.NumberFormat('ja-JP');
const ROW = 48;

let leaveTimers = new Map();
const missingIcons = new Set();

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function formatPrice(n) {
  return numberFmt.format(n);
}

function iconSrc(category, status) {
  const file = CATEGORY_FILE[category];
  if (status === 'blessed') return `./assets/categories/${file}-blessed.png`;
  if (status === 'cursed') return `./assets/categories/${file}-cursed.png`;
  return `./assets/categories/${file}.png`;
}

function iconCandidates(category, status) {
  const order = [status, 'normal', 'blessed', 'cursed'];
  const seen = new Set();
  const urls = [];
  for (const name of order) {
    if (seen.has(name)) continue;
    seen.add(name);
    urls.push(iconSrc(category, name));
  }
  return urls;
}

function showFallback(img, fallback, category, status) {
  img.hidden = true;
  fallback.hidden = false;
  fallback.textContent = category.charAt(0);
  fallback.classList.remove('is-blessed', 'is-cursed');
  if (status === 'blessed') fallback.classList.add('is-blessed');
  if (status === 'cursed') fallback.classList.add('is-cursed');
}

function bindIcon(img, fallback, category, status) {
  const candidates = iconCandidates(category, status).filter((src) => !missingIcons.has(src));
  img.alt = '';
  if (candidates.length === 0) {
    showFallback(img, fallback, category, status);
    return;
  }
  let index = 0;
  const step = () => {
    if (index >= candidates.length) {
      showFallback(img, fallback, category, status);
      return;
    }
    const src = candidates[index++];
    img.onload = () => {
      img.hidden = false;
      fallback.hidden = true;
    };
    img.onerror = () => {
      missingIcons.add(src);
      step();
    };
    if (img.getAttribute('src') !== src) img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      img.hidden = false;
      fallback.hidden = true;
      return;
    }
    img.hidden = true;
    fallback.hidden = true;
  };
  step();
}

function priceSpan(points, side) {
  const values = points.map((p) => p[side]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)}–${formatPrice(max)}`;
}

function priceBox(side, points) {
  const box = document.createElement('span');
  box.className = `price-box price-box-${side}`;
  const key = document.createElement('span');
  key.className = 'price-box-k';
  key.textContent = side === 'buy' ? '買値' : '売値';
  const value = document.createElement('span');
  value.className = 'price-box-n';
  value.textContent = priceSpan(points, side);
  box.append(key, value);
  return box;
}

function naturalLabel(category, range) {
  if (!range) return null;
  if (category === '壺') return `容量設定値 ${range}`;
  if (category === '杖') return `回数設定値 ${range}`;
  return range;
}

function chipButton(label, { pressed = false, value = null, className = 'chip' } = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className + (pressed ? ' is-selected' : '');
  btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  btn.textContent = label;
  if (value !== null && value !== undefined) btn.dataset.value = String(value);
  return btn;
}

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function renderCategoryBar(root, filter, dispatch) {
  clearChildren(root);
  for (const category of CATEGORIES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'category-btn' + (filter.category === category ? ' is-selected' : '');
    btn.setAttribute('aria-pressed', filter.category === category ? 'true' : 'false');
    btn.setAttribute('aria-label', category);
    const img = document.createElement('img');
    img.className = 'category-icon';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    const fallback = document.createElement('span');
    fallback.className = 'category-fallback';
    fallback.hidden = true;
    fallback.setAttribute('aria-hidden', 'true');
    bindIcon(img, fallback, category, 'normal');
    const label = document.createElement('span');
    label.className = 'category-label';
    label.textContent = category;
    label.setAttribute('aria-hidden', 'true');
    btn.append(img, fallback, label);
    btn.addEventListener('click', () => dispatch({ type: 'selectCategory', category }));
    root.append(btn);
  }
}

function statusRenderKey(filter) {
  const choices = statusChoices(filter);
  return `${filter.category}:${choices.map((c) => `${c.id}=${c.included ? 1 : 0}`).join(',')}`;
}

function renderStatusBar(root, filter, dispatch) {
  clearChildren(root);
  for (const choice of statusChoices(filter)) {
    const row = document.createElement('div');
    row.className = 'status-option';
    const name = document.createElement('span');
    name.className = 'status-option-label';
    name.textContent = choice.label;
    const word = choice.included ? '含める' : '含めない';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'status-switch' + (choice.included ? ' is-on' : '');
    btn.role = 'switch';
    btn.setAttribute('aria-checked', choice.included ? 'true' : 'false');
    btn.setAttribute('aria-label', `${choice.label}、${word}`);
    btn.dataset.status = choice.id;
    const text = document.createElement('span');
    text.className = 'status-switch-text';
    text.textContent = word;
    const knob = document.createElement('span');
    knob.className = 'status-switch-knob';
    knob.setAttribute('aria-hidden', 'true');
    btn.append(text, knob);
    btn.addEventListener('click', () => dispatch({ type: 'toggleStatus', status: choice.id }));
    row.append(name, btn);
    root.append(row);
  }
}

function renderParamChips(root, catalog, filter, dispatch) {
  clearChildren(root);
  root.hidden = true;
  if (filter.category !== '壺' && filter.category !== '杖') return;
  root.hidden = false;
  const legend = document.createElement('div');
  legend.className = 'control-label';
  legend.textContent = filter.category === '壺' ? '容量' : '残り回数';
  root.append(legend);
  const row = document.createElement('div');
  row.className = 'chip-row';
  const selected = filter.parameter.value;
  const none = chipButton('指定なし', { pressed: selected === null });
  none.addEventListener('click', () => dispatch({ type: 'setParameter', value: null }));
  row.append(none);
  for (const n of parameterOptions(catalog, filter.category)) {
    const btn = chipButton(String(n), { pressed: selected === n, value: n });
    btn.addEventListener('click', () => dispatch({ type: 'setParameter', value: n }));
    row.append(btn);
  }
  root.append(row);
}

function selectedPrice(filter, side) {
  return filter.price.kind === side ? filter.price.value : null;
}

function buildStops(catalog, filter, side) {
  const prices = [...priceChips(catalog, filter, side)];
  const selected = selectedPrice(filter, side);
  if (typeof selected === 'number' && !prices.includes(selected)) {
    prices.push(selected);
    prices.sort((a, b) => a - b);
  }
  return [
    { value: null, label: '指定なし' },
    ...prices.map((value) => ({ value, label: formatPrice(value) })),
  ];
}

function appendPrices(body, points, choices) {
  const showStatus = choices.filter((c) => c.included).length > 1;
  if (!showStatus) {
    const prices = document.createElement('div');
    prices.className = 'result-prices';
    prices.append(priceBox('buy', points), priceBox('sell', points));
    body.append(prices);
    return;
  }
  const groups = new Map();
  for (const point of points) {
    if (!groups.has(point.status)) groups.set(point.status, []);
    groups.get(point.status).push(point);
  }
  for (const choice of choices) {
    if (!choice.included) continue;
    const group = groups.get(choice.id);
    if (!group) continue;
    const line = document.createElement('div');
    line.className = 'result-prices';
    const tag = document.createElement('span');
    tag.className = `result-status is-${choice.id}`;
    tag.textContent = choice.label;
    line.append(tag, priceBox('buy', group), priceBox('sell', group));
    body.append(line);
  }
}

function iconStatus(points) {
  const statuses = new Set(points.map((point) => point.status));
  if (statuses.size === 1) return [...statuses][0];
  return 'normal';
}

function applyIdentifiedState(row, on, name) {
  row.classList.toggle('is-identified', on);
  const btn = row.querySelector('[data-role="identify"]');
  if (!btn) return;
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  btn.setAttribute('aria-label', on ? `${name}の識別済みを外す` : `${name}を識別済みにする`);
  const mark = btn.querySelector('.identify-mark');
  if (mark) mark.textContent = on ? '✔' : '';
}

function fillResultBody(body, match, choices) {
  clearChildren(body);

  const title = document.createElement('div');
  title.className = 'result-title';
  const name = document.createElement('span');
  name.className = 'result-name';
  name.textContent = match.name;
  title.append(name);
  if (match.mark) {
    const mark = document.createElement('span');
    mark.className = 'result-mark';
    mark.textContent = `印 ${match.mark}`;
    title.append(mark);
  }
  body.append(title);

  const rangeText = naturalLabel(match.category, match.naturalRange);
  if (rangeText) {
    const range = document.createElement('div');
    range.className = 'result-range';
    range.textContent = rangeText;
    body.append(range);
  }

  const params = [...new Set(match.points.map((p) => p.paramLabel).filter(Boolean))];
  if (params.length > 0 && params.length <= 3) {
    const paramEl = document.createElement('div');
    paramEl.className = 'result-params';
    paramEl.textContent = params.join('、');
    body.append(paramEl);
  }

  appendPrices(body, match.points, choices);
}

function syncResultRow(li, match, choices, identified) {
  const nextIcon = iconStatus(match.points);
  if (li.dataset.iconStatus !== nextIcon) {
    bindIcon(
      li.querySelector('.result-icon img'),
      li.querySelector('.result-fallback'),
      match.category,
      nextIcon,
    );
    li.dataset.iconStatus = nextIcon;
  }
  fillResultBody(li.querySelector('.result-body'), match, choices);
  applyIdentifiedState(li, identified.has(match.key), match.name);
}

function buildResultRow(match, choices, identified, onToggleIdentified) {
  const li = document.createElement('li');
  li.className = 'result-row';
  li.dataset.key = match.key;
  li.dataset.iconStatus = iconStatus(match.points);

  const iconWrap = document.createElement('div');
  iconWrap.className = 'result-icon';
  const img = document.createElement('img');
  img.alt = '';
  const fallback = document.createElement('span');
  fallback.className = 'result-fallback';
  fallback.hidden = true;
  fallback.setAttribute('aria-hidden', 'true');
  bindIcon(img, fallback, match.category, li.dataset.iconStatus);
  iconWrap.append(img, fallback);

  const body = document.createElement('div');
  body.className = 'result-body';
  fillResultBody(body, match, choices);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'identify-toggle';
  toggle.dataset.role = 'identify';
  const mark = document.createElement('span');
  mark.className = 'identify-mark';
  mark.setAttribute('aria-hidden', 'true');
  toggle.append(mark);
  toggle.addEventListener('click', () => onToggleIdentified(match.key));

  li.append(iconWrap, body, toggle);
  applyIdentifiedState(li, identified.has(match.key), match.name);
  return li;
}

function identifiedCountLabel(matches, identified) {
  const known = matches.filter((match) => identified.has(match.key)).length;
  if (known === 0) return `${matches.length}件`;
  return `${matches.length}件（識別済み ${known}）`;
}

function paintIdentified(listEl, countEl, matches, identified) {
  countEl.textContent = identifiedCountLabel(matches, identified);
  const byKey = new Map(matches.map((match) => [match.key, match]));
  for (const child of listEl.children) {
    if (!(child instanceof HTMLElement) || !child.dataset.key) continue;
    if (child.classList.contains('is-leaving')) continue;
    const match = byKey.get(child.dataset.key);
    if (!match) continue;
    applyIdentifiedState(child, identified.has(match.key), match.name);
  }
}

function renderResultsList(listEl, emptyEl, countEl, matches, choices, identified, onToggleIdentified) {
  const reduce = prefersReducedMotion();
  countEl.textContent = identifiedCountLabel(matches, identified);
  emptyEl.hidden = matches.length > 0;

  const nextByKey = new Map(matches.map((m) => [m.key, m]));
  const currentEls = new Map();
  for (const child of [...listEl.children]) {
    if (!(child instanceof HTMLElement) || !child.dataset.key) continue;
    if (child.classList.contains('is-leaving')) continue;
    currentEls.set(child.dataset.key, child);
  }

  const oldTops = new Map();
  for (const [key, el] of currentEls) {
    oldTops.set(key, el.getBoundingClientRect().top);
  }
  const listTop = listEl.getBoundingClientRect().top;
  const initialPaint = currentEls.size === 0;

  for (const [key, el] of currentEls) {
    if (nextByKey.has(key)) continue;
    if (reduce) {
      el.remove();
      continue;
    }
    const top = oldTops.get(key) - listTop + listEl.scrollTop;
    el.classList.add('is-leaving');
    el.style.position = 'absolute';
    el.style.left = '0';
    el.style.right = '0';
    el.style.top = `${top}px`;
    el.style.zIndex = '1';
    el.style.margin = '0';
    void el.offsetHeight;
    el.style.transition = 'opacity 280ms ease-out, transform 280ms ease-out';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-10px)';
    const prev = leaveTimers.get(key);
    if (prev) clearTimeout(prev);
    leaveTimers.set(
      key,
      setTimeout(() => {
        el.remove();
        leaveTimers.delete(key);
      }, 280),
    );
  }

  const ordered = [];
  for (const match of matches) {
    const existing = currentEls.get(match.key);
    const el = existing ?? buildResultRow(match, choices, identified, onToggleIdentified);
    if (existing) syncResultRow(existing, match, choices, identified);
    ordered.push({
      key: match.key,
      el,
      kind: oldTops.has(match.key) ? 'stay' : 'enter',
      oldTop: oldTops.get(match.key),
    });
    listEl.appendChild(el);
  }

  if (reduce || initialPaint) return;

  for (const item of ordered) {
    if (item.kind === 'enter') {
      item.el.style.opacity = '0';
      item.el.style.transform = 'translateY(12px)';
    } else {
      item.el.style.transition = 'none';
      item.el.style.transform = '';
      item.el.style.opacity = '';
    }
  }

  for (const item of ordered) {
    if (item.kind !== 'stay' || item.oldTop === undefined) continue;
    const dy = item.oldTop - item.el.getBoundingClientRect().top;
    if (dy !== 0) item.el.style.transform = `translateY(${dy}px)`;
  }
  void listEl.offsetHeight;

  for (const item of ordered) {
    if (item.kind === 'enter') {
      item.el.style.transition = 'opacity 280ms ease-out, transform 280ms ease-out';
      item.el.style.opacity = '1';
      item.el.style.transform = 'translateY(0)';
    } else if (item.el.style.transform) {
      item.el.style.transition = 'transform 280ms ease-out';
      item.el.style.transform = 'translateY(0)';
    }
  }
}

function mountReel(root, side) {
  const strip = root.querySelector('.reel-strip');
  const windowEl = root.querySelector('.reel-window');
  let stops = [];
  let index = 0;
  let pointer = null;
  let wheelAccum = 0;
  let dispatch = null;

  function clamp(next) {
    return Math.max(0, Math.min(stops.length - 1, next));
  }

  function paintTransform(at) {
    strip.style.transform = `translateY(${(1 - at) * ROW}px)`;
  }

  function paintClasses() {
    [...strip.children].forEach((el, i) => {
      el.classList.toggle('is-selected', i === index);
      el.classList.toggle('is-near', Math.abs(i - index) === 1);
    });
  }

  function selectedValue() {
    return stops[index] ? stops[index].value : null;
  }

  function commit(next) {
    if (!dispatch || stops.length === 0) return;
    const clamped = clamp(next);
    const value = stops[clamped] ? stops[clamped].value : null;
    const prev = selectedValue();
    index = clamped;
    paintTransform(index);
    paintClasses();
    if (Object.is(value, prev)) return;
    const actionType = side === 'buy' ? 'setBuy' : 'setSell';
    dispatch({ type: actionType, [side]: value });
  }

  function syncStrip() {
    while (strip.children.length > stops.length) strip.lastChild.remove();
    for (let i = 0; i < stops.length; i++) {
      let item = strip.children[i];
      if (!item) {
        item = document.createElement('div');
        item.className = 'reel-item';
        strip.append(item);
      }
      if (item.textContent !== stops[i].label) item.textContent = stops[i].label;
    }
  }

  function paint(catalog, filter, nextDispatch) {
    dispatch = nextDispatch;
    if (pointer) return;
    const nextStops = buildStops(catalog, filter, side);
    const selected = selectedPrice(filter, side);
    const found = nextStops.findIndex((stop) => stop.value === selected);
    const nextIndex = found >= 0 ? found : 0;
    const same =
      nextIndex === index &&
      strip.children.length === nextStops.length &&
      nextStops.length === stops.length &&
      nextStops.every((stop, i) => stop.value === stops[i].value && stop.label === stops[i].label);
    stops = nextStops;
    index = nextIndex;
    if (same) return;
    syncStrip();
    paintTransform(index);
    paintClasses();
  }

  windowEl.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      let delta = event.deltaY;
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= ROW;
      else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= ROW * 3;
      wheelAccum += delta;
      if (Math.abs(wheelAccum) < ROW) return;
      const dir = Math.sign(wheelAccum);
      wheelAccum = 0;
      commit(index + dir);
    },
    { passive: false },
  );

  windowEl.addEventListener('pointerdown', (event) => {
    pointer = { id: event.pointerId, y: event.clientY, index };
    windowEl.setPointerCapture(event.pointerId);
  });

  windowEl.addEventListener('pointermove', (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dy = event.clientY - pointer.y;
    const visual = clamp(pointer.index - dy / ROW);
    paintTransform(visual);
  });

  function endPointer(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dy = event.clientY - pointer.y;
    const next = Math.round(pointer.index - dy / ROW);
    pointer = null;
    commit(next);
  }

  windowEl.addEventListener('pointerup', endPointer);
  windowEl.addEventListener('pointercancel', endPointer);

  windowEl.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      commit(index - 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      commit(index + 1);
    }
  });

  root.querySelectorAll('.nudge').forEach((btn) => {
    btn.addEventListener('click', () => {
      commit(index + Number(btn.dataset.dir));
    });
  });

  return { paint };
}

export function createView(root) {
  root.innerHTML = `
    <header class="page-header">
      <h1 class="page-title">風来のシレン６ 道具識別</h1>
    </header>
    <div class="layout">
      <section class="controls" aria-label="絞り込み">
        <div class="control-block">
          <div class="control-label">種類</div>
          <div class="category-row" data-role="categories"></div>
        </div>
        <div class="control-block">
          <div class="control-label">状態</div>
          <div class="status-row" data-role="status" role="group" aria-label="状態"></div>
        </div>
        <div class="control-block" data-role="params" hidden></div>
        <div class="price-row">
          <div class="control-block">
            <div class="control-label">買値</div>
            <div class="reel" data-role="buy-reel" data-side="buy">
              <div class="nudge-row">
                <button type="button" class="nudge" data-dir="-1" aria-label="安い方へ">▲</button>
              </div>
              <div class="reel-window" tabindex="0" aria-label="買値">
                <div class="reel-cursor"></div>
                <div class="reel-strip"></div>
              </div>
              <div class="nudge-row">
                <button type="button" class="nudge" data-dir="1" aria-label="高い方へ">▼</button>
              </div>
            </div>
          </div>
          <div class="control-block">
            <div class="control-label">売値</div>
            <div class="reel" data-role="sell-reel" data-side="sell">
              <div class="nudge-row">
                <button type="button" class="nudge" data-dir="-1" aria-label="安い方へ">▲</button>
              </div>
              <div class="reel-window" tabindex="0" aria-label="売値">
                <div class="reel-cursor"></div>
                <div class="reel-strip"></div>
              </div>
              <div class="nudge-row">
                <button type="button" class="nudge" data-dir="1" aria-label="高い方へ">▼</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="results" aria-label="候補">
        <div class="results-head">
          <h2 class="results-title">候補</h2>
          <span class="results-count" data-role="count">0件</span>
          <button type="button" class="reset-identified" data-role="reset-identified" aria-expanded="false" aria-controls="reset-confirm">識別済みを初期化</button>
        </div>
        <div id="reset-confirm" class="reset-confirm" data-role="reset-confirm" hidden>
          <p class="reset-confirm-text">識別済みの ✔ をすべて外します。別の種類で付けたものも含み、元には戻せません。</p>
          <div class="reset-confirm-actions">
            <button type="button" class="reset-confirm-no" data-role="reset-confirm-no">やめる</button>
            <button type="button" class="reset-confirm-yes" data-role="reset-confirm-yes">初期化する</button>
          </div>
        </div>
        <p class="results-hint">✔ は識別済みの記録として利用してください。</p>
        <p class="results-empty" data-role="empty" hidden>一致する道具がありません</p>
        <ul class="results-list" data-role="list"></ul>
      </section>
    </div>
  `;

  const els = {
    categories: root.querySelector('[data-role="categories"]'),
    status: root.querySelector('[data-role="status"]'),
    params: root.querySelector('[data-role="params"]'),
    count: root.querySelector('[data-role="count"]'),
    empty: root.querySelector('[data-role="empty"]'),
    list: root.querySelector('[data-role="list"]'),
    reset: root.querySelector('[data-role="reset-identified"]'),
    resetConfirm: root.querySelector('[data-role="reset-confirm"]'),
    resetNo: root.querySelector('[data-role="reset-confirm-no"]'),
    resetYes: root.querySelector('[data-role="reset-confirm-yes"]'),
  };

  let dispatch = () => {};
  let shownCategory = null;
  let shownStatusKey = null;
  let shownParamsKey = null;

  function setConfirmOpen(open) {
    els.resetConfirm.hidden = !open;
    els.reset.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  els.reset.addEventListener('click', () => {
    if (els.reset.disabled) return;
    setConfirmOpen(true);
    els.resetNo.focus();
  });
  els.resetNo.addEventListener('click', () => {
    setConfirmOpen(false);
    els.reset.focus();
  });
  els.resetYes.addEventListener('click', () => {
    setConfirmOpen(false);
    dispatch({ type: 'clearIdentified' });
  });
  els.resetConfirm.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    setConfirmOpen(false);
    els.reset.focus();
  });

  const buyReel = mountReel(root.querySelector('[data-role="buy-reel"]'), 'buy');
  const sellReel = mountReel(root.querySelector('[data-role="sell-reel"]'), 'sell');

  return {
    render(catalog, filter, identified, nextDispatch, options = {}) {
      dispatch = nextDispatch;
      els.reset.disabled = identified.size === 0;
      if (identified.size === 0) setConfirmOpen(false);
      if (!options.resultsOnly) {
        if (shownCategory !== filter.category) {
          renderCategoryBar(els.categories, filter, dispatch);
          shownCategory = filter.category;
        }
        const statusKey = statusRenderKey(filter);
        if (shownStatusKey !== statusKey) {
          renderStatusBar(els.status, filter, dispatch);
          shownStatusKey = statusKey;
        }
        const paramsKey = `${filter.category}:${filter.parameter.value ?? ''}`;
        if (shownParamsKey !== paramsKey) {
          renderParamChips(els.params, catalog, filter, dispatch);
          shownParamsKey = paramsKey;
        }
        buyReel.paint(catalog, filter, dispatch);
        sellReel.paint(catalog, filter, dispatch);
      }
      const matches = queryMatches(catalog, filter);
      if (options.resultsOnly) {
        paintIdentified(els.list, els.count, matches, identified);
        return;
      }
      renderResultsList(
        els.list,
        els.empty,
        els.count,
        matches,
        statusChoices(filter),
        identified,
        (id) => dispatch({ type: 'toggleIdentified', id }),
      );
    },
  };
}
