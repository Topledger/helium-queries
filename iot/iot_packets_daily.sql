-- query_name: IOT_PACKETS_DAILY
-- Date range → one row per day. Optional filters: region, datarate, type, billing.
SELECT
    date_format(
        date_trunc('day', CAST(p.partition_0 AS date)),
        '%Y-%m-%dT%H:%i:%sZ'
    )                                                                       AS "bucketStart",
    count(*)                                                                AS "packetCount",
    sum(coalesce(cast(p.payloadsize AS bigint), 0))                         AS "totalPayloadSize",
    count(DISTINCT p.gateway)                                               AS "uniqueHotspots",
    count(CASE WHEN lower(cast(p.type AS varchar)) = 'join' THEN 1 END)
                                                                            AS "joinCount",
    count(CASE WHEN lower(cast(p.type AS varchar)) = 'uplink' THEN 1 END)
                                                                            AS "uplinkCount",
    count(CASE WHEN p.free = true THEN 1 END)                               AS "freeCount",
    count(CASE WHEN p.free = false THEN 1 END)                              AS "paidCount",
    sum(CASE WHEN p.free = true THEN coalesce(cast(p.payloadsize AS bigint), 0) ELSE 0 END)
                                                                            AS "freePayloadSize",
    sum(CASE WHEN p.free = false THEN coalesce(cast(p.payloadsize AS bigint), 0) ELSE 0 END)
                                                                            AS "paidPayloadSize",
    sum(CASE
            WHEN p.free = false
            THEN CAST(ceiling(cast(coalesce(p.payloadsize, 0) AS double) / 24.0) AS bigint)
            ELSE 0
        END)                                                                AS "estimatedDc",
    CASE
        WHEN count(*) = 0 THEN 0
        ELSE 100.0 * count(CASE WHEN p.free = false THEN 1 END) / count(*)
    END                                                                     AS "paidPct",
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
WHERE p.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  {region_filter}
  {datarate_filter}
  {type_filter}
  {billing_filter}
GROUP BY 1
ORDER BY 1
