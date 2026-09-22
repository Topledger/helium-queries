/**
 * HTML handlers for /helium-apis (landing) and /helium-apis/:group/:name (catalog).
 * Synced with helium-queries; used by State of Solana Next.js routes and standalone server.
 */
const { buildHeliumApisCatalogHtml } = require('./catalog/generate-queries-index.js');
const { buildHeliumApisLandingHtml } = require('./catalog/build-landing-page.js');

const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store, must-revalidate',
};

function heliumProxyOrigin() {
  const raw =
    (process.env.HELIUM_QUERY_PROXY_ORIGIN || '').trim() ||
    (process.env.HELIUM_SELF_HOSTED_ORIGIN || '').trim();
  return raw ? raw.replace(/\/$/, '') : undefined;
}

function patchCatalogHtmlBase(html, pageOrigin) {
  return html.replace(
    /const BASE = window\.location\.origin;/,
    `const BASE = ${JSON.stringify(pageOrigin)};`,
  );
}

async function fetchHtmlFromProxy(pathname, pageOrigin, patchBase) {
  const upstream = heliumProxyOrigin();
  if (!upstream) {
    return new Response('HELIUM_QUERY_PROXY_ORIGIN is not configured', { status: 503 });
  }
  const url = `${upstream}${pathname}`;
  const res = await fetch(url, {
    headers: { Accept: 'text/html' },
    cache: 'no-store',
    signal: AbortSignal.timeout(120_000),
  });
  const html = await res.text();
  if (!res.ok) {
    return new Response(html || `Upstream Helium page failed (${res.status})`, {
      status: res.status,
    });
  }
  const body = patchBase ? patchCatalogHtmlBase(html, pageOrigin) : html;
  return new Response(body, { status: 200, headers: HTML_HEADERS });
}

async function getHeliumLandingResponse(request) {
  const requestUrl = new URL(request.url);
  const pageOrigin = requestUrl.origin;

  if (process.env.VERCEL && heliumProxyOrigin()) {
    return fetchHtmlFromProxy('/helium-apis', pageOrigin, false);
  }

  try {
    const html = buildHeliumApisLandingHtml({ baseUrl: pageOrigin });
    return new Response(html, { status: 200, headers: HTML_HEADERS });
  } catch (err) {
    const upstream = heliumProxyOrigin();
    if (upstream) {
      try {
        return await fetchHtmlFromProxy('/helium-apis', pageOrigin, false);
      } catch (proxyErr) {
        console.error('Helium landing proxy failed:', proxyErr);
      }
    }
    const message = err instanceof Error ? err.message : 'Landing build failed';
    return new Response(message, { status: 500 });
  }
}

async function getHeliumCatalogPageResponse(request) {
  const requestUrl = new URL(request.url);
  const pageOrigin = requestUrl.origin;
  const catalogPath =
    requestUrl.pathname.length > 1
      ? requestUrl.pathname.replace(/\/+$/, '')
      : requestUrl.pathname;

  if (requestUrl.pathname !== catalogPath) {
    return Response.redirect(`${catalogPath}${requestUrl.search}`, 301);
  }

  if (process.env.VERCEL && heliumProxyOrigin()) {
    return fetchHtmlFromProxy(catalogPath, pageOrigin, true);
  }

  try {
    const html = patchCatalogHtmlBase(
      buildHeliumApisCatalogHtml({ baseUrl: pageOrigin }),
      pageOrigin,
    );
    return new Response(html, { status: 200, headers: HTML_HEADERS });
  } catch (err) {
    const upstream = heliumProxyOrigin();
    if (upstream) {
      try {
        return await fetchHtmlFromProxy(catalogPath, pageOrigin, true);
      } catch (proxyErr) {
        console.error('Helium catalog proxy failed:', proxyErr);
      }
    }
    const message = err instanceof Error ? err.message : 'Catalog build failed';
    return new Response(message, { status: 500 });
  }
}

module.exports = {
  getHeliumLandingResponse,
  getHeliumCatalogPageResponse,
  heliumProxyOrigin,
  patchCatalogHtmlBase,
};
