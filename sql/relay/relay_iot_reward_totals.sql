-- query_name: RELAY_IOT_REWARD_TOTALS
WITH totals AS (
    SELECT
        gatewayreward.hotspotkey                                            AS hotspot_key,
        sum(coalesce(cast(gatewayreward.beaconamount     as bigint), 0))    AS beacon_bones,
        sum(coalesce(cast(gatewayreward.witnessamount    as bigint), 0))    AS witness_bones,
        sum(coalesce(cast(gatewayreward.dctransferamount as bigint), 0))    AS dc_transfer_bones,
        sum(
            coalesce(cast(gatewayreward.beaconamount     as bigint), 0)
          + coalesce(cast(gatewayreward.dctransferamount as bigint), 0)
          + coalesce(cast(gatewayreward.witnessamount    as bigint), 0)
        )                                                                   AS total_bones
    FROM helium_oracle_iot.iotrewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND gatewayreward IS NOT NULL
    GROUP BY gatewayreward.hotspotkey
)
SELECT
    t.hotspot_key                                                           AS "hotspotKey",
    hk.asset_id                                                             AS "assetId",
    hk.entity_key                                                           AS "entityKey",
    hk.entity_key_b64                                                       AS "entityKeyB64",
    hk.key_to_asset_key                                                     AS "keyToAssetKey",
    hk.dao                                                                  AS "dao",
    t.beacon_bones       / 1e6                                              AS "beaconAmount",
    t.witness_bones      / 1e6                                              AS "witnessAmount",
    t.dc_transfer_bones  / 1e6                                              AS "dcTransferAmount",
    t.total_bones        / 1e6                                              AS "total_reward"
FROM totals t
LEFT JOIN helium.hotspot_keys hk
       ON hk.hotspot_key = t.hotspot_key
ORDER BY t.total_bones DESC
OFFSET {offset} LIMIT {limit}
