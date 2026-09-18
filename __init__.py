"""Helium Oracle SQL queries — one file per query, grouped by folder.

    queries/delegation/<query_name>.sql
    queries/gateway/<query_name>.sql
    queries/hotspot/<query_name>.sql
    queries/meta/<query_name>.sql
    queries/network/<query_name>.sql
    queries/oui/<query_name>.sql
    queries/relay/<query_name>.sql

Register here, e.g.:

    OUI_DATA = _load('OUI_DATA', subdir='oui')
"""

from pathlib import Path

_QUERIES_DIR = Path(__file__).parent


def _load(name: str, subdir: str = "") -> str:
    base = _QUERIES_DIR / subdir if subdir else _QUERIES_DIR
    path = base / f"{name.lower()}.sql"
    return path.read_text(encoding="utf-8")


# hotspot
HOTSPOTS_LIST = _load('HOTSPOTS_LIST', subdir='hotspot')
HOTSPOT_GET = _load('HOTSPOT_GET', subdir='hotspot')
HOTSPOT_LOOKUP_BY_KEY_TO_ASSET = _load('HOTSPOT_LOOKUP_BY_KEY_TO_ASSET', subdir='hotspot')
HOTSPOT_METRICS = _load('HOTSPOT_METRICS', subdir='hotspot')
HOTSPOT_BY_MAKER = _load('HOTSPOT_BY_MAKER', subdir='hotspot')
HOTSPOT_MAKERS = _load('HOTSPOT_MAKERS', subdir='hotspot')

# relay
RELAY_IOT_REWARD_SHARES = _load('RELAY_IOT_REWARD_SHARES', subdir='relay')
RELAY_IOT_REWARD_TOTALS = _load('RELAY_IOT_REWARD_TOTALS', subdir='relay')
RELAY_IOT_REWARD_SHARES_COUNT = _load('RELAY_IOT_REWARD_SHARES_COUNT', subdir='relay')
RELAY_IOT_REWARD_TOTALS_COUNT = _load('RELAY_IOT_REWARD_TOTALS_COUNT', subdir='relay')
RELAY_MOBILE_REWARD_SHARES = _load('RELAY_MOBILE_REWARD_SHARES', subdir='relay')
RELAY_MOBILE_REWARD_TOTALS = _load('RELAY_MOBILE_REWARD_TOTALS', subdir='relay')

# gateway
GATEWAY_IOT_REWARDS = _load('GATEWAY_IOT_REWARDS', subdir='gateway')
GATEWAY_IOT_REWARDS_SUM = _load('GATEWAY_IOT_REWARDS_SUM', subdir='gateway')
GATEWAY_IOT_REWARDS_SUM_TOTAL = _load('GATEWAY_IOT_REWARDS_SUM_TOTAL', subdir='gateway')
GATEWAY_IOT_REWARDS_SUM_BUCKETED = _load('GATEWAY_IOT_REWARDS_SUM_BUCKETED', subdir='gateway')
GATEWAY_IOT_DATA = _load('GATEWAY_IOT_DATA', subdir='gateway')
GATEWAY_IOT_DATA_SUM = _load('GATEWAY_IOT_DATA_SUM', subdir='gateway')
GATEWAY_IOT_DATA_BY_REGION = _load('GATEWAY_IOT_DATA_BY_REGION', subdir='gateway')
GATEWAY_IOT_DATA_BY_DATARATE = _load('GATEWAY_IOT_DATA_BY_DATARATE', subdir='gateway')
GATEWAY_IOT_RF = _load('GATEWAY_IOT_RF', subdir='gateway')
GATEWAY_IOT_DATA_FREE_PAID = _load('GATEWAY_IOT_DATA_FREE_PAID', subdir='gateway')
GATEWAY_IOT_DATA_DUPLICATES = _load('GATEWAY_IOT_DATA_DUPLICATES', subdir='gateway')
GATEWAY_MOBILE_REWARDS = _load('GATEWAY_MOBILE_REWARDS', subdir='gateway')
GATEWAY_MOBILE_REWARDS_SUM = _load('GATEWAY_MOBILE_REWARDS_SUM', subdir='gateway')
GATEWAY_MOBILE_REWARDS_SUM_TOTAL = _load('GATEWAY_MOBILE_REWARDS_SUM_TOTAL', subdir='gateway')
GATEWAY_MOBILE_REWARDS_SUM_BUCKETED = _load('GATEWAY_MOBILE_REWARDS_SUM_BUCKETED', subdir='gateway')
GATEWAY_MOBILE_DATA = _load('GATEWAY_MOBILE_DATA', subdir='gateway')
GATEWAY_MOBILE_DATA_SUM = _load('GATEWAY_MOBILE_DATA_SUM', subdir='gateway')
GATEWAY_MOBILE_SPEEDTEST_AVERAGES = _load('GATEWAY_MOBILE_SPEEDTEST_AVERAGES', subdir='gateway')
GATEWAY_MOBILE_HEARTBEAT_HOURS = _load('GATEWAY_MOBILE_HEARTBEAT_HOURS', subdir='gateway')
RADIO_REWARDS_SUM = _load('RADIO_REWARDS_SUM', subdir='gateway')

# network
NETWORK_IOT_DATA = _load('NETWORK_IOT_DATA', subdir='network')
NETWORK_IOT_DATA_BY_REGION = _load('NETWORK_IOT_DATA_BY_REGION', subdir='network')
NETWORK_IOT_REWARDED_GATEWAYS = _load('NETWORK_IOT_REWARDED_GATEWAYS', subdir='network')
NETWORK_MOBILE_DATA = _load('NETWORK_MOBILE_DATA', subdir='network')
NETWORK_MOBILE_REWARDED_GATEWAYS = _load('NETWORK_MOBILE_REWARDED_GATEWAYS', subdir='network')
NETWORK_MOBILE_REWARDED_SUBSCRIBERS = _load('NETWORK_MOBILE_REWARDED_SUBSCRIBERS', subdir='network')
NETWORK_MOBILE_REWARDED_RADIOS = _load('NETWORK_MOBILE_REWARDED_RADIOS', subdir='network')
NETWORK_MOBILE_HEARTBEAT_HOURS = _load('NETWORK_MOBILE_HEARTBEAT_HOURS', subdir='network')

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
