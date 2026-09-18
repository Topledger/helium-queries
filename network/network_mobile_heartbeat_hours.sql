-- query_name: NETWORK_MOBILE_HEARTBEAT_HOURS
WITH hourly AS (
    SELECT
        h.pubkey,
        CASE
            WHEN '{bucket}' = 'total'
                THEN '{start_date}'
            ELSE date_format(
                    date_trunc('{bucket}', CAST(h.partition_0 AS date)),
                    '%Y-%m-%dT%H:%i:%sZ'
                 )
        END                                                                 AS bucket_start,
        date_trunc('hour', from_unixtime(
            CASE
                WHEN try_cast(h.timestamp AS bigint) > 100000000000
                    THEN try_cast(h.timestamp AS bigint) / 1000.0
                ELSE try_cast(h.timestamp AS bigint)
            END
        ))                                                                  AS hour_start
    FROM helium_oracle_mobile.validatedheartbeat h
    WHERE h.partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND strpos(lower(cast(h.validity AS varchar)), 'invalid') = 0
      AND strpos(lower(cast(h.validity AS varchar)), 'valid') > 0
    GROUP BY 1, 2, 3
),
per_gateway AS (
    SELECT
        pubkey,
        bucket_start,
        count(*)                                                            AS valid_hours
    FROM hourly
    GROUP BY 1, 2
)
SELECT
    bucket_start                                                            AS "bucketStart",
    count(*)                                                                AS "gatewaysWithHeartbeat",
    count(CASE WHEN valid_hours >= 4 THEN 1 END)                            AS "gatewaysWith4h",
    count(CASE WHEN valid_hours >= 12 THEN 1 END)                           AS "gatewaysWith12h",
    count(CASE WHEN valid_hours >= 18 THEN 1 END)                           AS "gatewaysWith18h",
    avg(valid_hours)                                                        AS "avgValidHours"
FROM per_gateway
GROUP BY 1
ORDER BY 1
