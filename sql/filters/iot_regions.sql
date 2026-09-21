-- query_name: IOT_REGIONS
-- Lookup: every distinct RF region ever seen in packet data (feeds region filter).
SELECT DISTINCT
    cast(p.region AS varchar)                                               AS "region"
FROM helium_oracle_iot.packetreport p
WHERE p.region IS NOT NULL
  AND cast(p.region AS varchar) <> ''
ORDER BY 1
