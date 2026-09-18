-- query_name: HOTSPOT_LOOKUP_BY_KEY_TO_ASSET
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
)
SELECT
    hk.hotspot_key                               AS "hotspotKey",
    hk.asset_id                                  AS "assetId",
    hk.entity_key                                AS "entityKey",
    hk.entity_key_b64                            AS "entityKeyB64",
    hk.key_to_asset_key                          AS "keyToAssetKey",
    hk.key_serialization                         AS "keySerialization",
    hk.dao                                       AS "dao",
    date_format(CAST(m.mint_date AS TIMESTAMP), '%Y-%m-%d') AS "mintDate"
FROM helium.hotspot_keys hk
LEFT JOIN cte_mint m
  ON m.key_to_asset_key = hk.key_to_asset_key
WHERE hk.key_to_asset_key = '{key_to_asset_key}'
