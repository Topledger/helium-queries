-- query_name: NETWORK_IOT_DATA_BY_REGION
SELECT
    p.region                                                                AS "region",
    count(*)                                                                AS "packetCount",
    sum(coalesce(cast(p.payloadsize AS bigint), 0))                         AS "totalPayloadSize",
    count(DISTINCT p.gateway)                                               AS "uniqueGateways",
    avg(p.rssi)                                                             AS "avgRssi",
    avg(p.snr)                                                              AS "avgSnr"
FROM helium_oracle_iot.packetreport p
WHERE p.partition_0 BETWEEN '{start_date}' AND '{end_date}'
GROUP BY 1
ORDER BY 2 DESC
