#!/usr/bin/env python3
"""Run a Helium Oracle SQL file against Trino (stdout: JSON)."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def _monorepo_root() -> Path:
    env = (
        os.getenv("HELIUM_ORACLE_ROOT", "").strip()
        or os.getenv("HELIUM_MONOREPO_ROOT", "").strip()
    )
    if env:
        return Path(env).resolve()
    parent = REPO_ROOT.parent
    if (parent / "pipeline" / "query_router.py").is_file():
        return parent
    return REPO_ROOT


def load_env_file(env_file: Path) -> None:
    if not env_file.is_file():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


load_env_file(REPO_ROOT / ".env")

ROOT = _monorepo_root()
sys.path.insert(0, str(ROOT / "pipeline"))
sys.path.insert(0, str(REPO_ROOT / "pipeline"))
sys.path.insert(0, "/root/tl-reserach-tool-sqls")

if ROOT != REPO_ROOT:
    load_env_file(ROOT / ".env")

from helium_query_bind import bind_sql  # noqa: E402

try:
    from query_router import QueryRouter, is_tl_api_query  # noqa: E402
    from tl_api_client import TlApiClient  # noqa: E402
    from trino_client import TrinoClient  # noqa: E402
except ModuleNotFoundError as exc:
    if exc.name not in {"query_router", "tl_api_client", "trino_client"}:
        raise
    QueryRouter = None
    TlApiClient = None
    TrinoClient = None
    sys.path.insert(0, str(ROOT))
    from core.sql_base import SqlBase  # noqa: E402


def helium_trino_client():
    if TrinoClient is None:
        raise RuntimeError("Shared Trino client is unavailable")
    catalog = os.getenv("TRINO_HELIUM_CATALOG", "hive")
    schema = os.getenv(
        "TRINO_HELIUM_SCHEMA",
        os.getenv("TRINO_SCHEMA", "helium"),
    )
    return TrinoClient(catalog=catalog, schema=schema)


def execute_query(sql: str):
    if QueryRouter is not None:
        router = QueryRouter(helium_trino_client(), TlApiClient())
        if is_tl_api_query(sql):
            router.tl_api.connect()
        else:
            router.trino.connect()
        try:
            return router.query(sql)
        finally:
            router.close()

    client = SqlBase()
    try:
        return client.execute_raw_sql(sql)
    finally:
        connection = getattr(client, "_connection", None)
        if connection is not None:
            connection.close()


def load_sql(group: str, name: str) -> str:
    path = REPO_ROOT / "sql" / group / f"{name}.sql"
    if not path.is_file():
        raise FileNotFoundError(f"Query not found: {group}/{name}")
    return path.read_text(encoding="utf-8")


def df_to_records(df):
    if df is None or df.empty:
        return []
    return json.loads(df.to_json(orient="records", date_format="iso"))


def main() -> int:
    if len(sys.argv) < 3:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": "Usage: run_helium_query.py <group> <query_name> [params_json]",
                }
            )
        )
        return 1

    group = sys.argv[1]
    name = sys.argv[2]
    params = {}
    if len(sys.argv) > 3 and sys.argv[3].strip():
        params = json.loads(sys.argv[3])

    try:
        template = load_sql(group, name)
        sql = bind_sql(template, params)
        df = execute_query(sql)
        rows = df_to_records(df)
        print(
            json.dumps(
                {
                    "success": True,
                    "count": len(rows),
                    "rows": rows,
                },
                default=str,
            )
        )
        return 0
    except Exception as exc:
        print(json.dumps({"success": False, "error": str(exc)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
