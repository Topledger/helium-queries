const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execFileAsync = promisify(execFile);

const REPO_ROOT = path.resolve(__dirname, '../..');

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

async function runHeliumQueryViaProxy(origin, group, name, params) {
  const url = new URL(
    `${origin}/api/helium/${encodeURIComponent(group)}/${encodeURIComponent(name)}`
  );
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(180_000),
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
  delete data.query;
  return data;
}

async function runHeliumQuery(group, name, params = {}) {
  const proxy = proxyOrigin();
  if (proxy) {
    return runHeliumQueryViaProxy(proxy, group, name, params);
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
        env: {
          ...process.env,
          HELIUM_MONOREPO_ROOT: cwd,
        },
      }
    );
    return JSON.parse(stdout);
  } catch (err) {
    if (err.stdout?.trim()) {
      try {
        return JSON.parse(err.stdout);
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

module.exports = { runHeliumQuery };
