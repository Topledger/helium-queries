-- query_name: GATEWAY_MOBILE_DATA_SUM
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
                    date_trunc('{bucket}', CAST(d.partition_0 AS date)),
                    '%Y-%m-%dT%H:%i:%sZ'
                 )
        ELSE date_format(
                date_trunc('{bucket}', from_unixtime(
                    CASE
                        WHEN try_cast(d.report.datatransferusage.timestamp AS bigint) > 100000000000
                            THEN try_cast(d.report.datatransferusage.timestamp AS bigint) / 1000.0
                        ELSE try_cast(d.report.datatransferusage.timestamp AS bigint)
                    END
                )),
                '%Y-%m-%dT%H:%i:%sZ'
             )
    END                                                                     AS "bucketStart",
    count(*)                                                                AS "sessionCount",
    sum(coalesce(cast(d.report.datatransferusage.uploadbytes AS bigint), 0))
                                                                            AS "uploadBytes",
    sum(coalesce(cast(d.report.datatransferusage.downloadbytes AS bigint), 0))
                                                                            AS "downloadBytes",
    sum(coalesce(cast(d.report.rewardablebytes AS bigint), 0))              AS "rewardableBytes",
    sum(
        coalesce(cast(d.report.datatransferusage.uploadbytes AS bigint), 0)
      + coalesce(cast(d.report.datatransferusage.downloadbytes AS bigint), 0)
    )                                                                       AS "totalBytes"
FROM helium_oracle_mobile.datatransfersessioningestreport d
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = d.report.pubkey
WHERE d.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  {lookup_filter}
GROUP BY 1, 2, 3, 4, 5
ORDER BY 5
