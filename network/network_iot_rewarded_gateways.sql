-- query_name: NETWORK_IOT_REWARDED_GATEWAYS
SELECT
    CASE
        WHEN '{bucket}' = 'total'
            THEN '{start_date}'
        ELSE date_format(
                date_trunc('{bucket}', CAST(r.partition_0 AS date)),
                '%Y-%m-%dT%H:%i:%sZ'
             )
    END                                                                     AS "bucketStart",
    count(DISTINCT r.gatewayreward.hotspotkey)                              AS "rewardedGateways",
    count(DISTINCT CASE
        WHEN coalesce(cast(r.gatewayreward.beaconamount AS bigint), 0) > 0
        THEN r.gatewayreward.hotspotkey
    END)                                                                    AS "beaconGateways",
    count(DISTINCT CASE
        WHEN coalesce(cast(r.gatewayreward.witnessamount AS bigint), 0) > 0
        THEN r.gatewayreward.hotspotkey
    END)                                                                    AS "witnessGateways",
    count(DISTINCT CASE
        WHEN coalesce(cast(r.gatewayreward.dctransferamount AS bigint), 0) > 0
        THEN r.gatewayreward.hotspotkey
    END)                                                                    AS "dcTransferGateways",
    sum(coalesce(cast(r.gatewayreward.beaconamount AS bigint), 0)) / 1e6     AS "beaconAmount",
    sum(coalesce(cast(r.gatewayreward.witnessamount AS bigint), 0)) / 1e6    AS "witnessAmount",
    sum(coalesce(cast(r.gatewayreward.dctransferamount AS bigint), 0)) / 1e6 AS "dcTransferAmount",
    sum(
        coalesce(cast(r.gatewayreward.beaconamount AS bigint), 0)
      + coalesce(cast(r.gatewayreward.witnessamount AS bigint), 0)
      + coalesce(cast(r.gatewayreward.dctransferamount AS bigint), 0)
    ) / 1e6                                                                 AS "totalReward"
FROM helium_oracle_iot.iotrewardshare r
WHERE r.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  AND r.gatewayreward IS NOT NULL
GROUP BY 1
ORDER BY 1
