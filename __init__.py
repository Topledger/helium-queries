"""Helium Oracle SQL queries — one file per query, grouped by folder.

    queries/sql/delegation/<query_name>.sql
    queries/sql/gateway/<query_name>.sql
    … (one folder per topic under queries/sql/)

Register here, e.g.:

    OUI_DATA = _load('OUI_DATA', subdir='oui')
"""

from pathlib import Path

_SQL_DIR = Path(__file__).parent / "sql"


def _load(name: str, subdir: str = "") -> str:
    base = _SQL_DIR / subdir if subdir else _SQL_DIR
    path = base / f"{name.lower()}.sql"
    return path.read_text(encoding="utf-8")


# hotspot
HOTSPOTS_LIST = _load('HOTSPOTS_LIST', subdir='hotspot')
HOTSPOT_GET = _load('HOTSPOT_GET', subdir='hotspot')
HOTSPOT_LOOKUP_BY_KEY_TO_ASSET = _load('HOTSPOT_LOOKUP_BY_KEY_TO_ASSET', subdir='hotspot')
HOTSPOT_METRICS = _load('HOTSPOT_METRICS', subdir='hotspot')
HOTSPOT_BY_MAKER = _load('HOTSPOT_BY_MAKER', subdir='hotspot')
HOTSPOT_MAKERS = _load('HOTSPOT_MAKERS', subdir='hotspot')

# iot — rewards, gateway packet/data, and network packet leaderboards
IOT_HOTSPOT_REWARD_DAILY = _load('IOT_HOTSPOT_REWARD_DAILY', subdir='iot')
IOT_HOTSPOT_REWARD_TOTAL = _load('IOT_HOTSPOT_REWARD_TOTAL', subdir='iot')
IOT_NETWORK_REWARD_DAILY = _load('IOT_NETWORK_REWARD_DAILY', subdir='iot')
IOT_NETWORK_REWARD_TOTAL = _load('IOT_NETWORK_REWARD_TOTAL', subdir='iot')
IOT_GATEWAY_DATA_SUM = _load('IOT_GATEWAY_DATA_SUM', subdir='iot')
IOT_GATEWAY_DATA = _load('IOT_GATEWAY_DATA', subdir='iot')
IOT_REGIONS = _load('IOT_REGIONS', subdir='iot')
IOT_DATARATES = _load('IOT_DATARATES', subdir='iot')
IOT_PACKETS_DAILY = _load('IOT_PACKETS_DAILY', subdir='iot')
IOT_TOP_HOTSPOTS_BY_PACKET_COUNT = _load('IOT_TOP_HOTSPOTS_BY_PACKET_COUNT', subdir='iot')
IOT_TOP_HOTSPOTS_BY_PAYLOAD_SIZE = _load('IOT_TOP_HOTSPOTS_BY_PAYLOAD_SIZE', subdir='iot')

# mobile — one SQL file per UI endpoint (queries/mobile/<name>.sql)
NETWORK_MOBILE_DAILY_REWARD = _load('NETWORK_MOBILE_DAILY_REWARD', subdir='mobile')
GATEWAY_MOBILE_DAILY_REWARD = _load('GATEWAY_MOBILE_DAILY_REWARD', subdir='mobile')
GATEWAY_MOBILE_DATA = _load('GATEWAY_MOBILE_DATA', subdir='mobile')
GATEWAY_MOBILE_DATA_SUM = _load('GATEWAY_MOBILE_DATA_SUM', subdir='mobile')
GATEWAY_MOBILE_SPEEDTEST_AVERAGES = _load('GATEWAY_MOBILE_SPEEDTEST_AVERAGES', subdir='mobile')
GATEWAY_MOBILE_HEARTBEAT_HOURS = _load('GATEWAY_MOBILE_HEARTBEAT_HOURS', subdir='mobile')
NETWORK_MOBILE_DATA = _load('NETWORK_MOBILE_DATA', subdir='mobile')
NETWORK_MOBILE_HEARTBEAT_HOURS = _load('NETWORK_MOBILE_HEARTBEAT_HOURS', subdir='mobile')

# relay
RELAY_IOT_REWARD_SHARES = _load('RELAY_IOT_REWARD_SHARES', subdir='relay')
RELAY_IOT_REWARD_TOTALS = _load('RELAY_IOT_REWARD_TOTALS', subdir='relay')
RELAY_IOT_REWARD_SHARES_COUNT = _load('RELAY_IOT_REWARD_SHARES_COUNT', subdir='relay')
RELAY_IOT_REWARD_TOTALS_COUNT = _load('RELAY_IOT_REWARD_TOTALS_COUNT', subdir='relay')

# gateway
GATEWAY_IOT_REWARDS = _load('GATEWAY_IOT_REWARDS', subdir='gateway')
GATEWAY_IOT_REWARDS_SUM = _load('GATEWAY_IOT_REWARDS_SUM', subdir='gateway')
GATEWAY_IOT_REWARDS_SUM_TOTAL = _load('GATEWAY_IOT_REWARDS_SUM_TOTAL', subdir='gateway')
GATEWAY_IOT_REWARDS_SUM_BUCKETED = _load('GATEWAY_IOT_REWARDS_SUM_BUCKETED', subdir='gateway')
GATEWAY_IOT_DATA = IOT_GATEWAY_DATA
GATEWAY_IOT_DATA_SUM = IOT_GATEWAY_DATA_SUM
# network
NETWORK_IOT_DATA = _load('NETWORK_IOT_DATA', subdir='network')
NETWORK_IOT_DATA_BY_REGION = _load('NETWORK_IOT_DATA_BY_REGION', subdir='network')
NETWORK_IOT_REWARDED_GATEWAYS = _load('NETWORK_IOT_REWARDED_GATEWAYS', subdir='network')
# oui
OUI_DATA = _load('OUI_DATA', subdir='oui')
OUI_PACKET_SIZE_DISTRIBUTION = _load('OUI_PACKET_SIZE_DISTRIBUTION', subdir='oui')
OUI_TOP_GATEWAYS_BY_PAYLOAD = _load('OUI_TOP_GATEWAYS_BY_PAYLOAD', subdir='oui')
OUI_DC_USAGE = _load('OUI_DC_USAGE', subdir='oui')

# delegation
DELEGATION_OPEN_POSITIONS = _load('OPEN_POSITIONS', subdir='delegation')
DELEGATION_DELEGATED_POSITIONS = _load('DELEGATED_POSITIONS', subdir='delegation')
DELEGATION_ACTIVE_STAKE = _load('ACTIVE_STAKE', subdir='delegation')
DELEGATION_ACTIVE_STAKE_BY_DAO = _load('ACTIVE_STAKE_BY_DAO', subdir='delegation')
DELEGATION_WALLET_POSITIONS = _load('WALLET_POSITIONS', subdir='delegation')
DELEGATION_WALLET_PROXIES = _load('WALLET_PROXIES', subdir='delegation')

# meta
TABLE_MAX_PARTITION_DATES = _load('TABLE_MAX_PARTITION_DATES', subdir='meta')
