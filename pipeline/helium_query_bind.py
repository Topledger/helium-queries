"""Bind HTTP/API parameters into Helium Oracle SQL templates."""

from __future__ import annotations

import re
import time
from datetime import date, timedelta
from typing import Any

_PLACEHOLDER_RE = re.compile(r"\{([a-z_]+)\}")


def _escape(value: str) -> str:
    return value.replace("'", "''")


def _sub_dao_mint(network: str) -> str | None:
    n = network.strip().lower()
    if n in ("mobile", "mob"):
        return "Gm9xDCJawDEKDrrQW6haw94gABaYzQwCq4ZQU8h8bd22"
    if n in ("iot",):
        return "39Lw1RH6zt8AJvKn3BTxmUDofzduCM2J3kSaGDZ8L7Sk"
    return None


def default_params(raw: dict[str, Any] | None) -> dict[str, Any]:
    raw = dict(raw or {})
    today = date.today()
    week_ago = today - timedelta(days=7)
    out: dict[str, Any] = {
        "start_date": str(raw.get("start_date") or week_ago.isoformat()),
        "end_date": str(raw.get("end_date") or today.isoformat()),
        "entity_key": str(raw.get("entity_key") or ""),
        "address": str(raw.get("address") or ""),
        "bucket": str(raw.get("bucket") or "day"),
        "offset": int(raw.get("offset") or 0),
        "limit": int(raw.get("limit") or 100),
        "oui_id": str(raw.get("oui_id") or raw.get("oui") or ""),
        "cbsd_id": str(raw.get("cbsd_id") or ""),
        "min_date": str(raw.get("min_date") or "2024-01-01"),
        "wallet": str(raw.get("wallet") or ""),
        "role": str(raw.get("role") or "owner").lower(),
        "nft_mint": str(raw.get("nft_mint") or ""),
        "sub_dao": str(raw.get("sub_dao") or ""),
        "network": str(raw.get("network") or ""),
        "authority": str(raw.get("authority") or raw.get("position_authority") or ""),
        "status": str(raw.get("status") or ""),
        "maker": str(raw.get("maker") or ""),
        "asset_id": str(raw.get("asset_id") or ""),
        "key_to_asset_key": str(raw.get("key_to_asset_key") or ""),
        "packet_type": str(raw.get("packet_type") or raw.get("type") or ""),
        "free": raw.get("free"),
    }
    out["now_ts"] = int(raw.get("now_ts") or time.time())
    return out


def _lookup_filter(p: dict[str, Any]) -> str:
    parts: list[str] = []
    if p["address"]:
        parts.append(f"AND hk.hotspot_key = '{_escape(p['address'])}'")
    if p["entity_key"]:
        parts.append(f"AND hk.entity_key = '{_escape(p['entity_key'])}'")
    if p["asset_id"]:
        parts.append(f"AND hk.asset_id = '{_escape(p['asset_id'])}'")
    if p["key_to_asset_key"]:
        parts.append(f"AND hk.key_to_asset_key = '{_escape(p['key_to_asset_key'])}'")
    return "\n  ".join(parts)


def _nft_mint_filter(template: str, p: dict[str, Any]) -> str:
    if not p["nft_mint"]:
        return ""
    mint = _escape(p["nft_mint"])
    if "helium.assign_proxy" in template:
        return f"AND a.asset = '{mint}'"
    return f"AND nft_mint = '{mint}'"


def _hotspot_filter(alias: str, p: dict[str, Any]) -> str:
    if not p["address"]:
        return ""
    return f"AND {alias} = '{_escape(p['address'])}'"


def _subdao_filter(template: str, p: dict[str, Any]) -> str:
    sub_mint = p["sub_dao"] or (_sub_dao_mint(p["network"]) if p["network"] else "")
    lines: list[str] = []
    if sub_mint:
        if re.search(r"\bsubdao\b", template, re.IGNORECASE):
            lines.append(f"AND subdao = '{_escape(sub_mint)}'")
        if re.search(r"\bsub_dao\b", template):
            lines.append(f"AND sub_dao = '{_escape(sub_mint)}'")
        if re.search(r"\bs\.sub_dao\b", template):
            lines.append(f"AND s.sub_dao = '{_escape(sub_mint)}'")
    if p["network"] and "b.network" in template:
        lines.append(f"AND b.network = '{_escape(p['network'])}'")
    return "\n  ".join(dict.fromkeys(lines))


def _fragments(template: str, p: dict[str, Any]) -> dict[str, str]:
    subdao_filter = _subdao_filter(template, p)

    wallet_match = ""
    if p["wallet"]:
        if p["role"] == "proxy":
            wallet_match = f"AND p.recipient = '{_escape(p['wallet'])}'"
        else:
            wallet_match = f"AND p.payer = '{_escape(p['wallet'])}'"

    type_filter = ""
    if p["packet_type"]:
        type_filter = f"AND p.type = '{_escape(p['packet_type'])}'"

    free_filter = ""
    if p["free"] is not None and str(p["free"]).strip() != "":
        free_val = str(p["free"]).lower() in ("1", "true", "yes")
        free_filter = f"AND p.free = {str(free_val).upper()}"

    return {
        "lookup_filter": _lookup_filter(p),
        "hotspot_filter": _hotspot_filter("r.gatewayreward.hotspotkey", p),
        "hotspot_filter_radio": _hotspot_filter("radioreward.hotspotkey", p),
        "hotspot_filter_gateway": _hotspot_filter("gatewayreward.hotspotkey", p),
        "address_filter": (
            f"AND hk.hotspot_key = '{_escape(p['address'])}'" if p["address"] else ""
        ),
        "entity_key_filter": (
            f"AND hk.entity_key = '{_escape(p['entity_key'])}'" if p["entity_key"] else ""
        ),
        "asset_id_filter": (
            f"AND hk.asset_id = '{_escape(p['asset_id'])}'" if p["asset_id"] else ""
        ),
        "key_to_asset_filter": (
            f"AND hk.key_to_asset_key = '{_escape(p['key_to_asset_key'])}'"
            if p["key_to_asset_key"]
            else ""
        ),
        "wallet_filter": (
            f"AND w.wallet = '{_escape(p['wallet'])}'" if p["wallet"] else ""
        ),
        "wallet_match": wallet_match,
        "authority_filter": (
            f"AND positionauthority = '{_escape(p['authority'])}'" if p["authority"] else ""
        ),
        "nft_mint_filter": _nft_mint_filter(template, p),
        "subdao_filter": subdao_filter,
        "status_filter": (
            f"AND (CASE WHEN s.hnt_amount IS NOT NULL THEN 'delegated' ELSE 'undelegated' END) = '{_escape(p['status'])}'"
            if p["status"]
            else ""
        ),
        "maker_filter": (
            f"AND b.maker = '{_escape(p['maker'])}'" if p["maker"] else ""
        ),
        "type_filter": type_filter,
        "free_filter": free_filter,
    }


def bind_sql(template: str, raw_params: dict[str, Any] | None = None) -> str:
    p = default_params(raw_params)
    frags = _fragments(template, p)

    sql = template
    for key, value in p.items():
        if key == "free":
            continue
        if isinstance(value, (int, float)):
            sql = sql.replace("{" + key + "}", str(value))
        else:
            sql = sql.replace("{" + key + "}", _escape(str(value)))

    for key, value in frags.items():
        sql = sql.replace("{" + key + "}", value)

    # Leave unknown placeholders empty (comment-only fragments)
    sql = _PLACEHOLDER_RE.sub("", sql)
    return sql
