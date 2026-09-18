-- query_name: GATEWAY_MOBILE_DAILY_REWARD
-- UI: Gateway mobile daily reward → GET /gateways/<address>/mobile/rewards
-- One gateway → daily DC transfer MOBILE rewards.
WITH resolved AS (
    SELECT DISTINCT hk.hotspot_key
    FROM helium.hotspot_keys hk
    WHERE 1 = 1
      {lookup_filter}
),
rows AS (
    SELECT
        partition_0,
        coalesce(cast(radioreward.dctransferreward as bigint), 0)           AS dc_bones
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND radioreward IS NOT NULL
      AND radioreward.hotspotkey IN (SELECT hotspot_key FROM resolved)

    UNION ALL

    SELECT
        partition_0,
        coalesce(cast(gatewayreward.dctransferreward as bigint), 0)
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND gatewayreward IS NOT NULL
      AND gatewayreward.hotspotkey IN (SELECT hotspot_key FROM resolved)
)
SELECT
    cast(partition_0 AS date)                                               AS "rewardDate",
    sum(dc_bones) / 1e6                                                     AS "dcTransferReward",
    sum(dc_bones) / 1e6                                                     AS "total_reward"
FROM rows
GROUP BY 1
ORDER BY 1 DESC
