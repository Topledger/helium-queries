-- query_name: IOT_DATARATES
-- Lookup: every distinct LoRa datarate in packet data (feeds datarate filter).
SELECT DISTINCT
    cast(p.datarate AS varchar)                                             AS "dataRate"
FROM helium_oracle_iot.packetreport p
WHERE p.datarate IS NOT NULL
  AND cast(p.datarate AS varchar) <> ''
ORDER BY 1
