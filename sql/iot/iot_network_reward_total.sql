-- query_name: IOT_NETWORK_REWARD_TOTAL
-- All hotspots, one date range → single network-wide IoT reward total.
SELECT
    sum(coalesce(cast(r.gatewayreward.beaconamount     as bigint), 0)) / 1e6 AS "beaconIot",
    sum(coalesce(cast(r.gatewayreward.witnessamount    as bigint), 0)) / 1e6 AS "witnessIot",
    sum(coalesce(cast(r.gatewayreward.dctransferamount as bigint), 0)) / 1e6 AS "dcTransferIot",
    {operational_select}
    (
        sum(coalesce(cast(r.gatewayreward.beaconamount     as bigint), 0))
      + sum(coalesce(cast(r.gatewayreward.dctransferamount as bigint), 0))
      + sum(coalesce(cast(r.gatewayreward.witnessamount    as bigint), 0))
      {operational_total_expr}
    ) / 1e6                                                                 AS "totalIot"
FROM helium_oracle_iot.iotrewardshare r
WHERE r.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  AND ({reward_filter})
