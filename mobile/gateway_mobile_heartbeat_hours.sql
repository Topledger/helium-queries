-- query_name: GATEWAY_MOBILE_HEARTBEAT_HOURS
-- UI: Gateway mobile heartbeat hours → GET /v1/helium/l2/gateways/<address>/mobile/heartbeat-hours
SELECT
    hk.hotspot_key                                                          AS "hotspotKey",
    hk.asset_id                                                             AS "assetId",
    hk.entity_key                                                           AS "entityKey",
    hk.key_to_asset_key                                                     AS "keyToAssetKey",
    date_format(
        date_trunc('hour', from_unixtime(
            CASE
                WHEN try_cast(h.timestamp AS bigint) > 100000000000
                    THEN try_cast(h.timestamp AS bigint) / 1000.0
                ELSE try_cast(h.timestamp AS bigint)
            END
        )),
        '%Y-%m-%dT%H:%i:%sZ'
    )                                                                       AS "hourStart",
    count(*)                                                                AS "heartbeatCount",
    count(CASE
        WHEN strpos(lower(cast(h.validity AS varchar)), 'invalid') = 0
         AND strpos(lower(cast(h.validity AS varchar)), 'valid') > 0
        THEN 1
    END)                                                                    AS "validHeartbeatCount",
    max(h.celltype)                                                         AS "cellType"
FROM helium_oracle_mobile.validatedheartbeat h
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = h.pubkey
WHERE h.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  {lookup_filter}
GROUP BY 1, 2, 3, 4, 5
ORDER BY 5 DESC
OFFSET {offset} LIMIT {limit}
