-- query_name: GATEWAY_MOBILE_DAILY_HEARTBEAT_HOURS
-- UI: Gateway mobile daily heartbeat → GET /v1/helium/l2/gateways/<address>/mobile/heartbeat-hours
WITH resolved AS (
    SELECT DISTINCT hk.hotspot_key
    FROM helium.hotspot_keys hk
    WHERE 1 = 1
      {lookup_filter}
)
SELECT
    cast(h.partition_0 AS date)                                             AS "date",
    count(*)                                                                AS "heartbeatCount",
    count(
        CASE
            WHEN strpos(lower(cast(h.validity AS varchar)), 'invalid') = 0
             AND strpos(lower(cast(h.validity AS varchar)), 'valid') > 0
            THEN 1
        END
    )                                                                       AS "validHeartbeatCount",
    count(DISTINCT
        CASE
            WHEN strpos(lower(cast(h.validity AS varchar)), 'invalid') = 0
             AND strpos(lower(cast(h.validity AS varchar)), 'valid') > 0
            THEN date_trunc(
                'hour',
                from_unixtime(
                    CASE
                        WHEN try_cast(h.timestamp AS bigint) > 100000000000
                            THEN try_cast(h.timestamp AS bigint) / 1000.0
                        ELSE try_cast(h.timestamp AS bigint)
                    END
                )
            )
        END
    )                                                                       AS "validHeartbeatHours",
    max(h.celltype)                                                         AS "cellType"
FROM helium_oracle_mobile.validatedheartbeat h
WHERE h.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  AND h.pubkey IN (SELECT hotspot_key FROM resolved)
GROUP BY 1
ORDER BY 1 DESC
