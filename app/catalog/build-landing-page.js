/** Atlas-style welcome page for / and /helium-apis */
const { collectEndpoints, groupLabel, esc } = require('./generate-queries-index.js');

const GROUP_BLURBS = {
  hotspot:
    'Gateway issuance, identity lookup, maker growth, and IoT vs Mobile network mix.',
  iot:
    'IoT rewards, packet activity, gateway data, and top gateways by packets or payload.',
  mobile:
    'Mobile rewards, data sessions, heartbeat coverage, speedtests, and network rankings.',
  oui:
    'Daily packet and payload activity, DC usage, and top gateways for one OUI.',
  delegation:
    'Active stake, wallet positions, vote proxies, and open delegation positions.',
};

/** Lucide-style strokes (24×24) */
const GROUP_ICONS = {
  hotspot:
    '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
  iot:
    '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M20 15h2"/>',
  mobile:
    '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/>',
  oui:
    '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  delegation:
    '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
};

function buildHeroSlatsSvg() {
  const rowH = 10;
  const rows = 56;
  const width = 1440;
  let shapes = '';
  for (let r = 0; r < rows; r += 1) {
    const y = r * rowH;
    let x = -60 + (r % 4) * 36;
    let i = 0;
    while (x < width + 80) {
      const w = 72 + ((r * 31 + i * 47) % 96);
      const tone = (r + i) % 3;
      const fill = tone === 0 ? '#161618' : tone === 1 ? '#121214' : '#0e0e10';
      shapes += `<rect x="${x.toFixed(1)}" y="${y}" width="${w}" height="${rowH - 2}" rx="0.5" fill="${fill}"/>`;
      shapes += `<rect x="${x.toFixed(1)}" y="${y}" width="${w}" height="1" fill="#fff" opacity="0.032"/>`;
      x += w + 6 + ((r + i) % 4) * 5;
      i += 1;
    }
  }
  return `<svg class="landing-hero-slats" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${rows * rowH}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${shapes}</svg>`;
}

function firstApiPath(group) {
  const api = group.apis[0];
  if (!api) return '/helium-apis';
  const raw = String(api.id || '');
  const dash = raw.indexOf('-');
  if (dash < 0) return '/helium-apis';
  const g = raw.slice(0, dash);
  const name = raw.slice(dash + 1);
  return `/helium-apis/${encodeURIComponent(g)}/${encodeURIComponent(name)}`;
}

