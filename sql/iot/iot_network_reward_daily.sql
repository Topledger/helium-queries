-- query_name: IOT_NETWORK_REWARD_DAILY
-- All hotspots, date range → daily network-wide IoT reward totals.
SELECT
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
WHERE r.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  AND r.gatewayreward IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC
