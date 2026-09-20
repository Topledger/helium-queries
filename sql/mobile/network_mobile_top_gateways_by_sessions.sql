-- query_name: NETWORK_MOBILE_TOP_GATEWAYS_BY_SESSIONS
-- UI: Top gateways by sessions → GET /v1/helium/l2/network/mobile/top-by-sessions
SELECT
    d.report.datatransferusage.pubkey                                       AS "hotspotKey",
    hk.asset_id                                                             AS "assetId",
    hk.entity_key                                                           AS "entityKey",
    hk.entity_key_b64                                                       AS "entityKeyB64",
    hk.key_to_asset_key                                                     AS "keyToAssetKey",
    count(*)                                                                AS "sessionCount",
    sum(coalesce(cast(d.report.datatransferusage.uploadbytes AS bigint), 0))
                                                                            AS "uploadBytes",
    sum(coalesce(cast(d.report.datatransferusage.downloadbytes AS bigint), 0))
                                                                            AS "downloadBytes",
    sum(
        coalesce(cast(d.report.datatransferusage.uploadbytes AS bigint), 0)
      + coalesce(cast(d.report.datatransferusage.downloadbytes AS bigint), 0)
    )                                                                       AS "totalBytes",
    sum(coalesce(cast(d.report.rewardablebytes AS bigint), 0))              AS "rewardableBytes"
FROM helium_oracle_mobile.datatransfersessioningestreport d
LEFT JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = d.report.datatransferusage.pubkey
WHERE d.partition_0 BETWEEN '{start_date}' AND '{end_date}'
GROUP BY 1, 2, 3, 4, 5
ORDER BY 6 DESC
LIMIT {limit}
