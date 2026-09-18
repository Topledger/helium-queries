-- query_name: RELAY_MOBILE_REWARD_SHARES
WITH shares AS (
    SELECT
        startperiod                                                         AS start_period,
        endperiod                                                           AS end_period,
        'radio'                                                             AS reward_type,
        radioreward.hotspotkey                                              AS hotspot_key,
        radioreward.cbsdid                                                  AS cbsd_id,
        radioreward.coverageobject                                          AS coverage_object,
        coalesce(cast(radioreward.pocreward        as bigint), 0)           AS poc_bones,
        coalesce(cast(radioreward.dctransferreward as bigint), 0)           AS dc_bones,
        cast(0 as bigint)                                                   AS subscriber_bones,
        cast(NULL as varchar)                                               AS subscriber_id
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND radioreward IS NOT NULL
      {hotspot_filter_radio}

    UNION ALL

    SELECT
        startperiod, endperiod, 'gateway',
        gatewayreward.hotspotkey, NULL, NULL,
        cast(0 as bigint),
        coalesce(cast(gatewayreward.dctransferreward as bigint), 0),
        cast(0 as bigint),
        NULL
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND gatewayreward IS NOT NULL
      {hotspot_filter_gateway}

    UNION ALL

    SELECT
        startperiod, endperiod, 'subscriber',
        NULL, NULL, NULL,
        cast(0 as bigint),
        cast(0 as bigint),
        coalesce(cast(subscriberreward.discoverylocationamount as bigint), 0),
        subscriberreward.subscriberid
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND subscriberreward IS NOT NULL
)
SELECT
    s.start_period                                            AS "startPeriod",
    s.end_period                                              AS "endPeriod",
    s.reward_type                                             AS "rewardType",
    s.hotspot_key                                             AS "hotspotKey",
    hk.asset_id                                               AS "assetId",
    hk.entity_key                                             AS "entityKey",
    hk.entity_key_b64                                         AS "entityKeyB64",
    hk.key_to_asset_key                                       AS "keyToAssetKey",
    hk.dao                                                    AS "dao",
    s.cbsd_id                                                 AS "cbsdId",
    s.coverage_object                                         AS "coverageObject",
    s.poc_bones        / 1e6                                  AS "pocReward",
    s.dc_bones         / 1e6                                  AS "dcTransferReward",
    s.subscriber_bones / 1e6                                  AS "discoveryLocationAmount",
    s.subscriber_id                                           AS "subscriberId",
    (s.poc_bones + s.dc_bones + s.subscriber_bones) / 1e6     AS "total_reward"
FROM shares s
LEFT JOIN helium.hotspot_keys hk
       ON hk.hotspot_key = s.hotspot_key
WHERE ('{entity_key}' = '' OR hk.entity_key = '{entity_key}')
ORDER BY s.start_period DESC
OFFSET {offset} LIMIT {limit}
