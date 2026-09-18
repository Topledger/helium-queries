-- query_name: GATEWAY_MOBILE_DATA
SELECT
    d.report.pubkey                                                         AS "hotspotKey",
    hk.asset_id                                                             AS "assetId",
    hk.entity_key                                                           AS "entityKey",
    hk.entity_key_b64                                                       AS "entityKeyB64",
    hk.key_to_asset_key                                                     AS "keyToAssetKey",
    hk.dao                                                                  AS "dao",
    d.receivedtimestamp                                                     AS "receivedTimestamp",
    d.report.datatransferusage.payer                                        AS "payer",
    d.report.datatransferusage.radioaccesstechnology                        AS "radioAccessTechnology",
    d.report.datatransferusage.eventid                                      AS "eventId",
    d.report.datatransferusage.timestamp                                    AS "usageTimestamp",
    cast(d.report.datatransferusage.uploadbytes   as bigint)                AS "uploadBytes",
    cast(d.report.datatransferusage.downloadbytes as bigint)                AS "downloadBytes",
    cast(d.report.rewardablebytes                  as bigint)               AS "rewardableBytes",
    d.report.rewardcancelled                                                AS "rewardCancelled"
FROM helium_oracle_mobile.datatransfersessioningestreport d
JOIN helium.hotspot_keys hk
  ON hk.hotspot_key = d.report.pubkey
WHERE d.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  {lookup_filter}
ORDER BY d.receivedtimestamp DESC
OFFSET {offset} LIMIT {limit}
