// Local preview of the static site in docs/. Zero dependencies.
// Run: node scripts/build.mjs && node server.js   then open http://localhost:4000
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'docs');
const PORT = Number(process.env.PORT) || 4000;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.json': 'application/json; charset=utf-8',
};

http.createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const full = path.resolve(DOCS, p === '/' ? 'index.html' : '.' + p);
    if (!full.startsWith(DOCS + path.sep)) { res.writeHead(403); return res.end('forbidden'); }
    const body = await readFile(full);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Preview: http://localhost:${PORT}`));
