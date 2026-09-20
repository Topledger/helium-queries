-- query_name: GATEWAY_MOBILE_DAILY_REWARD
-- UI: Gateway mobile daily reward → GET /gateways/<address>/mobile/rewards
-- One gateway → daily MOBILE rewards (radio PoC + DC, gateway DC).
WITH resolved AS (
    SELECT DISTINCT hk.hotspot_key
    FROM helium.hotspot_keys hk
    WHERE 1 = 1
      {lookup_filter}
),
rows AS (
    SELECT
        partition_0,
        coalesce(cast(radioreward.pocreward AS bigint), 0)                  AS poc_bones,
        coalesce(cast(radioreward.dctransferreward AS bigint), 0)           AS dc_bones
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND radioreward IS NOT NULL
      AND radioreward.hotspotkey IN (SELECT hotspot_key FROM resolved)

    UNION ALL

    SELECT
        partition_0,
        cast(0 AS bigint),
        coalesce(cast(gatewayreward.dctransferreward AS bigint), 0)
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND gatewayreward IS NOT NULL
      AND gatewayreward.hotspotkey IN (SELECT hotspot_key FROM resolved)
)
SELECT
    cast(partition_0 AS date)                                               AS "rewardDate",
    sum(poc_bones) / 1e6                                                    AS "pocReward",
    sum(dc_bones) / 1e6                                                     AS "dcTransferReward",
    sum(poc_bones + dc_bones) / 1e6                                         AS "total_reward"
FROM rows
GROUP BY 1
ORDER BY 1 DESC