function buildHeliumApisLandingHtml(options = {}) {
  const { groups } = collectEndpoints(options.baseUrl);
  const exploreHref = '/helium-apis/hotspot/hotspot_by_maker';

  const gridCards = groups.map((g) => ({
    title: groupLabel(g.id),
    blurb: GROUP_BLURBS[g.id] || `Explore ${g.apis.length} ${groupLabel(g.id)} endpoints.`,
    href: firstApiPath(g),
    icon: GROUP_ICONS[g.id] || GROUP_ICONS.hotspot,
  }));

  const cardsHtml = gridCards
    .map(
      (card) => `
    <a class="landing-card" href="${esc(card.href)}">
      <span class="landing-card-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${card.icon}</svg>
      </span>
      <h2 class="landing-card-title">${esc(card.title)}</h2>
      <p class="landing-card-blurb">${esc(card.blurb)}</p>
    </a>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Helium APIs · Top Ledger Research</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #050506;
      --surface: #101012;
      --surface-2: #161618;
      --border: #242428;
      --text: #f4f4f5;
      --text-secondary: #a1a1aa;
      --text-muted: #71717a;
      --accent: #2dd4bf;
      --accent-dim: rgba(45, 212, 191, 0.14);
      --surface-inset: #121214;
      --green: #86efac;
      --purple-bright: #c4b5fd;
      --font: "Inter", system-ui, sans-serif;
      --mono: "JetBrains Mono", monospace;
      --header-h: 56px;
      --max-w: 1120px;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; text-decoration: none; }

    .landing-header {
      position: sticky; top: 0; z-index: 50;
      height: var(--header-h);
      display: flex; align-items: center;
      padding: 0 24px;
      border-bottom: 1px solid var(--border);
      background: rgba(5, 5, 6, 0.92);
      backdrop-filter: blur(10px);
    }
    .landing-logo {
      display: flex; align-items: center;
      color: var(--text);
    }
    .landing-logo img {
      height: 26px; width: auto; max-width: min(220px, 42vw); display: block;
      filter: brightness(0) invert(1);
    }

    .landing-hero {
      position: relative;
      padding: 72px 24px 56px;
      overflow: hidden;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
    }
    .landing-hero-bg {
      pointer-events: none;
      position: absolute; inset: 0;
      overflow: hidden;
    }
    .landing-hero-slats {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      filter: brightness(0.9);
    }
    .landing-hero-bg-fade {
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse 100% 70% at 50% 0%, rgba(255, 255, 255, 0.02) 0%, transparent 45%),
        linear-gradient(180deg, transparent 0%, transparent 82%, rgba(5, 5, 6, 0.68) 100%);
    }
    .landing-hero-bg-scrim {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 70% 65% at 50% 48%, rgba(5, 5, 6, 0.38) 0%, transparent 72%);
    }
    .landing-hero-inner {
      position: relative; z-index: 1;
      max-width: var(--max-w); margin: 0 auto; text-align: center;
    }
    .landing-hero h1 {
      margin: 0 0 16px;
      font-size: clamp(2rem, 5vw, 3.25rem);
      font-weight: 300;
      letter-spacing: -0.03em;
      line-height: 1.15;
    }
    .landing-hero-lead {
      margin: 0 auto 24px;
      max-width: 520px;
      font-size: 1rem;
      line-height: 1.55;
      color: var(--text-secondary);
    }
    .landing-path-wrap {
      display: flex;
      justify-content: center;
      margin: 0 0 20px;
    }
    .landing-path {
      display: inline-flex; align-items: center; justify-content: center; gap: 10px;
      max-width: calc(100% - 32px);
      padding: 10px 14px;
      font-family: var(--mono);
      font-size: 0.78rem;
      background: var(--surface-inset);
      border: 1px solid var(--border);
    }
    .landing-path-method {
      flex-shrink: 0;
      color: var(--green);
      line-height: 1.5;
    }
    .landing-path-value {
      margin: 0;
      color: var(--purple-bright);
      line-height: 1.5;
      white-space: nowrap;
    }
    .landing-cta {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      min-width: 120px;
      padding: 12px 20px;
      border-radius: 0;
      background: var(--accent);
      color: #042f2e;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      transition: filter 0.15s;
    }
    .landing-cta:hover { filter: brightness(1.06); }
    .landing-cta svg { width: 16px; height: 16px; }

    .landing-main {
      max-width: var(--max-w);
      margin: 0 auto;
      padding: 40px 24px 64px;
    }
    .landing-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      max-width: 960px;
      margin: 0 auto;
      border-left: 1px solid var(--border);
      border-top: 1px solid var(--border);
    }
    .landing-card {
      display: flex; flex-direction: column; gap: 10px;
      min-height: 168px;
      padding: 22px 20px 24px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
    }
    .landing-card:hover { background: var(--surface-2); }
    .landing-card-icon {
      display: flex; width: 22px; height: 22px; color: var(--text-muted);
    }
    .landing-card:hover .landing-card-icon { color: var(--text-secondary); }
    .landing-card-icon svg { width: 100%; height: 100%; }
    .landing-card-title {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .landing-card-blurb {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
      color: var(--text-secondary);
    }
    .landing-footer {
      max-width: var(--max-w);
      margin: 0 auto;
      padding: 0 24px 32px;
      font-size: 0.78rem;
      color: var(--text-muted);
      text-align: center;
    }

    @media (max-width: 900px) {
      .landing-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      .landing-header { padding: 0 16px; }
      .landing-grid { grid-template-columns: 1fr; }
      .landing-hero { padding: 56px 16px 40px; }
      .landing-main { padding: 24px 16px 48px; }
      .landing-path-value { white-space: normal; word-break: break-all; }
    }
  </style>
</head>
<body>
  <header class="landing-header">
    <a class="landing-logo" href="/helium-apis" title="Helium APIs home">
      <img src="https://topledger.xyz/assets/images/logo/topledger-full.svg?imwidth=384" alt="Top Ledger Research" width="160" height="26" />
    </a>
  </header>

  <section class="landing-hero">
    <div class="landing-hero-bg" aria-hidden="true">
      ${buildHeroSlatsSvg()}
      <div class="landing-hero-bg-fade"></div>
      <div class="landing-hero-bg-scrim"></div>
    </div>
    <div class="landing-hero-inner">
      <h1>Helium APIs</h1>
      <p class="landing-hero-lead">
        Gateway, IoT, Mobile, OUI, and delegation data from Top Ledger.
      </p>
      <div class="landing-path-wrap">
        <div class="landing-path" aria-label="API base path">
          <span class="landing-path-method">GET</span>
          <code class="landing-path-value">/api/helium/{group}/{query}</code>
        </div>
      </div>
      <a class="landing-cta" href="${esc(exploreHref)}">
        Explore
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
      </a>
    </div>
  </section>

  <main class="landing-main">
    <div class="landing-grid" id="landing-grid">
${cardsHtml}
    </div>
  </main>

  <footer class="landing-footer">
    © ${new Date().getFullYear()} Top Ledger. All rights reserved.
  </footer>
</body>
</html>`;
}

module.exports = { buildHeliumApisLandingHtml };
