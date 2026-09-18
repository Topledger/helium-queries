-- query_name: GATEWAY_IOT_DATA
SELECT
    p.gateway                                                               AS "hotspotKey",
    hk.asset_id                                                             AS "assetId",
    hk.entity_key                                                           AS "entityKey",
    hk.entity_key_b64                                                       AS "entityKeyB64",
    hk.key_to_asset_key                                                     AS "keyToAssetKey",
    hk.dao                                                                  AS "dao",
    p.oui                                                                   AS "oui",
    p.netid                                                                 AS "netId",
    p.type                                                                  AS "packetType",
    p.free                                                                  AS "free",
    p.payloadsize                                                           AS "payloadSize",
    p.payloadhash                                                           AS "payloadHash",
    p.rssi                                                                  AS "rssi",
    p.snr                                                                   AS "snr",
    p.frequency                                                             AS "frequency",
    p.datarate                                                              AS "dataRate",
    p.region                                                                AS "region",
    p.receivedtimestamp                                                     AS "receivedTimestamp",
    p.partition_0                                                           AS "partitionDate"
FROM helium_oracle_iot.packetreport p
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = p.gateway
WHERE p.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  {lookup_filter}
  {type_filter}
  {free_filter}
ORDER BY p.receivedtimestamp DESC
OFFSET {offset} LIMIT {limit}
