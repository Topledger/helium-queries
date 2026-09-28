-- query_name: L1_TRANSACTIONS_BY_TYPE
-- How many Helium L1 transactions of each type were recorded each day.
SELECT
    date_format(CAST(partition_0 AS date), '%Y-%m-%dT%H:%i:%sZ')            AS "date",
    type                                                                    AS "transactionType",
    count(*)                                                                AS "transactionCount"
FROM helium.l1_transactions
WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
  AND partition_0 >= '2019-07-29'
  AND partition_0 <= '2023-04-18'
  {l1_type_filter}
GROUP BY 1, 2
ORDER BY 1, 3 DESC
OFFSET {offset}
LIMIT {limit}
