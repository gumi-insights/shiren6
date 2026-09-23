import { parseCatalog } from '../js/catalog.js';
import {
  adjustPrice,
  initialFilter,
  reduceFilter,
  parameterOptions,
  queryMatches,
  priceChips,
  statusChoices,
  toggleIdentified,
} from '../js/domain.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(readFileSync(join(root, 'data', 'shiren6_prices.json'), 'utf8'));
const catalog = parseCatalog(raw);

function fixedFilter(category, overrides = {}) {
  return {
    category,
    includedStatusIds: new Set(['normal', 'blessed', 'cursed']),
    price: { kind: 'any' },
    parameter: { kind: 'none' },
    ...overrides,
  };
}

function potFilter(overrides = {}) {
  return {
    category: '壺',
    includedStatusIds: new Set(['normal', 'cursed']),
    price: { kind: 'any' },
    parameter: { kind: 'capacity', value: null },
    ...overrides,
  };
}

function wandFilter(overrides = {}) {
  return {
    category: '杖',
    includedStatusIds: new Set(['normal', 'cursed']),
    price: { kind: 'any' },
    parameter: { kind: 'uses', value: null },
    ...overrides,
  };
}

function paramValuesOutsideRange(match) {
  if (!match.naturalRange) return [];
  const matched = /^(\d+)-(\d+)$/.exec(match.naturalRange);
  if (!matched) return [];
  const min = Number(matched[1]);
  const max = Number(matched[2]);
  const outside = [];
  for (const point of match.points) {
    if (!point.paramLabel) continue;
    const num = Number(point.paramLabel.replace(/^[^\d]+/, ''));
    if (Number.isNaN(num) || num < min || num > max) outside.push(point.paramLabel);
  }
  return outside;
}

test('adjustPrice cursed and blessed literals', () => {
  assert.equal(adjustPrice(40, 'cursed'), 34);
  assert.equal(adjustPrice(10, 'cursed'), 8);
  assert.equal(adjustPrice(40, 'blessed'), 80);
  assert.equal(adjustPrice(1000, 'cursed'), 870);
  assert.equal(adjustPrice(1500, 'normal'), 1500);
});

test('parsed category counts', () => {
  const counts = { 草: 0, 巻物: 0, 腕輪: 0, 壺: 0, 杖: 0 };
  for (const item of catalog.items) counts[item.category]++;
  assert.equal(counts['草'], 27);
  assert.equal(counts['巻物'], 34);
  assert.equal(counts['腕輪'], 37);
  assert.equal(counts['壺'], 20);
  assert.equal(counts['杖'], 20);
});

test('草 blessed buy 100 includes 毒草 and 暴走の種 only', () => {
  const filter = fixedFilter('草', {
    includedStatusIds: new Set(['blessed']),
    price: { kind: 'buy', value: 100 },
  });
  const matches = queryMatches(catalog, filter);
  const names = matches.map((m) => m.name).sort((a, b) => a.localeCompare(b, 'ja'));
  assert.deepEqual(names, ['毒草', '暴走の種']);
  assert.ok(!names.includes('高飛び草'));
});

test('草 normal buy 100 includes 高飛び and くねくね', () => {
  const filter = fixedFilter('草', {
    includedStatusIds: new Set(['normal']),
    price: { kind: 'buy', value: 100 },
  });
  const matches = queryMatches(catalog, filter);
  const names = matches.map((m) => m.name).sort((a, b) => a.localeCompare(b, 'ja'));
  assert.deepEqual(names, ['くねくね草', '高飛び草']);
});

test('杖 buy 1000 uses null keeps 場所替え and drops かなしば padding', () => {
  const filter = wandFilter({
    includedStatusIds: new Set(['normal']),
    price: { kind: 'buy', value: 1000 },
    parameter: { kind: 'uses', value: null },
  });
  const matches = queryMatches(catalog, filter);
  const byName = Object.fromEntries(matches.map((m) => [m.name, m]));
  assert.ok(byName['場所替えの杖']);
  assert.equal(byName['かなしばりの杖'], undefined);
  assert.ok(byName['場所替えの杖'].points.some((p) => p.paramLabel === '残り回数 5'));
  assert.ok(!byName['場所替えの杖'].points.some((p) => p.paramLabel === '残り回数 3'));
});

