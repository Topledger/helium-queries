-- query_name: L1_ACTIVITY_DAILY
-- Significant Helium L1 activity: gateways, locations, transfers, payments, and burns.
WITH tx AS (
    SELECT
        partition_0,
        type,
        fields
    FROM helium.l1_transactions
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND partition_0 >= '2019-07-29'
      AND partition_0 <= '2023-04-18'
      AND type IN (
          'add_gateway_v1',
          'assert_location_v1',
          'assert_location_v2',
          'transfer_hotspot_v1',
          'transfer_hotspot_v2',
          'payment_v1',
          'payment_v2',
          'token_burn_v1'
      )
),
payment_v2_amounts AS (
    SELECT
        t.partition_0,
        coalesce(try_cast(json_extract_scalar(p.payment, '$.amount') AS double), 0) AS bones
    FROM tx t
    CROSS JOIN UNNEST(CAST(json_extract(t.fields, '$.payments') AS array(json))) AS p(payment)
    WHERE t.type = 'payment_v2'
)
SELECT
    date_format(CAST(t.partition_0 AS date), '%Y-%m-%dT%H:%i:%sZ')          AS "date",
    count_if(t.type = 'add_gateway_v1')                                     AS "gatewaysAdded",
    count_if(t.type IN ('assert_location_v1', 'assert_location_v2'))        AS "locationsAsserted",
    count_if(t.type IN ('transfer_hotspot_v1', 'transfer_hotspot_v2'))      AS "hotspotsTransferred",
    count_if(t.type IN ('payment_v1', 'payment_v2'))                        AS "paymentCount",
    (
        sum(CASE
            WHEN t.type = 'payment_v1'
            THEN coalesce(try_cast(json_extract_scalar(t.fields, '$.amount') AS double), 0)
            ELSE 0
        END)
        + coalesce(max(v2.payment_bones), 0)
    ) / 1e8                                                                 AS "paymentHnt",
    sum(CASE
        WHEN t.type = 'token_burn_v1'
        THEN coalesce(try_cast(json_extract_scalar(t.fields, '$.amount') AS double), 0)
        ELSE 0
    END) / 1e8                                                              AS "hntBurned",
    sum(CASE
        WHEN t.type IN ('add_gateway_v1', 'assert_location_v1', 'assert_location_v2')
        THEN coalesce(try_cast(json_extract_scalar(t.fields, '$.staking_fee') AS double), 0)
        ELSE 0
    END)                                                                    AS "stakingFeeDc"
FROM tx t
LEFT JOIN (
    SELECT partition_0, sum(bones) AS payment_bones
    FROM payment_v2_amounts
    GROUP BY 1
) v2
  ON v2.partition_0 = t.partition_0
GROUP BY 1
ORDER BY 1
