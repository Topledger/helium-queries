-- query_name: L1_BLOCKS_DAILY
-- Daily Helium L1 network metrics: chain activity, PoC, usage, and rewards.
WITH blocks AS (
    SELECT
        partition_0,
        height,
        time,
        transaction_count,
        lag(time) OVER (ORDER BY height) AS previous_block_time
    FROM helium.l1_blocks
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND partition_0 >= '2019-07-29'
      AND partition_0 <= '2023-04-18'
),
block_metrics AS (
    SELECT
        partition_0,
        count(*)                                                            AS block_count,
        sum(transaction_count)                                              AS transaction_count,
        avg(date_diff('millisecond', previous_block_time, time) / 1000.0)   AS avg_block_time_seconds
    FROM blocks
    GROUP BY 1
),
tx AS (
    SELECT
        partition_0,
        type,
        fields
    FROM helium.l1_transactions
    WHERE partition_0 BETWEEN '{start_date}' AND '{end_date}'
      AND partition_0 >= '2019-07-29'
      AND partition_0 <= '2023-04-18'
),
state_channel_usage AS (
    SELECT
        t.partition_0,
        coalesce(try_cast(json_extract_scalar(s.summary, '$.num_packets') AS bigint), 0)
                                                                            AS packets,
        coalesce(try_cast(json_extract_scalar(s.summary, '$.num_dcs') AS bigint), 0)
                                                                            AS data_credits
    FROM tx t
    CROSS JOIN UNNEST(
        coalesce(
            try_cast(json_extract(t.fields, '$.state_channel.summaries') AS array(json)),
            try_cast(json_extract(t.fields, '$.summaries') AS array(json)),
            CAST(ARRAY[] AS array(json))
        )
    ) AS s(summary)
    WHERE t.type = 'state_channel_close_v1'
),
reward_amounts AS (
    SELECT
        t.partition_0,
        coalesce(try_cast(json_extract_scalar(r.reward, '$.amount') AS double), 0) AS bones
    FROM tx t
    CROSS JOIN UNNEST(
        coalesce(
            try_cast(json_extract(t.fields, '$.rewards') AS array(json)),
            CAST(ARRAY[] AS array(json))
        )
    ) AS r(reward)
    WHERE t.type IN ('rewards_v1', 'rewards_v2')
),
tx_metrics AS (
    SELECT
        t.partition_0,
        count_if(t.type IN ('poc_receipts_v1', 'poc_receipts_v2'))          AS challenge_count
    FROM tx t
    GROUP BY 1
),
usage_metrics AS (
    SELECT
        partition_0,
        sum(packets)                                                        AS packet_count,
        sum(data_credits)                                                   AS data_credits_used
    FROM state_channel_usage
    GROUP BY 1
),
reward_metrics AS (
    SELECT
        partition_0,
        sum(bones) / 1e8                                                    AS hnt_rewarded
    FROM reward_amounts
    GROUP BY 1
)
SELECT
    date_format(CAST(b.partition_0 AS date), '%Y-%m-%dT%H:%i:%sZ')          AS "date",
    b.block_count                                                           AS "blockCount",
    b.transaction_count                                                     AS "transactionCount",
    b.avg_block_time_seconds                                                AS "avgBlockTimeSeconds",
    coalesce(t.challenge_count, 0)                                          AS "challengeCount",
    coalesce(u.packet_count, 0)                                             AS "packetCount",
    coalesce(u.data_credits_used, 0)                                        AS "dataCreditsUsed",
    coalesce(r.hnt_rewarded, 0)                                             AS "hntRewarded"
FROM block_metrics b
LEFT JOIN tx_metrics t
  ON t.partition_0 = b.partition_0
LEFT JOIN usage_metrics u
  ON u.partition_0 = b.partition_0
LEFT JOIN reward_metrics r
  ON r.partition_0 = b.partition_0
ORDER BY 1
