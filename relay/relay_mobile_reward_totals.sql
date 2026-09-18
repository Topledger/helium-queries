-- query_name: RELAY_MOBILE_REWARD_TOTALS
WITH per_hotspot AS (
    SELECT
        radioreward.hotspotkey                                              AS hotspot_key,
        sum(coalesce(cast(radioreward.pocreward        as bigint), 0))      AS poc_bones,
        sum(coalesce(cast(radioreward.dctransferreward as bigint), 0))      AS dc_radio_bones,
        cast(0 as bigint)                                                   AS dc_gateway_bones
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND radioreward IS NOT NULL
    GROUP BY radioreward.hotspotkey

    UNION ALL

    SELECT
        gatewayreward.hotspotkey,
        cast(0 as bigint),
        cast(0 as bigint),
        sum(coalesce(cast(gatewayreward.dctransferreward as bigint), 0))
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND gatewayreward IS NOT NULL
    GROUP BY gatewayreward.hotspotkey
),
totals AS (
    SELECT
        hotspot_key,
        sum(poc_bones)                              AS poc_bones,
        sum(dc_radio_bones + dc_gateway_bones)      AS dc_bones,
        sum(poc_bones + dc_radio_bones + dc_gateway_bones) AS total_bones
    FROM per_hotspot
    GROUP BY hotspot_key
)
SELECT
    t.hotspot_key                                                           AS "hotspotKey",
    hk.asset_id                                                             AS "assetId",
    hk.entity_key                                                           AS "entityKey",
    hk.entity_key_b64                                                       AS "entityKeyB64",
    hk.key_to_asset_key                                                     AS "keyToAssetKey",
    hk.dao                                                                  AS "dao",
    t.poc_bones   / 1e6                                                     AS "pocReward",
    t.dc_bones    / 1e6                                                     AS "dcTransferReward",
    t.total_bones / 1e6                                                     AS "total_reward"
FROM totals t
LEFT JOIN helium.hotspot_keys hk
       ON hk.hotspot_key = t.hotspot_key
ORDER BY t.total_bones DESC
OFFSET {offset} LIMIT {limit}
