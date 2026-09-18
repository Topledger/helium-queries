-- query_name: GATEWAY_MOBILE_REWARDS_SUM
WITH resolved AS (
    SELECT DISTINCT hk.hotspot_key
    FROM helium.hotspot_keys hk
    WHERE 1 = 1
      {lookup_filter}
),
rows AS (
    SELECT
        startperiod,
        coalesce(cast(radioreward.pocreward        as bigint), 0) AS poc_bones,
        coalesce(cast(radioreward.dctransferreward as bigint), 0) AS dc_radio_bones,
        cast(0 as bigint)                                         AS dc_gateway_bones
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND radioreward.hotspotkey IN (SELECT hotspot_key FROM resolved)

    UNION ALL

    SELECT
        startperiod,
        cast(0 as bigint),
        cast(0 as bigint),
        coalesce(cast(gatewayreward.dctransferreward as bigint), 0)
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND gatewayreward.hotspotkey IN (SELECT hotspot_key FROM resolved)
)
SELECT
    hk.hotspot_key                                                          AS "hotspotKey",
    hk.asset_id                                                             AS "assetId",
    hk.entity_key                                                           AS "entityKey",
    hk.key_to_asset_key                                                     AS "keyToAssetKey",
    CASE
        WHEN '{bucket}' = 'total'
            THEN '{start_date}'
        ELSE date_format(
                date_trunc('{bucket}', from_unixtime(cast(rows.startperiod as bigint))),
                '%Y-%m-%dT%H:%i:%sZ'
             )
    END                                                                     AS "bucketStart",
    sum(rows.poc_bones)                          / 1e6                      AS "pocReward",
    sum(rows.dc_radio_bones + rows.dc_gateway_bones) / 1e6                  AS "dcTransferReward",
    sum(rows.poc_bones + rows.dc_radio_bones + rows.dc_gateway_bones) / 1e6 AS "total_reward"
FROM rows
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = (SELECT hotspot_key FROM resolved LIMIT 1)
GROUP BY 1, 2, 3, 4, 5
ORDER BY 5
