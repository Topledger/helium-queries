-- query_name: NETWORK_IOT_DATA
SELECT
    CASE
        WHEN '{bucket}' = 'total'
            THEN '{start_date}'
        ELSE date_format(
                date_trunc('{bucket}', CAST(p.partition_0 AS date)),
                '%Y-%m-%dT%H:%i:%sZ'
             )
    END                                                                     AS "bucketStart",
    count(*)                                                                AS "packetCount",
    sum(coalesce(cast(p.payloadsize AS bigint), 0))                         AS "totalPayloadSize",
    count(DISTINCT p.gateway)                                               AS "uniqueGateways",
    count(CASE WHEN lower(cast(p.type AS varchar)) = 'join' THEN 1 END)
                                                                            AS "joinCount",
    count(CASE WHEN lower(cast(p.type AS varchar)) = 'uplink' THEN 1 END)
                                                                            AS "uplinkCount"
FROM helium_oracle_iot.packetreport p
WHERE p.partition_0 BETWEEN '{start_date}' AND '{end_date}'
GROUP BY 1
ORDER BY 1
