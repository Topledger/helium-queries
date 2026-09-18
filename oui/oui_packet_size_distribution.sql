-- query_name: OUI_PACKET_SIZE_DISTRIBUTION
WITH cte_oui AS (
    SELECT cast(oui AS varchar) AS oui_id, escrow AS oui_escrow_account
    FROM helium.oui_mapping
    WHERE cast(oui AS varchar) = '{oui_id}'
)
SELECT
    partition_0 AS "partitionDate",
    CASE
        WHEN payloadsize <= 24 THEN '0-24 bytes'
        WHEN payloadsize <= 72 THEN '24-72 bytes'
        WHEN payloadsize <= 120 THEN '72-120 bytes'
        WHEN payloadsize <= 192 THEN '120-192 bytes'
        WHEN payloadsize <= 240 THEN '192-240 bytes'
        WHEN payloadsize <= 288 THEN '240-288 bytes'
        WHEN payloadsize <= 360 THEN '288-360 bytes'
        WHEN payloadsize > 360 THEN '>360 bytes'
    END AS "payloadSizeGroup",
    count(*) AS "packetCount"
FROM helium_oracle_iot.packetreport a
JOIN cte_oui b ON a.oui = b.oui_id
WHERE date(partition_0) >= date('{start_date}')
  AND date(partition_0) <= date('{end_date}')
GROUP BY 1, 2
ORDER BY 1, 2
