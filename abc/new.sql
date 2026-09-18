-- query_name: DELEGATION_ACTIVE_STAKE
-- All HNT still locked: live delegated (Mobile/IoT) plus undelegated.
-- Undelegated amount = VSR deposits − withdrawals − transfers, HNT only.
WITH cte_live AS (
    SELECT
        d.mint,
        d.hnt_amount,
        d.block_date
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
agg AS (
    SELECT
        (SELECT max(block_date) FROM cte_live) AS snapshot_date,
        (SELECT count(*) FROM cte_live) AS delegated_n,
        (SELECT coalesce(sum(CAST(hnt_amount AS DOUBLE)), 0) FROM cte_live) AS delegated_amt,
        (SELECT count(*) FROM cte_undelegated) AS undelegated_n,
        (SELECT coalesce(sum(amount_deposited), 0) FROM cte_undelegated) AS undelegated_amt
)
SELECT
    CAST(snapshot_date AS VARCHAR) AS "snapshotDate",
    delegated_n + undelegated_n AS positions,
    CAST(delegated_amt + undelegated_amt * 1e8 AS BIGINT) AS "hntAmount",
    round(delegated_amt / 1e8 + undelegated_amt, 4) AS "hntStaked",
    delegated_n AS "delegatedPositions",
    round(delegated_amt / 1e8, 4) AS "hntDelegated",
    undelegated_n AS "undelegatedPositions",
    round(undelegated_amt, 4) AS "hntUndelegated"
FROM agg
