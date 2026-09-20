-- query_name: NETWORK_MOBILE_DAILY_REWARD
-- UI: Network mobile daily reward → GET /v1/helium/l2/mobile-reward-shares
-- Network-wide MOBILE rewards rolled up to one row per partition day.
WITH rows AS (
    SELECT
        partition_0,
        radioreward.hotspotkey                                              AS hotspot_key,
        coalesce(cast(radioreward.pocreward AS bigint), 0)                  AS poc_bones,
        coalesce(cast(radioreward.dctransferreward AS bigint), 0)           AS dc_bones
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND radioreward IS NOT NULL
      {hotspot_filter_radio}

    UNION ALL

    SELECT
        partition_0,
        gatewayreward.hotspotkey,
        cast(0 AS bigint),
        coalesce(cast(gatewayreward.dctransferreward AS bigint), 0)
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND gatewayreward IS NOT NULL
      {hotspot_filter_gateway}
)
SELECT
    cast(partition_0 AS date)                                               AS "rewardDate",
    count(DISTINCT hotspot_key)                                             AS "uniqueHotspots",
    sum(poc_bones) / 1e6                                                    AS "pocReward",
    sum(dc_bones) / 1e6                                                     AS "dcTransferReward",
    sum(poc_bones + dc_bones) / 1e6                                         AS "total_reward"
FROM rows
GROUP BY 1
ORDER BY 1 DESC
