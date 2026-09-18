-- query_name: GATEWAY_IOT_RF
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
    avg(p.rssi)                                                             AS "avgRssi",
    min(p.rssi)                                                             AS "minRssi",
    max(p.rssi)                                                             AS "maxRssi",
    avg(p.snr)                                                              AS "avgSnr",
    min(p.snr)                                                              AS "minSnr",
    max(p.snr)                                                              AS "maxSnr",
    avg(p.frequency)                                                        AS "avgFrequency"
FROM helium_oracle_iot.packetreport p
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = p.gateway
WHERE p.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  {lookup_filter}
GROUP BY 1, 2
ORDER BY 2
