-- query_name: IOT_GATEWAY_DATA
-- One hotspot, date range → one row per day with packet counts and avg/min/max RF metrics.
SELECT
    date_format(
        date_trunc('day', CAST(p.partition_0 AS date)),
        '%Y-%m-%dT%H:%i:%sZ'
    )                                                                       AS "bucketStart",
    count(*)                                                                AS "packetCount",
    sum(coalesce(cast(p.payloadsize AS bigint), 0))                         AS "totalPayloadSize",
    avg(coalesce(cast(p.payloadsize AS bigint), 0))                         AS "avgPayloadSize",
    min(coalesce(cast(p.payloadsize AS bigint), 0))                         AS "minPayloadSize",
    max(coalesce(cast(p.payloadsize AS bigint), 0))                         AS "maxPayloadSize",
    count(CASE WHEN lower(cast(p.type AS varchar)) = 'join' THEN 1 END)
                                                                            AS "joinCount",
    count(CASE WHEN lower(cast(p.type AS varchar)) = 'uplink' THEN 1 END)
                                                                            AS "uplinkCount",
    avg(p.rssi)                                                             AS "avgRssi",
    min(p.rssi)                                                             AS "minRssi",
    max(p.rssi)                                                             AS "maxRssi",
    avg(p.snr)                                                              AS "avgSnr",
    min(p.snr)                                                              AS "minSnr",
    max(p.snr)                                                              AS "maxSnr",
    avg(p.frequency)                                                        AS "avgFrequency",
    min(p.frequency)                                                        AS "minFrequency",
    max(p.frequency)                                                        AS "maxFrequency"
FROM helium_oracle_iot.packetreport p
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = p.gateway
WHERE p.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  {lookup_filter}
GROUP BY 1
ORDER BY 1
