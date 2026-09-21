-- query_name: IOT_NETWORK_REWARD_TOTAL
-- Network-wide IoT reward total, including operational-fund rewards.
SELECT
    sum(coalesce(cast(r.gatewayreward.beaconamount     as bigint), 0)) / 1e6 AS "beaconIot",
    sum(coalesce(cast(r.gatewayreward.witnessamount    as bigint), 0)) / 1e6 AS "witnessIot",
    sum(coalesce(cast(r.gatewayreward.dctransferamount as bigint), 0)) / 1e6 AS "dcTransferIot",
    sum(coalesce(cast(r.operationalreward.amount       as bigint), 0)) / 1e6 AS "operationalIot",
    (
        sum(coalesce(cast(r.gatewayreward.beaconamount     as bigint), 0))
      + sum(coalesce(cast(r.gatewayreward.dctransferamount as bigint), 0))
      + sum(coalesce(cast(r.gatewayreward.witnessamount    as bigint), 0))
      + sum(coalesce(cast(r.operationalreward.amount       as bigint), 0))
    ) / 1e6                                                                 AS "totalIot"
FROM helium_oracle_iot.iotrewardshare r
WHERE r.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  AND (r.gatewayreward IS NOT NULL OR r.operationalreward IS NOT NULL)
