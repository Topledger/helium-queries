-- query_name: GATEWAY_IOT_DATA_SUM
SELECT
    hk.hotspot_key                                                          AS "hotspotKey",
    hk.asset_id                                                             AS "assetId",
    hk.entity_key                                                           AS "entityKey",
    hk.key_to_asset_key                                                     AS "keyToAssetKey",
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
    count(CASE WHEN lower(cast(p.type AS varchar)) = 'join' THEN 1 END)
                                                                            AS "joinCount",
    count(CASE WHEN lower(cast(p.type AS varchar)) = 'uplink' THEN 1 END)
                                                                            AS "uplinkCount"
FROM helium_oracle_iot.packetreport p
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = p.gateway
WHERE p.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  {lookup_filter}
GROUP BY 1, 2, 3, 4, 5
ORDER BY 5
