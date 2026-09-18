-- query_name: RADIO_REWARDS_SUM
SELECT
    '{cbsd_id}'                                                             AS "cbsdId",
    max(r.radioreward.hotspotkey)                                           AS "hotspotKey",
    hk.asset_id                                                             AS "assetId",
    hk.entity_key                                                           AS "entityKey",
    hk.key_to_asset_key                                                     AS "keyToAssetKey",
    CASE
        WHEN '{bucket}' = 'total'
            THEN '{start_date}'
        ELSE date_format(
                date_trunc('{bucket}', from_unixtime(cast(r.startperiod AS bigint))),
                '%Y-%m-%dT%H:%i:%sZ'
             )
    END                                                                     AS "bucketStart",
    sum(coalesce(cast(r.radioreward.pocreward AS bigint), 0)) / 1e6         AS "pocReward",
    sum(coalesce(cast(r.radioreward.dctransferreward AS bigint), 0)) / 1e6  AS "dcTransferReward",
    sum(
        coalesce(cast(r.radioreward.pocreward AS bigint), 0)
      + coalesce(cast(r.radioreward.dctransferreward AS bigint), 0)
    ) / 1e6                                                                 AS "total_reward"
FROM helium_oracle_mobile.mobilerewardshare r
LEFT JOIN helium.hotspot_keys hk
       ON hk.hotspot_key = r.radioreward.hotspotkey
WHERE r.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  AND r.radioreward.cbsdid = '{cbsd_id}'
GROUP BY 1, 3, 4, 5, 6
ORDER BY 6
