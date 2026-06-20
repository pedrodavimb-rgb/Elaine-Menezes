/* ═══════════════════════════════════════════════════════
   DRA. ELAINE MENEZES — Servidor estático
   Zero dependências: usa apenas módulos nativos do Node.js
   ═══════════════════════════════════════════════════════ */

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.svg']);

const server = http.createServer((req, res) => {
  // Decode + sanitize the URL path to prevent directory traversal
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch {
    urlPath = '/';
  }

  // Resolve requested file inside PUBLIC_DIR
  let filePath = path.join(PUBLIC_DIR, urlPath);

  // Block path traversal outside PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    // If not found or is a directory → serve index.html (SPA fallback)
    if (err || stats.isDirectory()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end('<h1>404 — Página não encontrada</h1>');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME[ext] || 'application/octet-stream';

      const headers = {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      };

      // Cache static assets but allow revalidation (no "immutable", so
      // overwritten images are picked up on reload instead of being stuck).
      headers['Cache-Control'] = ext === '.html'
        ? 'no-cache'
        : 'public, max-age=3600, must-revalidate';

      // gzip text-based assets when the client supports it
      const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
      if (acceptsGzip && COMPRESSIBLE.has(ext)) {
        zlib.gzip(data, (gzErr, compressed) => {
          if (gzErr) {
            res.writeHead(200, headers);
            return res.end(data);
          }
          headers['Content-Encoding'] = 'gzip';
          res.writeHead(200, headers);
          res.end(compressed);
        });
      } else {
        res.writeHead(200, headers);
        res.end(data);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n  ✦ Dra. Elaine Menezes — Site rodando`);
  console.log(`  ✦ Acesse: http://localhost:${PORT}\n`);
});
