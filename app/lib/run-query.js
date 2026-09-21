const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execFileAsync = promisify(execFile);

const REPO_ROOT = path.resolve(__dirname, '../..');

function sanitizeQueryError(error) {
  const raw = String(error?.message || error || 'Query execution failed');

  if (
    /PAGE_TRANSPORT_ERROR/i.test(raw) ||
    /server is still initializing/i.test(raw) ||
    /expected response code to be 200, but was 503/i.test(raw)
  ) {
    return 'Query service is temporarily unavailable. Please try again shortly.';
  }

  if (/timed out|ETIMEDOUT|AbortError/i.test(raw)) {
    return 'Query timed out. Try a smaller date range or try again shortly.';
  }

  const trinoMessage = raw.match(/\bmessage="([^"]+)"/i)?.[1];
  const concise = (trinoMessage || raw)
    .split(/\s*\[SQL:/i)[0]
    .split(/\s*\(Background on this error/i)[0]
    .replace(/\s+/g, ' ')
    .trim();

  if (!concise) return 'Query execution failed. Please try again.';
  return concise.length > 240 ? `${concise.slice(0, 237)}...` : concise;
}

function normalizeResult(data) {
  if (!data || typeof data !== 'object') return data;
  delete data.query;
  if (data.success === false && data.error) {
    data.error = sanitizeQueryError(data.error);
  }
  return data;
}

function monorepoRoot() {
  const env = process.env.HELIUM_MONOREPO_ROOT?.trim();
  if (env) return path.resolve(env);
  const parent = path.dirname(REPO_ROOT);
  if (fs.existsSync(path.join(parent, 'pipeline', 'query_router.py'))) {
    return parent;
  }
  return REPO_ROOT;
}

function proxyOrigin() {
  const raw =
    process.env.HELIUM_QUERY_PROXY_ORIGIN?.trim() ||
    process.env.HELIUM_SELF_HOSTED_ORIGIN?.trim();
  return raw ? raw.replace(/\/$/, '') : undefined;
}

async function runHeliumQueryViaProxy(origin, group, name, params, signal) {
  const url = new URL(
    `${origin}/api/helium/${encodeURIComponent(group)}/${encodeURIComponent(name)}`
  );
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  const timeoutSignal = AbortSignal.timeout(180_000);
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
    cache: 'no-store',
  });

  const bodyText = await res.text();
  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    return {
      success: false,
      error: `Proxy ${origin} returned HTTP ${res.status} (not JSON).`,
    };
  }
  return normalizeResult(data);
}

async function runHeliumQuery(group, name, params = {}, options = {}) {
  const { signal } = options;
  const proxy = proxyOrigin();
  if (proxy) {
    return runHeliumQueryViaProxy(proxy, group, name, params, signal);
  }

  const cwd = monorepoRoot();
  const script = path.join(REPO_ROOT, 'pipeline', 'run_helium_query.py');

  try {
    const { stdout } = await execFileAsync(
      'python3',
      [script, group, name, JSON.stringify(params)],
      {
        cwd,
        maxBuffer: 50 * 1024 * 1024,
        timeout: 180_000,
        signal,
        env: {
          ...process.env,
          HELIUM_MONOREPO_ROOT: cwd,
        },
      }
    );
    return normalizeResult(JSON.parse(stdout));
  } catch (err) {
    if (err.stdout?.trim()) {
      try {
        return normalizeResult(JSON.parse(err.stdout));
      } catch {
        /* fall through */
      }
    }
    if (err.code === 'ENOENT') {
      return {
        success: false,
        error: 'python3 not found. Set HELIUM_QUERY_PROXY_ORIGIN to a host that runs queries.',
      };
    }
    throw err;
  }
}

module.exports = { runHeliumQuery, sanitizeQueryError };
