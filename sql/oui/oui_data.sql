-- query_name: OUI_DATA
WITH cte_oui AS (
    SELECT cast(oui AS varchar) AS oui_id
    FROM helium.oui_mapping
    WHERE cast(oui AS varchar) = '{oui_id}'
)
SELECT
    '{oui_id}'                                                              AS "oui",
    cast(p.partition_0 AS date)                                             AS "date",
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
