-- query_name: OUI_DATA
WITH cte_oui AS (
    SELECT cast(oui AS varchar) AS oui_id
    FROM helium.oui_mapping
    WHERE cast(oui AS varchar) = '{oui_id}'
)
SELECT
    '{oui_id}'                                                              AS "oui",
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
    sum(coalesce(cast(p.payloadsize AS bigint), 0))                         AS "totalPayloadSize",
    count(DISTINCT p.gateway)                                               AS "uniqueGateways",
    count(CASE WHEN lower(cast(p.type AS varchar)) = 'join' THEN 1 END)
                                                                            AS "joinCount",
    count(CASE WHEN lower(cast(p.type AS varchar)) = 'uplink' THEN 1 END)
                                                                            AS "uplinkCount"
FROM helium_oracle_iot.packetreport p
JOIN cte_oui b ON p.oui = b.oui_id
WHERE p.partition_0 BETWEEN '{start_date}' AND '{end_date}'
GROUP BY 1, 2
ORDER BY 2
