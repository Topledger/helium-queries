-- query_name: HOTSPOT_GET
-- Find a hotspot's identity record using its hotspot key, entity key,
-- base64 entity key, asset ID, or key-to-asset account. Returns the
-- identifiers needed to match the hotspot across Helium and Solana data.
WITH cte_mint AS (
    SELECT
        input_accounts.keyToAsset AS key_to_asset_key,
        min(block_date)           AS mint_date
    FROM helium.entity_manager
    WHERE input_accounts.keyToAsset IS NOT NULL
      AND instruction_type IN (
          'GenesisIssueHotspotV0',
          'IssueEntityV0',
          'IssueDataOnlyEntityV0'
      )
    GROUP BY 1
),
cte_network_events AS (
    SELECT DISTINCT
        input_accounts.keyToAsset AS key_to_asset_key,
        CASE
            WHEN instruction_type IN (
                'OnboardIotHotspotV0',
                'OnboardDataOnlyIotHotspotV0'
            ) THEN 'IoT'
            WHEN instruction_type IN (
                'OnboardMobileHotspotV0',
                'OnboardDataOnlyMobileHotspotV0'
            ) THEN 'Mobile'
        END AS network,
        CASE
            WHEN instruction_type IN (
                'OnboardIotHotspotV0',
                'OnboardDataOnlyIotHotspotV0'
            ) THEN '39Lw1RH6zt8AJvKn3BTxmUDofzduCM2J3kSaGDZ8L7Sk'
            WHEN instruction_type IN (
                'OnboardMobileHotspotV0',
                'OnboardDataOnlyMobileHotspotV0'
            ) THEN 'Gm9xDCJawDEKDrrQW6haw94gABaYzQwCq4ZQU8h8bd22'
        END AS sub_dao
    FROM helium.entity_manager
    WHERE input_accounts.keyToAsset IS NOT NULL
      AND instruction_type IN (
          'OnboardIotHotspotV0',
          'OnboardDataOnlyIotHotspotV0',
          'OnboardMobileHotspotV0',
          'OnboardDataOnlyMobileHotspotV0'
      )
),
cte_networks AS (
    SELECT
        key_to_asset_key,
        array_sort(array_agg(DISTINCT network)) AS networks,
        array_sort(array_agg(DISTINCT sub_dao)) AS sub_daos
    FROM cte_network_events
    GROUP BY 1
)
SELECT
    hk.hotspot_key                               AS "hotspotKey",
    hk.asset_id                                  AS "assetId",
    hk.entity_key                                AS "entityKey",
    hk.entity_key_b64                            AS "entityKeyB64",
    hk.key_to_asset_key                          AS "keyToAssetKey",
    hk.key_serialization                         AS "keySerialization",
    n.networks                                   AS "networks",
    n.sub_daos                                   AS "subDaos",
    date_format(CAST(m.mint_date AS TIMESTAMP), '%Y-%m-%d') AS "mintDate"
FROM helium.hotspot_keys hk
LEFT JOIN cte_mint m
  ON m.key_to_asset_key = hk.key_to_asset_key
LEFT JOIN cte_networks n
  ON n.key_to_asset_key = hk.key_to_asset_key
WHERE 1=1
  {lookup_filter}
  {address_filter}
  {entity_key_filter}
  {asset_id_filter}
  {key_to_asset_filter}
LIMIT 10