test('杖 buy 1000 uses 3 includes 導きの杖 and excludes counts outside 回数設定値', () => {
  const filter = wandFilter({
    includedStatusIds: new Set(['normal']),
    price: { kind: 'buy', value: 1000 },
    parameter: { kind: 'uses', value: 3 },
  });
  const matches = queryMatches(catalog, filter);
  const names = matches.map((m) => m.name);
  assert.ok(names.includes('導きの杖'));
  assert.ok(!names.includes('かなしばりの杖'));
  assert.ok(!names.includes('場所替えの杖'));
});

test('杖 uses 7 hides items whose 回数設定値 does not include 7', () => {
  const filter = wandFilter({
    includedStatusIds: new Set(['normal', 'cursed']),
    parameter: { kind: 'uses', value: 7 },
  });
  const names = queryMatches(catalog, filter).map((m) => m.name);
  assert.ok(names.includes('場所替えの杖'));
  assert.ok(!names.includes('かなしばりの杖'));
  assert.ok(!names.includes('導きの杖'));
});

test('壺 capacity outside 容量設定値 is hidden', () => {
  const atFive = queryMatches(
    catalog,
    potFilter({
      includedStatusIds: new Set(['normal']),
      parameter: { kind: 'capacity', value: 5 },
    }),
  ).map((m) => m.name);
  assert.ok(atFive.includes('保存の壺'));
  assert.ok(!atFive.includes('笑いの壺'));
  assert.ok(!atFive.includes('底抜けの壺'));

  const atZero = queryMatches(
    catalog,
    potFilter({
      includedStatusIds: new Set(['normal']),
      parameter: { kind: 'capacity', value: 0 },
    }),
  ).map((m) => m.name);
  assert.ok(!atZero.includes('保存の壺'));
});

test('壺 parameter null omits capacity outside each item naturalRange', () => {
  const matches = queryMatches(
    catalog,
    potFilter({
      includedStatusIds: new Set(['normal']),
      parameter: { kind: 'capacity', value: null },
    }),
  );
  assert.ok(matches.length > 0);
  for (const match of matches) {
    assert.deepEqual(paramValuesOutsideRange(match), []);
  }
});

test('杖 parameter null omits uses outside each item naturalRange', () => {
  const matches = queryMatches(
    catalog,
    wandFilter({
      includedStatusIds: new Set(['normal']),
      parameter: { kind: 'uses', value: null },
    }),
  );
  assert.ok(matches.length > 0);
  for (const match of matches) {
    assert.deepEqual(paramValuesOutsideRange(match), []);
  }
});

test('toggleStatus blessed on 腕輪 returns the same state', () => {
  const prev = reduceFilter(initialFilter(), { type: 'selectCategory', category: '腕輪' });
  const next = reduceFilter(prev, { type: 'toggleStatus', status: 'blessed' });
  assert.equal(next, prev);
  assert.deepEqual(statusChoices(prev), [
    { id: 'normal', label: '通常', included: true },
    { id: 'cursed', label: '呪い', included: false },
  ]);
});

test('statusChoices for initialFilter includes normal and blessed, not cursed', () => {
  assert.deepEqual(statusChoices(initialFilter()), [
    { id: 'normal', label: '通常', included: true },
    { id: 'blessed', label: '祝福', included: true },
    { id: 'cursed', label: '呪い', included: false },
  ]);
});

test('forged blessed in includedStatusIds emits no blessed points for 腕輪 壺 杖', () => {
  const filters = [
    fixedFilter('腕輪', { includedStatusIds: new Set(['blessed']) }),
    potFilter({ includedStatusIds: new Set(['normal', 'blessed']) }),
    wandFilter({ includedStatusIds: new Set(['normal', 'blessed', 'cursed']) }),
  ];
  for (const filter of filters) {
    for (const match of queryMatches(catalog, filter)) {
      assert.ok(
        !match.points.some((p) => p.status === 'blessed'),
        `${filter.category} must not emit blessed`,
      );
    }
  }
  assert.deepEqual(
    queryMatches(catalog, fixedFilter('腕輪', { includedStatusIds: new Set(['blessed']) })),
    [],
  );
});

test('toggleStatus can leave several statuses on', () => {
  const withCursed = reduceFilter(initialFilter(), { type: 'toggleStatus', status: 'cursed' });
  const next = reduceFilter(withCursed, { type: 'toggleStatus', status: 'normal' });
  assert.deepEqual(next.includedStatusIds, new Set(['blessed', 'cursed']));
});

