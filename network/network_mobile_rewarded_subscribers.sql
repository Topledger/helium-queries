-- query_name: NETWORK_MOBILE_REWARDED_SUBSCRIBERS
SELECT
    CASE
        WHEN '{bucket}' = 'total'
            THEN '{start_date}'
        ELSE date_format(
                date_trunc('{bucket}', CAST(r.partition_0 AS date)),
                '%Y-%m-%dT%H:%i:%sZ'
             )
    END                                                                     AS "bucketStart",
    count(DISTINCT r.subscriberreward.subscriberid)                         AS "rewardedSubscribers",
    sum(coalesce(cast(r.subscriberreward.discoverylocationamount AS bigint), 0))
        / 1e6                                                               AS "discoveryLocationAmount"
FROM helium_oracle_mobile.mobilerewardshare r
WHERE r.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  AND r.subscriberreward IS NOT NULL
GROUP BY 1
ORDER BY 1
