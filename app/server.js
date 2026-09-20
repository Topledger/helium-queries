#!/usr/bin/env node
/**
 * Standalone Helium APIs: catalog at /helium-apis, JSON API at /api/helium/:group/:name
 */
const http = require('http');
const path = require('path');
const { URL } = require('url');

const REPO_ROOT = path.resolve(__dirname, '..');
process.chdir(REPO_ROOT);

require('dotenv').config({ path: path.join(REPO_ROOT, '.env') });

const { buildHeliumApisCatalogHtml } = require('./catalog/generate-queries-index.js');
const { paramsFromRequest } = require('./lib/params-from-request.js');
const { runHeliumQuery } = require('./lib/run-query.js');

const PORT = Number(process.env.HELIUM_APIS_PORT || process.env.PORT || 8138);

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 2 * 1024 * 1024) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function parseRequest(req, url) {
  const out = { query: {}, body: null };
  url.searchParams.forEach((value, key) => {
    out.query[key] = value;
  });
  if (req.method === 'POST') {
    const raw = await readBody(req);
    if (raw.trim()) {
      try {
        out.body = JSON.parse(raw);
      } catch {
        out.body = null;
      }
    }
  }
  return out;
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  } catch {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { ok: true, service: 'helium-queries' });
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/helium-apis' || url.pathname === '/')) {
    try {
      const origin = `${url.protocol}//${url.host}`;
      const html = buildHeliumApisCatalogHtml({ baseUrl: origin });
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      });
      res.end(html);
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(err.message || 'Catalog build failed');
      return;
    }
  }

  const apiMatch = url.pathname.match(/^\/api\/helium\/([^/]+)\/([^/]+)\/?$/);
  if (apiMatch && (req.method === 'GET' || req.method === 'POST')) {
    const group = decodeURIComponent(apiMatch[1]);
    const name = decodeURIComponent(apiMatch[2]);
    try {
      const parsed = await parseRequest(req, url);
      req.query = parsed.query;
      req.body = parsed.body;
      const params = await paramsFromRequest(req);
      const result = await runHeliumQuery(group, name, params);
      const status = result.success
        ? 200
        : result.error?.includes('not found')
          ? 404
          : 500;
      sendJson(res, status, result);
    } catch (err) {
      sendJson(res, 500, {
        success: false,
        error: err.message || 'Query execution failed',
      });
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Helium APIs listening on http://0.0.0.0:${PORT}/helium-apis`);
});
