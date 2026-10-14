import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) return fallback;
  return process.argv[index + 1];
}

const port = Number(arg('--port', process.env.SHIREN6_VERIFY_PORT || '4173'));
const token = arg('--token', randomBytes(8).toString('hex'));
const root = process.cwd();

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('invalid --port');
  process.exit(1);
}

function safePath(urlPath) {
  let rel = decodeURIComponent((urlPath || '/').split('?')[0]);
  if (rel === '/') rel = '/index.html';
  if (rel.endsWith('/')) rel += 'index.html';
  const full = normalize(join(root, rel));
  const rootPrefix = root.endsWith(sep) ? root : root + sep;
  if (full !== root && !full.startsWith(rootPrefix)) return null;
  return full;
}

const server = createServer(async (req, res) => {
  res.setHeader('X-Shiren6-Verify', token);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end();
    return;
  }
  const file = safePath(req.url);
  if (!file) {
    res.writeHead(400);
    res.end();
    return;
  }
  try {
    const body = await readFile(file);
    const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (err) {
    res.writeHead(err && err.code === 'ENOENT' ? 404 : 500);
    res.end();
  }
});

server.on('error', (err) => {
  console.error(err.code === 'EADDRINUSE' ? `port ${port} is in use` : err.message);
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`READY http://127.0.0.1:${port}/ pid=${process.pid} token=${token}`);
});
