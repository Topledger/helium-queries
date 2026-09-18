-- query_name: DELEGATION_ACTIVE_STAKE_BY_DAO
-- Locked HNT grouped by Mobile, IoT, and Undelegated.
-- Undelegated amount comes from voter_stake_registry, not wallet_staking.
WITH cte_live AS (
    SELECT
        d.mint,
        d.sub_dao,
        d.hnt_amount
    FROM helium.sub_daos_delegated_positions d
    WHERE coalesce(d.purged, false) = false
      AND d.hnt_amount > 0
      AND d.expiration_ts IS NOT NULL
      AND d.expiration_ts > {now_ts}
),
cte_hnt_positions AS (
    SELECT
        input_accounts.position AS position,
        min(input_accounts.mint) AS nft_mint
    FROM helium.voter_stake_registry
    WHERE instruction_type = 'InitializePositionV0'
      AND input_accounts.depositmint = 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'
    GROUP BY 1
),
cte_closed AS (
    SELECT DISTINCT input_accounts.position AS position
    FROM helium.voter_stake_registry
    WHERE instruction_type = 'ClosePositionV0'
),
cte_flows AS (
    SELECT position, sum(delta) AS amount_bones
    FROM (
        SELECT DISTINCT
            tx_id, instruction_index, input_accounts.position AS position,
            args.depositv0args.amount AS delta
        FROM helium.voter_stake_registry
        WHERE instruction_type = 'DepositV0'
        UNION ALL
        SELECT DISTINCT
            tx_id, instruction_index, input_accounts.position,
            -args.withdrawv0args.amount
        FROM helium.voter_stake_registry
        WHERE instruction_type = 'WithdrawV0'
        UNION ALL
        SELECT DISTINCT
            tx_id, instruction_index, input_accounts.sourceposition,
            -args.transferv0args.amount
        FROM helium.voter_stake_registry
        WHERE instruction_type = 'TransferV0'
          AND input_accounts.depositmint = 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'
        UNION ALL
        SELECT DISTINCT
            tx_id, instruction_index, input_accounts.targetposition,
            args.transferv0args.amount
        FROM helium.voter_stake_registry
        WHERE instruction_type = 'TransferV0'
          AND input_accounts.depositmint = 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'
    )
    GROUP BY 1
),
cte_undelegated AS (
    SELECT f.amount_bones / 1e8 AS amount_deposited
    FROM cte_hnt_positions p
    JOIN cte_flows f ON f.position = p.position
    WHERE p.position NOT IN (SELECT position FROM cte_closed)
      AND f.amount_bones > 0
      AND p.nft_mint NOT IN (SELECT mint FROM cte_live)
),
by_group AS (
    SELECT
        CASE d.sub_dao
            WHEN 'Gm9xDCJawDEKDrrQW6haw94gABaYzQwCq4ZQU8h8bd22' THEN 'Mobile'
            WHEN '39Lw1RH6zt8AJvKn3BTxmUDofzduCM2J3kSaGDZ8L7Sk' THEN 'IoT'
            ELSE 'Unknown'
        END AS network,
        d.sub_dao AS "subDao",
        count(*) AS positions,
        sum(d.hnt_amount) AS "hntAmount",
        round(sum(CAST(d.hnt_amount AS DOUBLE)) / 1e8, 4) AS "hntStaked"
    FROM cte_live d
    GROUP BY 1, 2
    UNION ALL
    SELECT
        'Undelegated' AS network,
        NULL AS "subDao",
        count(*) AS positions,
        CAST(sum(amount_deposited * 1e8) AS BIGINT) AS "hntAmount",
        round(sum(amount_deposited), 4) AS "hntStaked"
    FROM cte_undelegated
),
grand AS (
    SELECT CAST(sum("hntAmount") AS DOUBLE) AS total_amount
    FROM by_group
)
SELECT
    b.network,
    b."subDao",
    b.positions,
    b."hntAmount",
    b."hntStaked",
    round(100.0 * CAST(b."hntAmount" AS DOUBLE) / NULLIF(g.total_amount, 0), 2) AS "stakePercent"
FROM by_group b
CROSS JOIN grand g
WHERE 1 = 1
  {subdao_filter}
ORDER BY b."hntStaked" DESC
