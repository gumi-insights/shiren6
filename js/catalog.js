const REQUIRED = ['草', '巻物', '腕輪', '壺', '杖'];
const CAPACITY_SLOTS = 6;
const USES_SLOTS = 8;

function assertObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertNonNegInt(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer, got ${JSON.stringify(value)}`);
  }
  return value;
}

function assertString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function markOf(raw) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'string') {
    throw new Error(`印 must be a string when present, got ${JSON.stringify(raw)}`);
  }
  return raw.length === 0 ? null : raw;
}

function parseFixedItem(category, raw) {
  assertObject(raw, `${category} item`);
  const name = assertString(raw['名前'], `${category} 名前`);
  const buy = assertNonNegInt(raw['買値'], `${category}:${name} 買値`);
  const sell = assertNonNegInt(raw['売値'], `${category}:${name} 売値`);
  return {
    id: `${category}:${name}`,
    name,
    category,
    mark: markOf(raw['印']),
    pricing: { kind: 'fixed', price: { buy, sell } },
  };
}

function parseCapacityItem(raw) {
  assertObject(raw, '壺 item');
  const name = assertString(raw['名前'], '壺 名前');
  const naturalRange = assertString(raw['回数'], `壺:${name} 回数`);
  const buys = raw['買値'];
  const sells = raw['売値'];
  if (!Array.isArray(buys) || buys.length !== CAPACITY_SLOTS) {
    throw new Error(`壺:${name} 買値 must be an array of length ${CAPACITY_SLOTS}`);
  }
  if (!Array.isArray(sells) || sells.length !== CAPACITY_SLOTS) {
    throw new Error(`壺:${name} 売値 must be an array of length ${CAPACITY_SLOTS}`);
  }
  const points = [];
  for (let capacity = 0; capacity < CAPACITY_SLOTS; capacity++) {
    points.push({
      capacity,
      price: {
        buy: assertNonNegInt(buys[capacity], `壺:${name} 買値[${capacity}]`),
        sell: assertNonNegInt(sells[capacity], `壺:${name} 売値[${capacity}]`),
      },
    });
  }
  return {
    id: `壺:${name}`,
    name,
    category: '壺',
    mark: markOf(raw['印']),
    pricing: { kind: 'capacity', naturalRange, points },
  };
}

function parseUsesItem(raw) {
  assertObject(raw, '杖 item');
  const name = assertString(raw['名前'], '杖 名前');
  const naturalRange = assertString(raw['回数'], `杖:${name} 回数`);
  const buys = raw['買値'];
  const sells = raw['売値'];
  if (!Array.isArray(buys) || buys.length !== USES_SLOTS) {
    throw new Error(`杖:${name} 買値 must be an array of length ${USES_SLOTS}`);
  }
  if (!Array.isArray(sells) || sells.length !== USES_SLOTS) {
    throw new Error(`杖:${name} 売値 must be an array of length ${USES_SLOTS}`);
  }
  const points = [];
  for (let uses = 0; uses < USES_SLOTS; uses++) {
    points.push({
      uses,
      price: {
        buy: assertNonNegInt(buys[uses], `杖:${name} 買値[${uses}]`),
        sell: assertNonNegInt(sells[uses], `杖:${name} 売値[${uses}]`),
      },
    });
  }
  return {
    id: `杖:${name}`,
    name,
    category: '杖',
    mark: markOf(raw['印']),
    pricing: { kind: 'uses', naturalRange, points },
  };
}

export function parseCatalog(raw) {
  assertObject(raw, 'catalog');
  for (const key of REQUIRED) {
    if (!(key in raw)) {
      throw new Error(`catalog missing required category ${key}`);
    }
  }

  const items = [];

  for (const category of ['草', '巻物', '腕輪']) {
    const list = raw[category];
    if (!Array.isArray(list)) {
      throw new Error(`${category} must be an array`);
    }
    for (const entry of list) {
      items.push(parseFixedItem(category, entry));
    }
  }

  const pot = raw['壺'];
  assertObject(pot, '壺');
  if (!Array.isArray(pot['アイテム'])) {
    throw new Error('壺.アイテム must be an array');
  }
  for (const entry of pot['アイテム']) {
    items.push(parseCapacityItem(entry));
  }

  const wand = raw['杖'];
  assertObject(wand, '杖');
  if (!Array.isArray(wand['アイテム'])) {
    throw new Error('杖.アイテム must be an array');
  }
  for (const entry of wand['アイテム']) {
    items.push(parseUsesItem(entry));
  }

  return { items };
}
