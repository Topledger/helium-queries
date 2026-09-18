-- query_name: NETWORK_MOBILE_REWARDED_RADIOS
SELECT
    CASE
        WHEN '{bucket}' = 'total'
            THEN '{start_date}'
        ELSE date_format(
                date_trunc('{bucket}', CAST(r.partition_0 AS date)),
                '%Y-%m-%dT%H:%i:%sZ'
             )
    END                                                                     AS "bucketStart",
    count(DISTINCT r.radioreward.cbsdid)                                    AS "rewardedRadios",
    count(DISTINCT r.radioreward.hotspotkey)                                AS "rewardedGateways",
    sum(coalesce(cast(r.radioreward.pocreward AS bigint), 0)) / 1e6         AS "pocReward",
    sum(coalesce(cast(r.radioreward.dctransferreward AS bigint), 0)) / 1e6  AS "dcTransferReward",
    sum(
        coalesce(cast(r.radioreward.pocreward AS bigint), 0)
      + coalesce(cast(r.radioreward.dctransferreward AS bigint), 0)
    ) / 1e6                                                                 AS "totalReward"
FROM helium_oracle_mobile.mobilerewardshare r
WHERE r.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  AND r.radioreward IS NOT NULL
GROUP BY 1
ORDER BY 1
