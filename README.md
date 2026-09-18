# Helium Queries

Helium Oracle SQL definitions plus a **standalone catalog + JSON API** sub-app. Used on [State of Solana](https://github.com/Topledger/state_of_solana) under `queries/` and publishable on its own.

## Layout

| Path | Purpose |
|------|---------|
| `sql/delegation/`, `sql/iot/`, `sql/mobile/`, … | SQL query groups |
| `app/catalog/` | HTML API catalog generator |
| `app/lib/` | Query param parsing + execution |
| `app/server.js` | Standalone HTTP server |
| `pipeline/` | Python runner (`run_helium_query.py`) |

## Run standalone

```bash
cp .env.example .env
npm install
npm start
```

- Catalog: `http://localhost:8138/helium-apis`
- API: `GET/POST /api/helium/{group}/{query_name}`

Query execution needs Trino (same stack as State of Solana `pipeline/`) or set `HELIUM_QUERY_PROXY_ORIGIN` to a host that already runs the API.

## Build static catalog

```bash
npm run catalog:build
```

Writes `index.html` at repo root. When `HELIUM_MONOREPO_ROOT` is set, also updates that app’s `public/helium-apis/` and `public/queries/`.

## Embed in State of Solana

The monorepo syncs this repo into `queries/`:

```bash
./scripts/sync-helium-queries-from-github.sh
```

Next.js serves `/helium-apis` and `/api/helium/*` using files under `queries/app/` and `queries/pipeline/`.

## GitHub webhook

- **Standalone:** `npm run webhook` (pulls this repo on push).
- **State of Solana server:** use `helium-queries-webhook-listener.js` at the monorepo root (rsync into `queries/`).
