-- query_name: GATEWAY_MOBILE_DAILY_DATA
-- UI: Gateway mobile daily data → GET /gateways/<address>/mobile/data
WITH resolved AS (
    SELECT DISTINCT hk.hotspot_key
    FROM helium.hotspot_keys hk
    WHERE 1 = 1
      {lookup_filter}
)
SELECT
    cast(d.partition_0 AS date)                                             AS "date",
    count(*)                                                                AS "sessionCount",
    sum(coalesce(cast(d.report.datatransferusage.uploadbytes AS bigint), 0))
                                                                            AS "uploadBytes",
    sum(coalesce(cast(d.report.datatransferusage.downloadbytes AS bigint), 0))
                                                                            AS "downloadBytes",
    sum(coalesce(cast(d.report.rewardablebytes AS bigint), 0))              AS "rewardableBytes",
    sum(
        coalesce(cast(d.report.datatransferusage.uploadbytes AS bigint), 0)
      + coalesce(cast(d.report.datatransferusage.downloadbytes AS bigint), 0)
    )                                                                       AS "totalBytes"
FROM helium_oracle_mobile.datatransfersessioningestreport d
JOIN resolved r
  ON r.hotspot_key = d.report.datatransferusage.pubkey
WHERE d.partition_0 BETWEEN '{start_date}' AND '{end_date}'
GROUP BY 1
ORDER BY 1 DESC
