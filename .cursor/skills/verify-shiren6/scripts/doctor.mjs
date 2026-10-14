function arg(name) {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? '' : process.argv[index + 1];
  if (!value) {
    console.error(`missing ${name}`);
    process.exit(1);
  }
  return value;
}

const base = arg('--url').replace(/\/$/, '');
const token = arg('--token');

function fail(message) {
  console.error(message);
  process.exit(1);
}

const page = await fetch(`${base}/`);
const html = await page.text();
if (page.status !== 200) fail(`GET / status ${page.status}`);
if (page.headers.get('x-shiren6-verify') !== token) {
  fail('X-Shiren6-Verify does not match this run. Refusing to drive a server this run did not start.');
}
const documentTitle = '風来のシレン6 道具識別｜買値・売値';
if (!html.includes(`<title>${documentTitle}</title>`)) {
  fail(`page title is not ${documentTitle}`);
}

const catalogRes = await fetch(`${base}/data/shiren6_prices.json`);
if (catalogRes.status !== 200) fail(`GET catalog status ${catalogRes.status}`);
if (catalogRes.headers.get('x-shiren6-verify') !== token) {
  fail('catalog response is not from this run');
}
const catalog = await catalogRes.json();
if (catalog.title !== 'シレン6 値段一覧表') fail(`unexpected catalog title ${catalog.title}`);
for (const key of ['草', '巻物', '腕輪', '壺', '杖']) {
  if (!(key in catalog)) fail(`catalog missing ${key}`);
}

console.log(`OK ${base}/`);
