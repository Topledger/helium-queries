"""Bind HTTP/API parameters into Helium Oracle SQL templates."""

from __future__ import annotations

import calendar
import re
import time
from datetime import date, datetime, timedelta
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


def _parse_date(value: Any, name: str) -> date:
    try:
        parsed = datetime.strptime(str(value), "%Y-%m-%d").date()
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must use YYYY-MM-DD") from exc
    if parsed > date.today():
        raise ValueError(f"{name} must not be in the future")
    return parsed


def _date_window(raw: dict[str, Any]) -> tuple[str, str]:
    raw_month = str(raw.get("month") or "").strip()
    raw_from = raw.get("from") or raw.get("start_date")
    raw_to = raw.get("to") or raw.get("end_date")

    if raw_month:
        if raw.get("from") or raw.get("to"):
            raise ValueError("Use either month or from/to, not both")
        try:
            parsed = datetime.strptime(raw_month, "%Y-%m").date()
        except ValueError as exc:
            raise ValueError("month must use YYYY-MM") from exc
        start = parsed.replace(day=1)
        end = parsed.replace(day=calendar.monthrange(parsed.year, parsed.month)[1])
        yesterday = date.today() - timedelta(days=1)
        end = min(end, yesterday)
        if start > end:
            raise ValueError("month is entirely in the future")
    elif raw_from or raw_to:
        if not raw_from or not raw_to:
            raise ValueError("Both from and to are required")
        start = _parse_date(raw_from, "from")
        end = _parse_date(raw_to, "to")
    else:
        yesterday = date.today() - timedelta(days=1)
        start = yesterday.replace(day=1)
        end = yesterday

    if end < start:
        raise ValueError("to must be on or after from")
    span = (end - start).days + 1
    if span > 30:
        if raw_month:
            end = start + timedelta(days=29)
        else:
            raise ValueError(f"Date range must be at most 30 days (got {span})")
    return start.isoformat(), end.isoformat()


def _bool_param(value: Any) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes"}


def default_params(raw: dict[str, Any] | None) -> dict[str, Any]:
    raw = dict(raw or {})
    start_date, end_date = _date_window(raw)
    out: dict[str, Any] = {
        "start_date": start_date,
        "end_date": end_date,
        "entity_key": str(raw.get("entity_key") or ""),
        "address": str(raw.get("address") or raw.get("hotspot_key") or ""),
        "bucket": str(raw.get("bucket") or "day"),
        "offset": int(raw.get("offset") or 0),
        "limit": int(raw.get("limit") or raw.get("per_page") or 100),
        "oui_id": str(raw.get("oui_id") or raw.get("oui") or ""),
        "cbsd_id": str(raw.get("cbsd_id") or ""),
        "min_date": str(raw.get("min_date") or "2024-01-01"),
        "wallet": str(raw.get("wallet") or ""),
        "role": str(raw.get("role") or "owner").lower(),
        "nft_mint": str(raw.get("nft_mint") or ""),
        "sub_dao": str(raw.get("sub_dao") or raw.get("subdao") or ""),
        "network": str(raw.get("network") or ""),
        "authority": str(raw.get("authority") or raw.get("position_authority") or ""),
        "status": str(raw.get("status") or ""),
        "maker": str(raw.get("maker") or ""),
        "asset_id": str(raw.get("asset_id") or ""),
        "key_to_asset_key": str(raw.get("key_to_asset_key") or ""),
        "packet_type": str(raw.get("packet_type") or raw.get("type") or ""),
        "free": raw.get("free"),
        "region": str(raw.get("region") or ""),
        "datarate": str(raw.get("datarate") or ""),
        "billing": str(raw.get("billing") or "").lower(),
        "include_operational": _bool_param(raw.get("include_operational")),
    }
    if out["offset"] < 0:
        raise ValueError("offset must be at least 0")
    if out["limit"] < 1 or out["limit"] > 100:
        raise ValueError("limit must be between 1 and 100")
    if out["role"] not in {"owner", "proxy"}:
        raise ValueError("role must be owner or proxy")
    if out["status"] and out["status"] not in {"delegated", "undelegated"}:
        raise ValueError("status must be delegated or undelegated")
    if out["packet_type"] and out["packet_type"].lower() not in {"join", "uplink"}:
        raise ValueError("type must be join or uplink")
    if out["billing"] not in {"", "paid", "free"}:
        raise ValueError("billing must be paid or free")
    out["now_ts"] = int(raw.get("now_ts") or time.time())
    return out


