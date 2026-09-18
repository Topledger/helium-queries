-- query_name: RELAY_IOT_REWARD_TOTALS_COUNT
SELECT count(*) AS total
FROM (
    SELECT gatewayreward.hotspotkey
    FROM helium_oracle_iot.iotrewardshare
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND gatewayreward IS NOT NULL
    GROUP BY gatewayreward.hotspotkey
) t
