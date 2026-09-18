-- query_name: GATEWAY_IOT_DATA_DUPLICATES
SELECT
    hk.hotspot_key                                                          AS "hotspotKey",
    p.payloadhash                                                           AS "payloadHash",
    count(*)                                                                AS "appearances",
    sum(coalesce(cast(p.payloadsize AS bigint), 0))                         AS "totalPayloadSize"
FROM helium_oracle_iot.packetreport p
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = p.gateway
WHERE p.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  {lookup_filter}
  AND p.payloadhash IS NOT NULL
  AND p.payloadhash <> ''
GROUP BY 1, 2
HAVING count(*) > 1
ORDER BY 3 DESC
LIMIT {limit}