test('toggleStatus can turn the last status off', () => {
  const prev = fixedFilter('草', {
    includedStatusIds: new Set(['blessed']),
  });
  const next = reduceFilter(prev, { type: 'toggleStatus', status: 'blessed' });
  assert.deepEqual(next.includedStatusIds, new Set());
  assert.deepEqual(queryMatches(catalog, next), []);
});

test('草 unidentified buy 100 matches every status that hits 100', () => {
  const filter = fixedFilter('草', {
    price: { kind: 'buy', value: 100 },
  });
  const matches = queryMatches(catalog, filter);
  const byName = Object.fromEntries(matches.map((m) => [m.name, m]));
  assert.equal(byName['毒草'].points[0].status, 'blessed');
  assert.equal(byName['暴走の種'].points[0].status, 'blessed');
  assert.equal(byName['高飛び草'].points[0].status, 'normal');
  assert.equal(byName['くねくね草'].points[0].status, 'normal');
});

test('壺 保存 capacity 0 normal and cursed buy', () => {
  const pot = catalog.items.find((i) => i.id === '壺:保存の壺');
  assert.ok(pot);
  const base = pot.pricing.points.find((p) => p.capacity === 0).price.buy;
  assert.equal(base, 800);
  assert.equal(adjustPrice(base, 'cursed'), 696);
});

test('initialFilter includes normal and blessed, not cursed', () => {
  assert.deepEqual(initialFilter(), {
    category: '草',
    includedStatusIds: new Set(['normal', 'blessed']),
    price: { kind: 'any' },
    parameter: { kind: 'none' },
  });
});

test('parameterOptions unions naturalRange integers', () => {
  assert.deepEqual(parameterOptions(catalog, '壺'), [2, 3, 4, 5]);
  assert.deepEqual(parameterOptions(catalog, '杖'), [2, 3, 4, 5, 6, 7]);
  assert.deepEqual(parameterOptions(catalog, '草'), []);
});

test('setBuy then setSell leaves only the sell price', () => {
  let state = initialFilter();
  state = reduceFilter(state, { type: 'setBuy', buy: 100 });
  assert.deepEqual(state.price, { kind: 'buy', value: 100 });
  state = reduceFilter(state, { type: 'setSell', sell: 40 });
  assert.deepEqual(state.price, { kind: 'sell', value: 40 });
});

test('setBuy of null leaves price any', () => {
  const withBuy = reduceFilter(initialFilter(), { type: 'setBuy', buy: 100 });
  const cleared = reduceFilter(withBuy, { type: 'setBuy', buy: null });
  assert.deepEqual(cleared.price, { kind: 'any' });
});

test('setSell of null leaves price any', () => {
  const withSell = reduceFilter(initialFilter(), { type: 'setSell', sell: 40 });
  const cleared = reduceFilter(withSell, { type: 'setSell', sell: null });
  assert.deepEqual(cleared.price, { kind: 'any' });
});

test('toggleIdentified adds then removes an item id without mutating the previous set', () => {
  const once = toggleIdentified(new Set(), '草:混乱草');
  assert.equal(once.has('草:混乱草'), true);
  const twice = toggleIdentified(once, '草:混乱草');
  assert.equal(twice.has('草:混乱草'), false);
  assert.equal(once.has('草:混乱草'), true);
  const other = toggleIdentified(once, '草:毒草');
  assert.equal(other.has('草:混乱草'), true);
  assert.equal(other.has('草:毒草'), true);
});

test('priceChips clears the queried side', () => {
  const filter = fixedFilter('草', {
    includedStatusIds: new Set(['normal']),
    price: { kind: 'buy', value: 100 },
  });
  const buys = priceChips(catalog, filter, 'buy');
  assert.ok(buys.includes(100));
  assert.ok(buys.includes(40));
});

test('priceChips sell list ignores active buy', () => {
  const withBuy = fixedFilter('草', {
    includedStatusIds: new Set(['normal']),
    price: { kind: 'buy', value: 100 },
  });
  const any = fixedFilter('草', {
    includedStatusIds: new Set(['normal']),
    price: { kind: 'any' },
  });
  assert.deepEqual(priceChips(catalog, withBuy, 'sell'), priceChips(catalog, any, 'sell'));
});
