-- query_name: RELAY_IOT_REWARD_SHARES
SELECT
    r.gatewayreward.hotspotkey                                              AS "hotspotKey",
    hk.asset_id                                                             AS "assetId",
    hk.entity_key                                                           AS "entityKey",
    hk.entity_key_b64                                                       AS "entityKeyB64",
    hk.key_to_asset_key                                                     AS "keyToAssetKey",
    hk.dao                                                                  AS "dao",
    r.partition_0                                                           AS "partitionDate",
    date_format(
        from_unixtime(cast(r.startperiod as bigint)),
        '%Y-%m-%dT%H:%i:%sZ'
    )                                                                       AS "startPeriod",
    date_format(
        from_unixtime(cast(r.endperiod as bigint)),
        '%Y-%m-%dT%H:%i:%sZ'
    )                                                                       AS "endPeriod",
    coalesce(cast(r.gatewayreward.beaconamount     as bigint), 0) / 1e6     AS "beaconAmount",
    coalesce(cast(r.gatewayreward.witnessamount    as bigint), 0) / 1e6     AS "witnessAmount",
    coalesce(cast(r.gatewayreward.dctransferamount as bigint), 0) / 1e6     AS "dcTransferAmount",
    (
        coalesce(cast(r.gatewayreward.beaconamount     as bigint), 0)
      + coalesce(cast(r.gatewayreward.dctransferamount as bigint), 0)
      + coalesce(cast(r.gatewayreward.witnessamount    as bigint), 0)
    ) / 1e6                                                                 AS "total_reward"
FROM helium_oracle_iot.iotrewardshare r
LEFT JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = r.gatewayreward.hotspotkey
WHERE r.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  AND r.gatewayreward IS NOT NULL
  AND ('{entity_key}' = '' OR hk.entity_key = '{entity_key}')
  {lookup_filter}
  {hotspot_filter}
ORDER BY r.partition_0 DESC, r.startperiod DESC
OFFSET {offset} LIMIT {limit}
