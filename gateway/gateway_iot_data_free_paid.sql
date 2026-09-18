-- query_name: GATEWAY_IOT_DATA_FREE_PAID
SELECT
    hk.hotspot_key                                                          AS "hotspotKey",
    CASE
        WHEN '{bucket}' = 'total'
            THEN '{start_date}'
        WHEN '{bucket}' IN ('day', 'week')
            THEN date_format(
                    date_trunc('{bucket}', CAST(p.partition_0 AS date)),
                    '%Y-%m-%dT%H:%i:%sZ'
                 )
        ELSE date_format(
                date_trunc('{bucket}', from_unixtime(
                    CASE
                        WHEN try_cast(p.receivedtimestamp AS bigint) > 100000000000
                            THEN try_cast(p.receivedtimestamp AS bigint) / 1000.0
                        ELSE try_cast(p.receivedtimestamp AS bigint)
                    END
                )),
                '%Y-%m-%dT%H:%i:%sZ'
             )
    END                                                                     AS "bucketStart",
    count(*)                                                                AS "packetCount",
    count(CASE WHEN p.free = true THEN 1 END)                               AS "freeCount",
    count(CASE WHEN p.free = false THEN 1 END)                              AS "paidCount",
    sum(CASE WHEN p.free = true THEN coalesce(cast(p.payloadsize AS bigint), 0) ELSE 0 END)
                                                                            AS "freePayloadSize",
    sum(CASE WHEN p.free = false THEN coalesce(cast(p.payloadsize AS bigint), 0) ELSE 0 END)
                                                                            AS "paidPayloadSize"
FROM helium_oracle_iot.packetreport p
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = p.gateway
WHERE p.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  {lookup_filter}
GROUP BY 1, 2
ORDER BY 2
