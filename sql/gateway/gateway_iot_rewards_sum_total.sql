-- query_name: GATEWAY_IOT_REWARDS_SUM_TOTAL
SELECT
    hk.hotspot_key                                                          AS "hotspotKey",
    hk.asset_id                                                             AS "assetId",
    hk.entity_key                                                           AS "entityKey",
    hk.key_to_asset_key                                                     AS "keyToAssetKey",
    '{start_date}'                                                          AS "bucketStart",
    sum(coalesce(cast(r.gatewayreward.beaconamount     as bigint), 0)) / 1e6 AS "beaconAmount",
    sum(coalesce(cast(r.gatewayreward.witnessamount    as bigint), 0)) / 1e6 AS "witnessAmount",
    sum(coalesce(cast(r.gatewayreward.dctransferamount as bigint), 0)) / 1e6 AS "dcTransferAmount",
    sum(
        coalesce(cast(r.gatewayreward.beaconamount     as bigint), 0)
      + coalesce(cast(r.gatewayreward.dctransferamount as bigint), 0)
      + coalesce(cast(r.gatewayreward.witnessamount    as bigint), 0)
    ) / 1e6                                                                 AS "total_reward"
FROM helium_oracle_iot.iotrewardshare r
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = r.gatewayreward.hotspotkey
WHERE r.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  {lookup_filter}
GROUP BY 1, 2, 3, 4, 5
