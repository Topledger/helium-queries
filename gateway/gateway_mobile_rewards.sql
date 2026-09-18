-- query_name: GATEWAY_MOBILE_REWARDS
WITH resolved AS (
    SELECT DISTINCT hk.hotspot_key
    FROM helium.hotspot_keys hk
    WHERE 1 = 1
      {lookup_filter}
),
shares AS (
    SELECT
        startperiod                                                         AS start_period,
        endperiod                                                           AS end_period,
        'radio'                                                             AS reward_type,
        radioreward.cbsdid                                                  AS cbsd_id,
        radioreward.coverageobject                                          AS coverage_object,
        coalesce(cast(radioreward.pocreward        as bigint), 0)           AS poc_bones,
        coalesce(cast(radioreward.dctransferreward as bigint), 0)           AS dc_bones
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND radioreward.hotspotkey IN (SELECT hotspot_key FROM resolved)

    UNION ALL

    SELECT
        startperiod, endperiod, 'gateway',
        NULL, NULL,
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
    hk.entity_key_b64                                                       AS "entityKeyB64",
    hk.key_to_asset_key                                                     AS "keyToAssetKey",
    hk.dao                                                                  AS "dao",
    s.start_period                                                          AS "startPeriod",
    s.end_period                                                            AS "endPeriod",
    s.reward_type                                                           AS "rewardType",
    s.cbsd_id                                                               AS "cbsdId",
    s.coverage_object                                                       AS "coverageObject",
    s.poc_bones / 1e6                                                       AS "pocReward",
    s.dc_bones  / 1e6                                                       AS "dcTransferReward",
    (s.poc_bones + s.dc_bones) / 1e6                                        AS "total_reward"
FROM shares s
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = (SELECT hotspot_key FROM resolved LIMIT 1)
ORDER BY s.start_period DESC
OFFSET {offset} LIMIT {limit}
