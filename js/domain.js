export function adjustPrice(base, status) {
  if (status === 'normal') return base;
  if (status === 'blessed') return base * 2;
  // 87 / 100 avoids binary float from 0.87
  return Math.floor((base * 87) / 100);
}

const CATEGORY_STATUS_IDS = {
  草: ['normal', 'blessed', 'cursed'],
  巻物: ['normal', 'blessed', 'cursed'],
  腕輪: ['normal', 'cursed'],
  壺: ['normal', 'cursed'],
  杖: ['normal', 'cursed'],
};
const STATUS_LABELS = { normal: '通常', blessed: '祝福', cursed: '呪い' };

function parameterFor(category) {
  if (category === '壺') return { kind: 'capacity', value: null };
  if (category === '杖') return { kind: 'uses', value: null };
  return { kind: 'none' };
}

function blankFor(category) {
  return {
    category,
    includedStatusIds: new Set(
      CATEGORY_STATUS_IDS[category].filter((id) => id !== 'cursed'),
    ),
    price: { kind: 'any' },
    parameter: parameterFor(category),
  };
}

export function initialFilter() {
  return blankFor('草');
}

export function toggleIdentified(identified, id) {
  const next = new Set(identified);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function reduceFilter(state, action) {
  switch (action.type) {
    case 'selectCategory':
      return blankFor(action.category);
    case 'toggleStatus': {
      const legal = CATEGORY_STATUS_IDS[state.category];
      if (!legal.includes(action.status)) return state;
      const includedStatusIds = new Set(state.includedStatusIds);
      if (includedStatusIds.has(action.status)) includedStatusIds.delete(action.status);
      else includedStatusIds.add(action.status);
      return { ...state, includedStatusIds };
    }
    case 'setParameter': {
      if (state.parameter.kind === 'none') return state;
      return {
        ...state,
        parameter: { ...state.parameter, value: action.value },
      };
    }
    case 'setBuy':
      return {
        ...state,
        price:
          action.buy === null
            ? { kind: 'any' }
            : { kind: 'buy', value: action.buy },
      };
    case 'setSell':
      return {
        ...state,
        price:
          action.sell === null
            ? { kind: 'any' }
            : { kind: 'sell', value: action.sell },
      };
    default:
      return state;
  }
}

export function statusChoices(filter) {
  return CATEGORY_STATUS_IDS[filter.category].map((id) => ({
    id,
    label: STATUS_LABELS[id],
    included: filter.includedStatusIds.has(id),
  }));
}

function includedLegalStatusIds(filter) {
  return CATEGORY_STATUS_IDS[filter.category].filter((id) =>
    filter.includedStatusIds.has(id),
  );
}

function boundsOf(naturalRange) {
  const matched = /^(\d+)-(\d+)$/.exec(naturalRange);
  if (!matched) return null;
  return { min: Number(matched[1]), max: Number(matched[2]) };
}

function inNaturalRange(naturalRange, value) {
  const bounds = boundsOf(naturalRange);
  if (!bounds) return false;
  return value >= bounds.min && value <= bounds.max;
}

function naturalPoints(pricing) {
  if (pricing.kind === 'capacity') {
    return pricing.points.filter((p) =>
      inNaturalRange(pricing.naturalRange, p.capacity),
    );
  }
  if (pricing.kind === 'uses') {
    return pricing.points.filter((p) =>
      inNaturalRange(pricing.naturalRange, p.uses),
    );
  }
  return [];
}

function slotsFor(item, filter) {
  const { pricing } = item;
  if (pricing.kind === 'fixed') {
    return [{ paramLabel: null, buy: pricing.price.buy, sell: pricing.price.sell }];
  }
  if (pricing.kind === 'capacity') {
    const wanted = filter.parameter.kind === 'capacity' ? filter.parameter.value : null;
    return naturalPoints(pricing)
      .filter((p) => wanted === null || p.capacity === wanted)
      .map((p) => ({
        paramLabel: `容量 ${p.capacity}`,
        buy: p.price.buy,
        sell: p.price.sell,
      }));
  }
  if (pricing.kind === 'uses') {
    const wanted = filter.parameter.kind === 'uses' ? filter.parameter.value : null;
    return naturalPoints(pricing)
      .filter((p) => wanted === null || p.uses === wanted)
      .map((p) => ({
        paramLabel: `残り回数 ${p.uses}`,
        buy: p.price.buy,
        sell: p.price.sell,
      }));
  }
  return [];
}

function naturalRangeOf(item) {
  if (item.pricing.kind === 'capacity' || item.pricing.kind === 'uses') {
    return item.pricing.naturalRange;
  }
  return null;
}

function matchItem(item, filter, statuses) {
  if (statuses.length === 0) return null;
  const slots = slotsFor(item, filter);
  const points = [];
  for (const slot of slots) {
    for (const status of statuses) {
      const buy = adjustPrice(slot.buy, status);
      const sell = adjustPrice(slot.sell, status);
      if (filter.price.kind === 'buy' && buy !== filter.price.value) continue;
      if (filter.price.kind === 'sell' && sell !== filter.price.value) continue;
      points.push({ paramLabel: slot.paramLabel, buy, sell, status });
    }
  }
  if (points.length === 0) return null;
  return {
    key: item.id,
    name: item.name,
    mark: item.mark,
    category: item.category,
    naturalRange: naturalRangeOf(item),
    points,
  };
}

export function queryMatches(catalog, filter) {
  const statuses = includedLegalStatusIds(filter);
  if (statuses.length === 0) return [];
  const matches = [];
  for (const item of catalog.items) {
    if (item.category !== filter.category) continue;
    const match = matchItem(item, filter, statuses);
    if (match) matches.push(match);
  }
  matches.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  return matches;
}

export function parameterOptions(catalog, category) {
  if (category !== '壺' && category !== '杖') return [];
  const values = new Set();
  for (const item of catalog.items) {
    if (item.category !== category) continue;
    const range =
      item.pricing.kind === 'capacity' || item.pricing.kind === 'uses'
        ? item.pricing.naturalRange
        : null;
    const bounds = range ? boundsOf(range) : null;
    if (!bounds) continue;
    for (let n = bounds.min; n <= bounds.max; n++) values.add(n);
  }
  return [...values].sort((a, b) => a - b);
}

export function priceChips(catalog, filter, side) {
  const matches = queryMatches(catalog, { ...filter, price: { kind: 'any' } });
  const prices = new Set();
  for (const match of matches) {
    for (const point of match.points) {
      prices.add(point[side]);
    }
  }
  return [...prices].sort((a, b) => a - b);
}
