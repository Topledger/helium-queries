-- query_name: NETWORK_MOBILE_DAILY_DATA
-- UI: Network mobile daily data → GET /v1/helium/l2/network/mobile/data
SELECT
    cast(d.partition_0 AS date)                                             AS "date",
    count(*)                                                                AS "sessionCount",
    sum(coalesce(cast(d.report.datatransferusage.uploadbytes AS bigint), 0))
                                                                            AS "uploadBytes",
    sum(coalesce(cast(d.report.datatransferusage.downloadbytes AS bigint), 0))
                                                                            AS "downloadBytes",
    sum(coalesce(cast(d.report.rewardablebytes AS bigint), 0))              AS "rewardableBytes",
    count(DISTINCT d.report.datatransferusage.pubkey)                       AS "uniqueGateways"
FROM helium_oracle_mobile.datatransfersessioningestreport d
WHERE d.partition_0 BETWEEN '{start_date}' AND '{end_date}'
GROUP BY 1
ORDER BY 1
