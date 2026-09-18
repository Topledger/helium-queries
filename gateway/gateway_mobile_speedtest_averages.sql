-- query_name: GATEWAY_MOBILE_SPEEDTEST_AVERAGES
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
                    date_trunc('{bucket}', CAST(s.partition_0 AS date)),
                    '%Y-%m-%dT%H:%i:%sZ'
                 )
        ELSE date_format(
                date_trunc('{bucket}', from_unixtime(
                    CASE
                        WHEN try_cast(s.timestamp AS bigint) > 100000000000
                            THEN try_cast(s.timestamp AS bigint) / 1000.0
                        ELSE try_cast(s.timestamp AS bigint)
                    END
                )),
                '%Y-%m-%dT%H:%i:%sZ'
             )
    END                                                                     AS "bucketStart",
    count(*)                                                                AS "sampleCount",
    avg(cast(s.uploadspeedavgbps AS bigint))                                AS "uploadSpeedAvgBps",
    avg(cast(s.downloadspeedavgbps AS bigint))                              AS "downloadSpeedAvgBps",
    avg(cast(s.latencyavgms AS bigint))                                     AS "latencyAvgMs",
    avg(cast(s.rewardmultiplier AS double))                                 AS "rewardMultiplierAvg"
FROM helium_oracle_mobile.speedtestavg s
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = s.pubkey
WHERE s.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  {lookup_filter}
GROUP BY 1, 2, 3, 4, 5
ORDER BY 5
