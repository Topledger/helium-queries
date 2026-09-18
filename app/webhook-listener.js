/**
 * GitHub webhook: git pull this repo on push to main (standalone deploy).
 * For State of Solana, use repo-root helium-queries-webhook-listener.js instead.
 */
const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.HELIUM_WEBHOOK_PORT || 9001);
const REPO_DIR = path.resolve(__dirname, '..');
const SYNC_LOG = process.env.HELIUM_SYNC_LOG || '/tmp/helium-queries-self-sync.log';
const TARGET_REPO = (process.env.HELIUM_QUERIES_GITHUB_REPO || 'Topledger/helium-queries').toLowerCase();
const BRANCH = process.env.HELIUM_QUERIES_BRANCH || 'main';

const envFile = path.join(REPO_DIR, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eq = trimmed.indexOf('=');
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

const WEBHOOK_SECRET =
  process.env.HELIUM_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || 'your-webhook-secret-here';

function verifySignature(payload, signature) {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

function runPull() {
  const cmd = `cd ${JSON.stringify(REPO_DIR)} && git fetch origin ${BRANCH} && git reset --hard origin/${BRANCH} && npm install --omit=dev 2>&1 | tee -a ${JSON.stringify(SYNC_LOG)}`;
  console.log('\n🚀 Helium-queries self sync started');
  exec(cmd, { maxBuffer: 20 * 1024 * 1024, env: process.env }, (error, stdout, stderr) => {
    if (error) console.error('❌ Sync error:', error.message);
    if (stderr) console.error(stderr);
    if (stdout) console.log(stdout);
    console.log('✅ Helium-queries self sync finished\n');
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, repo: TARGET_REPO }));
    return;
  }

  if (req.method !== 'POST' || req.url !== '/helium-queries-webhook') {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const signature = req.headers['x-hub-signature-256'];
      if (WEBHOOK_SECRET !== 'your-webhook-secret-here') {
        if (!verifySignature(body, signature)) {
          res.writeHead(401);
          res.end('Unauthorized');
          return;
        }
      }

      const payload = JSON.parse(body);
      const event = req.headers['x-github-event'];
      const repoName = (payload.repository?.full_name || '').toLowerCase();

      if (repoName !== TARGET_REPO) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ignored' }));
        return;
      }

      if (event === 'push' && payload.ref === `refs/heads/${BRANCH}`) {
        runPull();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', message: 'Pull started' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ignored' }));
    } catch (err) {
      console.error(err);
      res.writeHead(500);
      res.end('Error');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Helium-queries webhook on :${PORT} → ${REPO_DIR}`);
});
