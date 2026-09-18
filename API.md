# Helium Oracle Query API

Trino-backed HTTP API for SQL in `sql/`. Each endpoint runs one `.sql` file with bound parameters (see `pipeline/helium_query_bind.py`).

**Catalog:** `GET http://84.32.71.101:8137/api/helium`

**Methods:** `GET` (query string) or `POST` (JSON body). POST may wrap fields as `{ "parameters": { ... } }`.

## Response shape

```json
{
  "success": true,
  "query": "delegation/active_stake",
  "count": 1,
  "rows": [ { "...": "..." } ]
}
```

## Query index

- [delegation/active_stake](#delegation-active-stake)
- [delegation/active_stake_by_dao](#delegation-active-stake-by-dao)
- [delegation/delegated_positions](#delegation-delegated-positions)
- [delegation/open_positions](#delegation-open-positions)
- [delegation/wallet_positions](#delegation-wallet-positions)
- [delegation/wallet_proxies](#delegation-wallet-proxies)
- [gateway/gateway_iot_data](#gateway-gateway-iot-data)
- [gateway/gateway_iot_data_by_datarate](#gateway-gateway-iot-data-by-datarate)
- [gateway/gateway_iot_data_by_region](#gateway-gateway-iot-data-by-region)
- [gateway/gateway_iot_data_duplicates](#gateway-gateway-iot-data-duplicates)
- [gateway/gateway_iot_data_free_paid](#gateway-gateway-iot-data-free-paid)
- [gateway/gateway_iot_data_sum](#gateway-gateway-iot-data-sum)
- [gateway/gateway_iot_rewards](#gateway-gateway-iot-rewards)
- [gateway/gateway_iot_rewards_sum](#gateway-gateway-iot-rewards-sum)
- [gateway/gateway_iot_rewards_sum_bucketed](#gateway-gateway-iot-rewards-sum-bucketed)
- [gateway/gateway_iot_rewards_sum_total](#gateway-gateway-iot-rewards-sum-total)
- [gateway/gateway_iot_rf](#gateway-gateway-iot-rf)
- [gateway/gateway_mobile_data](#gateway-gateway-mobile-data)
- [gateway/gateway_mobile_data_sum](#gateway-gateway-mobile-data-sum)
- [gateway/gateway_mobile_heartbeat_hours](#gateway-gateway-mobile-heartbeat-hours)
- [gateway/gateway_mobile_rewards](#gateway-gateway-mobile-rewards)
- [gateway/gateway_mobile_rewards_sum](#gateway-gateway-mobile-rewards-sum)
- [gateway/gateway_mobile_rewards_sum_bucketed](#gateway-gateway-mobile-rewards-sum-bucketed)
- [gateway/gateway_mobile_rewards_sum_total](#gateway-gateway-mobile-rewards-sum-total)
- [gateway/gateway_mobile_speedtest_averages](#gateway-gateway-mobile-speedtest-averages)
- [gateway/radio_rewards_sum](#gateway-radio-rewards-sum)
- [hotspot/hotspot_by_maker](#hotspot-hotspot-by-maker)
- [hotspot/hotspot_get](#hotspot-hotspot-get)
- [hotspot/hotspot_lookup_by_key_to_asset](#hotspot-hotspot-lookup-by-key-to-asset)
- [hotspot/hotspot_makers](#hotspot-hotspot-makers)
- [hotspot/hotspot_metrics](#hotspot-hotspot-metrics)
- [hotspot/hotspots_list](#hotspot-hotspots-list)
- [meta/table_max_partition_dates](#meta-table-max-partition-dates)
- [network/network_iot_data](#network-network-iot-data)
- [network/network_iot_data_by_region](#network-network-iot-data-by-region)
- [network/network_iot_rewarded_gateways](#network-network-iot-rewarded-gateways)
- [network/network_mobile_data](#network-network-mobile-data)
- [network/network_mobile_heartbeat_hours](#network-network-mobile-heartbeat-hours)
- [network/network_mobile_rewarded_gateways](#network-network-mobile-rewarded-gateways)
- [network/network_mobile_rewarded_radios](#network-network-mobile-rewarded-radios)
- [network/network_mobile_rewarded_subscribers](#network-network-mobile-rewarded-subscribers)
- [oui/oui_data](#oui-oui-data)
- [oui/oui_dc_usage](#oui-oui-dc-usage)
- [oui/oui_packet_size_distribution](#oui-oui-packet-size-distribution)
- [oui/oui_top_gateways_by_payload](#oui-oui-top-gateways-by-payload)
- [relay/relay_iot_reward_shares](#relay-relay-iot-reward-shares)
- [relay/relay_iot_reward_shares_count](#relay-relay-iot-reward-shares-count)
- [relay/relay_iot_reward_totals](#relay-relay-iot-reward-totals)
- [relay/relay_iot_reward_totals_count](#relay-relay-iot-reward-totals-count)
- [relay/relay_mobile_reward_shares](#relay-relay-mobile-reward-shares)
- [relay/relay_mobile_reward_totals](#relay-relay-mobile-reward-totals)

---

## delegation

<a id="delegation-active-stake"></a>

#### active_stake (`DELEGATION_ACTIVE_STAKE`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/delegation/active_stake`](http://84.32.71.101:8137/api/helium/delegation/active_stake)
- **Description:** All HNT still locked: live delegated (Mobile/IoT) plus undelegated. Undelegated amount = VSR deposits − withdrawals − transfers, HNT only.

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `now_ts` | integer (unix seconds) | no | current UTC time | Reference “now” for lock expiry and voting-power math (delegation). |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/delegation/active_stake"
```

<a id="delegation-active-stake-by-dao"></a>

#### active_stake_by_dao (`DELEGATION_ACTIVE_STAKE_BY_DAO`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/delegation/active_stake_by_dao`](http://84.32.71.101:8137/api/helium/delegation/active_stake_by_dao)
- **Description:** Locked HNT grouped by Mobile, IoT, and Undelegated. Undelegated amount comes from voter_stake_registry, not wallet_staking.

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `network` | enum | no | — | Shorthand: `Mobile` or `IoT` (maps to sub-DAO mint when `sub_dao` omitted). |
| `now_ts` | integer (unix seconds) | no | current UTC time | Reference “now” for lock expiry and voting-power math (delegation). |
| `sub_dao` | string | no | — | Sub-DAO program mint (Mobile or IoT sub-DAO address). |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/delegation/active_stake_by_dao?network=Mobile"
```

<a id="delegation-delegated-positions"></a>

#### delegated_positions (`DELEGATION_DELEGATED_POSITIONS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/delegation/delegated_positions`](http://84.32.71.101:8137/api/helium/delegation/delegated_positions)
- **Description:** On-chain DelegatedPositionV0 snapshot + current NFT holder / lockup from voter_stake_registry. All timestamps and voting power are UTC. Voting power (HIP-76), UTC seconds: Constant: full lock (end - start) / 4 years, does not decay

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `network` | enum | no | — | Shorthand: `Mobile` or `IoT` (maps to sub-DAO mint when `sub_dao` omitted). |
| `nft_mint` | string | no | — | Stake / position NFT mint address. |
| `now_ts` | integer (unix seconds) | no | current UTC time | Reference “now” for lock expiry and voting-power math (delegation). |
| `sub_dao` | string | no | — | Sub-DAO program mint (Mobile or IoT sub-DAO address). |
| `wallet` | string | no | — | Solana wallet pubkey (base58). |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/delegation/delegated_positions?network=Mobile&wallet=WalletPubkey..."
```

<a id="delegation-open-positions"></a>

#### open_positions (`DELEGATION_OPEN_POSITIONS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/delegation/open_positions`](http://84.32.71.101:8137/api/helium/delegation/open_positions)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `authority` | string | no | — | Position authority / `positionauthority` (open positions). Alias: `position_authority`. |
| `network` | enum | no | — | Shorthand: `Mobile` or `IoT` (maps to sub-DAO mint when `sub_dao` omitted). |
| `nft_mint` | string | no | — | Stake / position NFT mint address. |
| `sub_dao` | string | no | — | Sub-DAO program mint (Mobile or IoT sub-DAO address). |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/delegation/open_positions?network=Mobile"
```

<a id="delegation-wallet-positions"></a>

#### wallet_positions (`DELEGATION_WALLET_POSITIONS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/delegation/wallet_positions`](http://84.32.71.101:8137/api/helium/delegation/wallet_positions)
- **Description:** All HNT locks that still have a deposit: live delegated + undelegated. wallet = creating wallet from InitializePositionV0 (recipient). Amount: live snapshot when delegated, else VSR deposit − withdraw − transfer. Empty (0 HNT) and closed locks are omitted.

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `network` | enum | no | — | Shorthand: `Mobile` or `IoT` (maps to sub-DAO mint when `sub_dao` omitted). |
| `nft_mint` | string | no | — | Stake / position NFT mint address. |
| `now_ts` | integer (unix seconds) | no | current UTC time | Reference “now” for lock expiry and voting-power math (delegation). |
| `status` | enum | no | — | Wallet positions: `delegated` or `undelegated`. |
| `sub_dao` | string | no | — | Sub-DAO program mint (Mobile or IoT sub-DAO address). |
| `wallet` | string | no | — | Solana wallet pubkey (base58). |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/delegation/wallet_positions?network=Mobile&wallet=WalletPubkey..."
```

<a id="delegation-wallet-proxies"></a>

#### wallet_proxies (`DELEGATION_WALLET_PROXIES`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/delegation/wallet_proxies`](http://84.32.71.101:8137/api/helium/delegation/wallet_proxies)
- **Description:** Latest assign_proxy per stake NFT, then keep rows for this wallet. role=owner: wallet is assign_proxy.payer (they assigned the proxy) role=proxy: wallet is assign_proxy.recipient (they receive the vote)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `nft_mint` | string | no | — | Stake / position NFT mint address. |
| `now_ts` | integer (unix seconds) | no | current UTC time | Reference “now” for lock expiry and voting-power math (delegation). |
| `role` | enum | no | owner | For wallet proxies: `owner` (payer) or `proxy` (recipient). |
| `wallet` | string | **yes** | — | Solana wallet pubkey (base58). |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/delegation/wallet_proxies?wallet=WalletPubkey..."
```

## gateway

<a id="gateway-gateway-iot-data"></a>

#### gateway_iot_data (`GATEWAY_IOT_DATA`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data`](http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `free` | boolean | no | — | Filter free (`true`) vs paid (`false`) IoT packets. |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `limit` | integer | no | 100 | SQL `LIMIT` (max rows). |
| `offset` | integer | no | 0 | SQL `OFFSET` for paginated result sets. |
| `packet_type` | string | no | — | IoT packet report type filter. Alias query param: `type`. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data?address=112abc...&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-iot-data-by-datarate"></a>

#### gateway_iot_data_by_datarate (`GATEWAY_IOT_DATA_BY_DATARATE`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_by_datarate`](http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_by_datarate)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_by_datarate?address=112abc...&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-iot-data-by-region"></a>

#### gateway_iot_data_by_region (`GATEWAY_IOT_DATA_BY_REGION`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_by_region`](http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_by_region)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_by_region?address=112abc...&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-iot-data-duplicates"></a>

#### gateway_iot_data_duplicates (`GATEWAY_IOT_DATA_DUPLICATES`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_duplicates`](http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_duplicates)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `limit` | integer | no | 100 | SQL `LIMIT` (max rows). |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_duplicates?address=112abc...&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-iot-data-free-paid"></a>

#### gateway_iot_data_free_paid (`GATEWAY_IOT_DATA_FREE_PAID`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_free_paid`](http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_free_paid)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_free_paid?address=112abc...&bucket=day&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-iot-data-sum"></a>

#### gateway_iot_data_sum (`GATEWAY_IOT_DATA_SUM`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_sum`](http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_sum)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_iot_data_sum?address=112abc...&bucket=day&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-iot-rewards"></a>

#### gateway_iot_rewards (`GATEWAY_IOT_REWARDS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rewards`](http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rewards)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `limit` | integer | no | 100 | SQL `LIMIT` (max rows). |
| `offset` | integer | no | 0 | SQL `OFFSET` for paginated result sets. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rewards?address=112abc...&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-iot-rewards-sum"></a>

#### gateway_iot_rewards_sum (`GATEWAY_IOT_REWARDS_SUM`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rewards_sum`](http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rewards_sum)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rewards_sum?address=112abc...&bucket=day&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-iot-rewards-sum-bucketed"></a>

#### gateway_iot_rewards_sum_bucketed (`GATEWAY_IOT_REWARDS_SUM_BUCKETED`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rewards_sum_bucketed`](http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rewards_sum_bucketed)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rewards_sum_bucketed?address=112abc...&bucket=day&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-iot-rewards-sum-total"></a>

#### gateway_iot_rewards_sum_total (`GATEWAY_IOT_REWARDS_SUM_TOTAL`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rewards_sum_total`](http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rewards_sum_total)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rewards_sum_total?address=112abc...&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-iot-rf"></a>

#### gateway_iot_rf (`GATEWAY_IOT_RF`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rf`](http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rf)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_iot_rf?address=112abc...&bucket=day&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-mobile-data"></a>

#### gateway_mobile_data (`GATEWAY_MOBILE_DATA`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_data`](http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_data)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `limit` | integer | no | 100 | SQL `LIMIT` (max rows). |
| `offset` | integer | no | 0 | SQL `OFFSET` for paginated result sets. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_data?address=112abc...&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-mobile-data-sum"></a>

#### gateway_mobile_data_sum (`GATEWAY_MOBILE_DATA_SUM`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_data_sum`](http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_data_sum)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_data_sum?address=112abc...&bucket=day&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-mobile-heartbeat-hours"></a>

#### gateway_mobile_heartbeat_hours (`GATEWAY_MOBILE_HEARTBEAT_HOURS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_heartbeat_hours`](http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_heartbeat_hours)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `limit` | integer | no | 100 | SQL `LIMIT` (max rows). |
| `offset` | integer | no | 0 | SQL `OFFSET` for paginated result sets. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_heartbeat_hours?address=112abc...&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-mobile-rewards"></a>

#### gateway_mobile_rewards (`GATEWAY_MOBILE_REWARDS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_rewards`](http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_rewards)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `limit` | integer | no | 100 | SQL `LIMIT` (max rows). |
| `offset` | integer | no | 0 | SQL `OFFSET` for paginated result sets. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_rewards?address=112abc...&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-mobile-rewards-sum"></a>

#### gateway_mobile_rewards_sum (`GATEWAY_MOBILE_REWARDS_SUM`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_rewards_sum`](http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_rewards_sum)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_rewards_sum?address=112abc...&bucket=day&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-mobile-rewards-sum-bucketed"></a>

#### gateway_mobile_rewards_sum_bucketed (`GATEWAY_MOBILE_REWARDS_SUM_BUCKETED`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_rewards_sum_bucketed`](http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_rewards_sum_bucketed)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_rewards_sum_bucketed?address=112abc...&bucket=day&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-mobile-rewards-sum-total"></a>

#### gateway_mobile_rewards_sum_total (`GATEWAY_MOBILE_REWARDS_SUM_TOTAL`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_rewards_sum_total`](http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_rewards_sum_total)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_rewards_sum_total?address=112abc...&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-gateway-mobile-speedtest-averages"></a>

#### gateway_mobile_speedtest_averages (`GATEWAY_MOBILE_SPEEDTEST_AVERAGES`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_speedtest_averages`](http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_speedtest_averages)

**Parameters**


> **Gateway identity:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/gateway_mobile_speedtest_averages?address=112abc...&bucket=day&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="gateway-radio-rewards-sum"></a>

#### radio_rewards_sum (`RADIO_REWARDS_SUM`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/gateway/radio_rewards_sum`](http://84.32.71.101:8137/api/helium/gateway/radio_rewards_sum)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `cbsd_id` | string | **yes** | — | Mobile radio CBSD identifier (`radioreward.cbsdid`). |
| `end_date` | date (YYYY-MM-DD) | **yes** | today | Inclusive upper bound on `partition_0`. |
| `start_date` | date (YYYY-MM-DD) | **yes** | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/gateway/radio_rewards_sum?bucket=day&cbsd_id=CBSD-...&end_date=2026-01-07&start_date=2026-01-01"
```

## hotspot

<a id="hotspot-hotspot-by-maker"></a>

#### hotspot_by_maker (`HOTSPOT_BY_MAKER`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/hotspot/hotspot_by_maker`](http://84.32.71.101:8137/api/helium/hotspot/hotspot_by_maker)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `maker` | string | no | — | Hotspot maker account pubkey (`InitializeMakerV0`). |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/hotspot/hotspot_by_maker"
```

<a id="hotspot-hotspot-get"></a>

#### hotspot_get (`HOTSPOT_GET`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/hotspot/hotspot_get`](http://84.32.71.101:8137/api/helium/hotspot/hotspot_get)
- **Description:** Lookup by any identity: hotspot_key, entity_key, entity_key_b64, asset_id, or key_to_asset_key. Animal name is not in this table; the API enriches it from entities.nft.helium.io using the entity key.

**Parameters**


> **Lookup:** pass at least one of `address`, `entity_key`, `asset_id`, or `key_to_asset_key`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | one of * | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | one of * | — | On-chain hotspot asset id. |
| `entity_key` | string | one of * | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | one of * | — | Helium key-to-asset account pubkey. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/hotspot/hotspot_get?address=112abc...&key_to_asset_key=KeyToAsset..."
```

<a id="hotspot-hotspot-lookup-by-key-to-asset"></a>

#### hotspot_lookup_by_key_to_asset (`HOTSPOT_LOOKUP_BY_KEY_TO_ASSET`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/hotspot/hotspot_lookup_by_key_to_asset`](http://84.32.71.101:8137/api/helium/hotspot/hotspot_lookup_by_key_to_asset)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `key_to_asset_key` | string | **yes** | — | Helium key-to-asset account pubkey. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/hotspot/hotspot_lookup_by_key_to_asset?key_to_asset_key=KeyToAsset..."
```

<a id="hotspot-hotspot-makers"></a>

#### hotspot_makers (`HOTSPOT_MAKERS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/hotspot/hotspot_makers`](http://84.32.71.101:8137/api/helium/hotspot/hotspot_makers)

**Parameters**

_No bind parameters — returns full snapshot._

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/hotspot/hotspot_makers"
```

<a id="hotspot-hotspot-metrics"></a>

#### hotspot_metrics (`HOTSPOT_METRICS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/hotspot/hotspot_metrics`](http://84.32.71.101:8137/api/helium/hotspot/hotspot_metrics)

**Parameters**

_No bind parameters — returns full snapshot._

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/hotspot/hotspot_metrics"
```

<a id="hotspot-hotspots-list"></a>

#### hotspots_list (`HOTSPOTS_LIST`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/hotspot/hotspots_list`](http://84.32.71.101:8137/api/helium/hotspot/hotspots_list)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | no | 100 | SQL `LIMIT` (max rows). |
| `offset` | integer | no | 0 | SQL `OFFSET` for paginated result sets. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/hotspot/hotspots_list"
```

## meta

<a id="meta-table-max-partition-dates"></a>

#### table_max_partition_dates (`TABLE_MAX_PARTITION_DATES`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/meta/table_max_partition_dates`](http://84.32.71.101:8137/api/helium/meta/table_max_partition_dates)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `min_date` | date (YYYY-MM-DD) | no | 2024-01-01 | Only consider partitions on or after this date (meta freshness). |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/meta/table_max_partition_dates"
```

## network

<a id="network-network-iot-data"></a>

#### network_iot_data (`NETWORK_IOT_DATA`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/network/network_iot_data`](http://84.32.71.101:8137/api/helium/network/network_iot_data)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/network/network_iot_data?bucket=day&end_date=2026-01-07&start_date=2026-01-01"
```

<a id="network-network-iot-data-by-region"></a>

#### network_iot_data_by_region (`NETWORK_IOT_DATA_BY_REGION`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/network/network_iot_data_by_region`](http://84.32.71.101:8137/api/helium/network/network_iot_data_by_region)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/network/network_iot_data_by_region?end_date=2026-01-07&start_date=2026-01-01"
```

<a id="network-network-iot-rewarded-gateways"></a>

#### network_iot_rewarded_gateways (`NETWORK_IOT_REWARDED_GATEWAYS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/network/network_iot_rewarded_gateways`](http://84.32.71.101:8137/api/helium/network/network_iot_rewarded_gateways)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/network/network_iot_rewarded_gateways?bucket=day&end_date=2026-01-07&start_date=2026-01-01"
```

<a id="network-network-mobile-data"></a>

#### network_mobile_data (`NETWORK_MOBILE_DATA`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/network/network_mobile_data`](http://84.32.71.101:8137/api/helium/network/network_mobile_data)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/network/network_mobile_data?bucket=day&end_date=2026-01-07&start_date=2026-01-01"
```

<a id="network-network-mobile-heartbeat-hours"></a>

#### network_mobile_heartbeat_hours (`NETWORK_MOBILE_HEARTBEAT_HOURS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/network/network_mobile_heartbeat_hours`](http://84.32.71.101:8137/api/helium/network/network_mobile_heartbeat_hours)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/network/network_mobile_heartbeat_hours?bucket=day&end_date=2026-01-07&start_date=2026-01-01"
```

<a id="network-network-mobile-rewarded-gateways"></a>

#### network_mobile_rewarded_gateways (`NETWORK_MOBILE_REWARDED_GATEWAYS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/network/network_mobile_rewarded_gateways`](http://84.32.71.101:8137/api/helium/network/network_mobile_rewarded_gateways)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/network/network_mobile_rewarded_gateways?bucket=day&end_date=2026-01-07&start_date=2026-01-01"
```

<a id="network-network-mobile-rewarded-radios"></a>

#### network_mobile_rewarded_radios (`NETWORK_MOBILE_REWARDED_RADIOS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/network/network_mobile_rewarded_radios`](http://84.32.71.101:8137/api/helium/network/network_mobile_rewarded_radios)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/network/network_mobile_rewarded_radios?bucket=day&end_date=2026-01-07&start_date=2026-01-01"
```

<a id="network-network-mobile-rewarded-subscribers"></a>

#### network_mobile_rewarded_subscribers (`NETWORK_MOBILE_REWARDED_SUBSCRIBERS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/network/network_mobile_rewarded_subscribers`](http://84.32.71.101:8137/api/helium/network/network_mobile_rewarded_subscribers)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/network/network_mobile_rewarded_subscribers?bucket=day&end_date=2026-01-07&start_date=2026-01-01"
```

## oui

<a id="oui-oui-data"></a>

#### oui_data (`OUI_DATA`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/oui/oui_data`](http://84.32.71.101:8137/api/helium/oui/oui_data)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bucket` | enum | no | day | Time bucket: `hour`, `day`, `week`, or `total` (rollup endpoints). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `oui_id` | string | **yes** | — | LoRaWAN OUI id (also accepted as query param `oui`). |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/oui/oui_data?bucket=day&end_date=2026-01-07&oui_id=1234&start_date=2026-01-01"
```

<a id="oui-oui-dc-usage"></a>

#### oui_dc_usage (`OUI_DC_USAGE`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/oui/oui_dc_usage`](http://84.32.71.101:8137/api/helium/oui/oui_dc_usage)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `oui_id` | string | **yes** | — | LoRaWAN OUI id (also accepted as query param `oui`). |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/oui/oui_dc_usage?oui_id=1234"
```

<a id="oui-oui-packet-size-distribution"></a>

#### oui_packet_size_distribution (`OUI_PACKET_SIZE_DISTRIBUTION`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/oui/oui_packet_size_distribution`](http://84.32.71.101:8137/api/helium/oui/oui_packet_size_distribution)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `end_date` | date (YYYY-MM-DD) | **yes** | today | Inclusive upper bound on `partition_0`. |
| `oui_id` | string | **yes** | — | LoRaWAN OUI id (also accepted as query param `oui`). |
| `start_date` | date (YYYY-MM-DD) | **yes** | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/oui/oui_packet_size_distribution?end_date=2026-01-07&oui_id=1234&start_date=2026-01-01"
```

<a id="oui-oui-top-gateways-by-payload"></a>

#### oui_top_gateways_by_payload (`OUI_TOP_GATEWAYS_BY_PAYLOAD`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/oui/oui_top_gateways_by_payload`](http://84.32.71.101:8137/api/helium/oui/oui_top_gateways_by_payload)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `end_date` | date (YYYY-MM-DD) | **yes** | today | Inclusive upper bound on `partition_0`. |
| `limit` | integer | no | 100 | SQL `LIMIT` (max rows). |
| `oui_id` | string | **yes** | — | LoRaWAN OUI id (also accepted as query param `oui`). |
| `start_date` | date (YYYY-MM-DD) | **yes** | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/oui/oui_top_gateways_by_payload?end_date=2026-01-07&oui_id=1234&start_date=2026-01-01"
```

## relay

<a id="relay-relay-iot-reward-shares"></a>

#### relay_iot_reward_shares (`RELAY_IOT_REWARD_SHARES`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/relay/relay_iot_reward_shares`](http://84.32.71.101:8137/api/helium/relay/relay_iot_reward_shares)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | no | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `asset_id` | string | no | — | On-chain hotspot asset id. |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | no | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `key_to_asset_key` | string | no | — | Helium key-to-asset account pubkey. |
| `limit` | integer | no | 100 | SQL `LIMIT` (max rows). |
| `offset` | integer | no | 0 | SQL `OFFSET` for paginated result sets. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/relay/relay_iot_reward_shares?address=112abc...&end_date=2026-01-07&key_to_asset_key=KeyToAsset...&start_date=2026-01-01"
```

<a id="relay-relay-iot-reward-shares-count"></a>

#### relay_iot_reward_shares_count (`RELAY_IOT_REWARD_SHARES_COUNT`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/relay/relay_iot_reward_shares_count`](http://84.32.71.101:8137/api/helium/relay/relay_iot_reward_shares_count)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | no | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | no | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/relay/relay_iot_reward_shares_count?address=112abc...&end_date=2026-01-07&start_date=2026-01-01"
```

<a id="relay-relay-iot-reward-totals"></a>

#### relay_iot_reward_totals (`RELAY_IOT_REWARD_TOTALS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/relay/relay_iot_reward_totals`](http://84.32.71.101:8137/api/helium/relay/relay_iot_reward_totals)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `limit` | integer | no | 100 | SQL `LIMIT` (max rows). |
| `offset` | integer | no | 0 | SQL `OFFSET` for paginated result sets. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/relay/relay_iot_reward_totals?end_date=2026-01-07&start_date=2026-01-01"
```

<a id="relay-relay-iot-reward-totals-count"></a>

#### relay_iot_reward_totals_count (`RELAY_IOT_REWARD_TOTALS_COUNT`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/relay/relay_iot_reward_totals_count`](http://84.32.71.101:8137/api/helium/relay/relay_iot_reward_totals_count)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/relay/relay_iot_reward_totals_count?end_date=2026-01-07&start_date=2026-01-01"
```

<a id="relay-relay-mobile-reward-shares"></a>

#### relay_mobile_reward_shares (`RELAY_MOBILE_REWARD_SHARES`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/relay/relay_mobile_reward_shares`](http://84.32.71.101:8137/api/helium/relay/relay_mobile_reward_shares)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | no | — | Hotspot / gateway signing pubkey (base58, ~44 chars). |
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `entity_key` | string | no | "" (empty = all) | Helium entity key (`helium.hotspot_keys.entity_key`). |
| `limit` | integer | no | 100 | SQL `LIMIT` (max rows). |
| `offset` | integer | no | 0 | SQL `OFFSET` for paginated result sets. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/relay/relay_mobile_reward_shares?address=112abc...&end_date=2026-01-07&start_date=2026-01-01"
```

<a id="relay-relay-mobile-reward-totals"></a>

#### relay_mobile_reward_totals (`RELAY_MOBILE_REWARD_TOTALS`)

- **Methods:** `GET`, `POST`
- **URL:** [`http://84.32.71.101:8137/api/helium/relay/relay_mobile_reward_totals`](http://84.32.71.101:8137/api/helium/relay/relay_mobile_reward_totals)

**Parameters**


| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `end_date` | date (YYYY-MM-DD) | no | today | Inclusive upper bound on `partition_0`. |
| `limit` | integer | no | 100 | SQL `LIMIT` (max rows). |
| `offset` | integer | no | 0 | SQL `OFFSET` for paginated result sets. |
| `start_date` | date (YYYY-MM-DD) | no | 7 days before today | Inclusive lower bound on `partition_0`. |

**Example**

```bash
curl -s "http://84.32.71.101:8137/api/helium/relay/relay_mobile_reward_totals?end_date=2026-01-07&start_date=2026-01-01"
```



---

_Regenerate: `node scripts/generate-helium-api-docs.js` (51 queries)._
