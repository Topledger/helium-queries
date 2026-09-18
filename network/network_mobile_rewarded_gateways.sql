-- query_name: NETWORK_MOBILE_REWARDED_GATEWAYS
WITH rows AS (
    SELECT
        partition_0,
        radioreward.hotspotkey                                              AS hotspot_key,
        coalesce(cast(radioreward.pocreward AS bigint), 0)                  AS poc_bones,
        coalesce(cast(radioreward.dctransferreward AS bigint), 0)           AS dc_bones
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND radioreward IS NOT NULL

    UNION ALL

    SELECT
        partition_0,
        gatewayreward.hotspotkey,
        cast(0 AS bigint),
        coalesce(cast(gatewayreward.dctransferreward AS bigint), 0)
    FROM helium_oracle_mobile.mobilerewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND gatewayreward IS NOT NULL
)
SELECT
    CASE
        WHEN '{bucket}' = 'total'
            THEN '{start_date}'
        ELSE date_format(
                date_trunc('{bucket}', CAST(partition_0 AS date)),
                '%Y-%m-%dT%H:%i:%sZ'
             )
    END                                                                     AS "bucketStart",
    count(DISTINCT hotspot_key)                                             AS "rewardedGateways",
    count(DISTINCT CASE WHEN poc_bones > 0 THEN hotspot_key END)            AS "pocGateways",
    count(DISTINCT CASE WHEN dc_bones > 0 THEN hotspot_key END)             AS "dcTransferGateways",
    sum(poc_bones) / 1e6                                                    AS "pocReward",
    sum(dc_bones) / 1e6                                                     AS "dcTransferReward",
    sum(poc_bones + dc_bones) / 1e6                                         AS "totalReward"
FROM rows
GROUP BY 1
ORDER BY 1