def _lookup_filter(p: dict[str, Any]) -> str:
    parts: list[str] = []
    if p["address"]:
        value = _escape(p["address"])
        parts.append(
            "AND ("
            f"hk.hotspot_key = '{value}' OR "
            f"hk.entity_key = '{value}' OR "
            f"hk.entity_key_b64 = '{value}' OR "
            f"hk.asset_id = '{value}' OR "
            f"hk.key_to_asset_key = '{value}'"
            ")"
        )
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
    if "FROM helium.sub_daos_delegated_positions d" in template:
        return f"AND d.mint = '{mint}'"
    if "FROM cte_base s" in template:
        return f"AND s.nft_mint = '{mint}'"
    return f"AND nft_mint = '{mint}'"


def _hotspot_filter(alias: str, p: dict[str, Any]) -> str:
    if not p["address"]:
        return ""
    return f"AND {alias} = '{_escape(p['address'])}'"


def _subdao_filter(template: str, p: dict[str, Any]) -> str:
    network = p["network"].strip().lower()
    sub_mint = p["sub_dao"] or (_sub_dao_mint(network) if network else "")

    if "FROM by_group b" in template:
        if network == "undelegated":
            return "AND lower(b.network) = 'undelegated'"
        if sub_mint:
            return f'AND b."subDao" = \'{_escape(sub_mint)}\''
        return ""
    if not sub_mint:
        return ""
    if "FROM cte_base s" in template:
        column = "s.sub_dao"
    elif "FROM helium.sub_daos_delegated_positions d" in template:
        column = "d.sub_dao"
    else:
        column = "subdao"
    return f"AND {column} = '{_escape(sub_mint)}'"


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
        type_filter = (
            "AND lower(cast(p.type AS varchar)) = "
            f"'{_escape(p['packet_type'].lower())}'"
        )

    free_filter = ""
    if p["free"] is not None and str(p["free"]).strip() != "":
        free_val = str(p["free"]).lower() in ("1", "true", "yes")
        free_filter = f"AND p.free = {str(free_val).upper()}"

    billing_filter = ""
    if p["billing"] == "paid":
        billing_filter = "AND p.free = false"
    elif p["billing"] == "free":
        billing_filter = "AND p.free = true"

    operational = p["include_operational"]

    return {
        "lookup_filter": _lookup_filter(p),
        "hotspot_filter": _hotspot_filter("r.gatewayreward.hotspotkey", p),
        "hotspot_filter_radio": _hotspot_filter("radioreward.hotspotkey", p),
        "hotspot_filter_gateway": _hotspot_filter("gatewayreward.hotspotkey", p),
        "address_filter": (
            f"AND hk.hotspot_key = '{_escape(p['address'])}'"
            if p["address"] and "{lookup_filter}" not in template
            else ""
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
            f"AND name = '{_escape(p['maker'])}'" if p["maker"] else ""
        ),
        "type_filter": type_filter,
        "free_filter": free_filter,
        "region_filter": (
            f"AND cast(p.region AS varchar) = '{_escape(p['region'])}'"
            if p["region"]
            else ""
        ),
        "datarate_filter": (
            f"AND cast(p.datarate AS varchar) = '{_escape(p['datarate'])}'"
            if p["datarate"]
            else ""
        ),
        "billing_filter": billing_filter,
        "operational_select": (
            "sum(coalesce(cast(r.operationalreward.amount AS bigint), 0)) / 1e6 "
            'AS "operationalIot",'
            if operational
            else ""
        ),
        "operational_total_expr": (
            "+ sum(coalesce(cast(r.operationalreward.amount AS bigint), 0))"
            if operational
            else ""
        ),
        "reward_filter": (
            "r.gatewayreward IS NOT NULL OR r.operationalreward IS NOT NULL"
            if operational
            else "r.gatewayreward IS NOT NULL"
        ),
    }


def bind_sql(template: str, raw_params: dict[str, Any] | None = None) -> str:
    p = default_params(raw_params)
    if "{oui_id}" in template and not p["oui_id"]:
        raise ValueError("oui_id is required")
    if "{lookup_filter}" in template and not p["address"]:
        raise ValueError("address or hotspot_key is required")
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

    unknown = sorted(set(_PLACEHOLDER_RE.findall(sql)))
    if unknown:
        raise ValueError(f"Unsupported SQL placeholders: {', '.join(unknown)}")
    return sql
