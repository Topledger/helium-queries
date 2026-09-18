-- query_name: IOT_HOTSPOT_REWARD_DAILY
-- One hotspot, date range → daily IoT reward breakdown.
SELECT
    hk.hotspot_key                                                          AS "hotspotKey",
    hk.entity_key                                                           AS "entityKey",
    hk.entity_key_b64                                                       AS "entityKeyB64",
    hk.asset_id                                                             AS "assetId",
    hk.key_to_asset_key                                                     AS "keyToAssetKey",
    r.partition_0                                                           AS "rewardDate",
    sum(coalesce(cast(r.gatewayreward.beaconamount     as bigint), 0)) / 1e6 AS "beaconIot",
    sum(coalesce(cast(r.gatewayreward.witnessamount    as bigint), 0)) / 1e6 AS "witnessIot",
    sum(coalesce(cast(r.gatewayreward.dctransferamount as bigint), 0)) / 1e6 AS "dcTransferIot",
    sum(
        coalesce(cast(r.gatewayreward.beaconamount     as bigint), 0)
      + coalesce(cast(r.gatewayreward.dctransferamount as bigint), 0)
      + coalesce(cast(r.gatewayreward.witnessamount    as bigint), 0)
    ) / 1e6                                                                 AS "dailyReward"
FROM helium_oracle_iot.iotrewardshare r
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = r.gatewayreward.hotspotkey
WHERE r.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  AND r.gatewayreward IS NOT NULL
  {lookup_filter}
GROUP BY 1, 2, 3, 4, 5, 6
ORDER BY 6 DESC
