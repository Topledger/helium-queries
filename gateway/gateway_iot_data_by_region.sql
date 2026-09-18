-- query_name: GATEWAY_IOT_DATA_BY_REGION
SELECT
    hk.hotspot_key                                                          AS "hotspotKey",
    p.region                                                                AS "region",
    count(*)                                                                AS "packetCount",
    sum(coalesce(cast(p.payloadsize AS bigint), 0))                         AS "totalPayloadSize",
    avg(p.rssi)                                                             AS "avgRssi",
    avg(p.snr)                                                              AS "avgSnr"
FROM helium_oracle_iot.packetreport p
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = p.gateway
WHERE p.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  {lookup_filter}
GROUP BY 1, 2
ORDER BY 3 DESC
