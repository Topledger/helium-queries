-- query_name: NETWORK_MOBILE_DAILY_SPEEDTEST_AVERAGES
-- UI: Network mobile daily speedtest averages → GET /v1/helium/l2/network/mobile/speedtests/averages
SELECT
    cast(s.partition_0 AS date)                                             AS "date",
    count(*)                                                                AS "sampleCount",
    count(DISTINCT s.pubkey)                                                AS "uniqueGateways",
    avg(cast(s.uploadspeedavgbps AS bigint))                                AS "uploadSpeedAvgBps",
    avg(cast(s.downloadspeedavgbps AS bigint))                              AS "downloadSpeedAvgBps",
    avg(cast(s.latencyavgms AS bigint))                                     AS "latencyAvgMs",
    avg(cast(s.rewardmultiplier AS double))                                 AS "rewardMultiplierAvg"
FROM helium_oracle_mobile.speedtestavg s
WHERE s.partition_0 BETWEEN '{start_date}' AND '{end_date}'
GROUP BY 1
ORDER BY 1 DESC
