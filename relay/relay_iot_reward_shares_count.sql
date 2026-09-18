-- query_name: RELAY_IOT_REWARD_SHARES_COUNT
SELECT count(*) AS total
FROM helium_oracle_iot.iotrewardshare r
LEFT JOIN helium.hotspot_keys hk
       ON hk.hotspot_key = r.gatewayreward.hotspotkey
WHERE r.partition_0 BETWEEN '{start_date}' AND '{end_date}'
  AND r.gatewayreward IS NOT NULL
  AND ('{entity_key}' = '' OR hk.entity_key = '{entity_key}')
  {hotspot_filter}
