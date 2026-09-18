-- query_name: OUI_TOP_GATEWAYS_BY_PAYLOAD
WITH cte_oui AS (
    SELECT cast(oui AS varchar) AS oui_id, escrow AS oui_escrow_account
    FROM helium.oui_mapping
    WHERE cast(oui AS varchar) = '{oui_id}'
)
SELECT
    a.oui AS "oui",
    b.entity_key AS "entityKey",
    b.key_to_asset_key AS "keyToAssetKey",
    a.gateway AS "gateway",
    a.total_payloadsize AS "totalPayloadSize"
FROM (
    SELECT oui, gateway, sum(payloadsize) AS total_payloadsize
    FROM helium_oracle_iot.packetreport a
    JOIN cte_oui b ON a.oui = b.oui_id
    WHERE date(partition_0) >= date('{start_date}')
      AND date(partition_0) <= date('{end_date}')
    GROUP BY 1, 2
    ORDER BY 3 DESC
    LIMIT {limit}
) a
JOIN helium.hotspot_keys b ON a.gateway = b.hotspot_key
ORDER BY a.total_payloadsize DESC
