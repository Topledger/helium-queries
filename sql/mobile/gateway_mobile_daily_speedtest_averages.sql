-- query_name: GATEWAY_MOBILE_DAILY_SPEEDTEST_AVERAGES
-- UI: Gateway mobile daily speedtest averages → GET /v1/helium/l2/gateways/<address>/mobile/speedtests/averages
WITH resolved AS (
    SELECT DISTINCT hk.hotspot_key
    FROM helium.hotspot_keys hk
    WHERE 1 = 1
      {lookup_filter}
)
SELECT
    cast(s.partition_0 AS date)                                             AS "date",
    count(*)                                                                AS "sampleCount",
    avg(cast(s.uploadspeedavgbps AS bigint))                                AS "uploadSpeedAvgBps",
    avg(cast(s.downloadspeedavgbps AS bigint))                              AS "downloadSpeedAvgBps",
    avg(cast(s.latencyavgms AS bigint))                                     AS "latencyAvgMs",
    avg(cast(s.rewardmultiplier AS double))                                 AS "rewardMultiplierAvg"
FROM helium_oracle_mobile.speedtestavg s
WHERE s.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  AND s.pubkey IN (SELECT hotspot_key FROM resolved)
GROUP BY 1
ORDER BY 1 DESC
