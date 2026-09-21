-- query_name: DELEGATION_WALLET_PROXIES
-- Latest assign_proxy per stake NFT, then keep rows for this wallet.
-- role=owner: wallet is assign_proxy.payer (they assigned the proxy)
-- role=proxy: wallet is assign_proxy.recipient (they receive the vote)
WITH cte_assigned AS (
    SELECT
        p.payer,
        p.asset AS nft_mint,
        p.recipient,
        p.block_time
    FROM (
        SELECT
            a.payer,
            a.asset,
            a.recipient,
            a.block_time,
            row_number() OVER (
                PARTITION BY a.asset
                ORDER BY a.block_time DESC
            ) AS rn
        FROM helium.assign_proxy a
        WHERE 1 = 1
          {nft_mint_filter}
    ) p
    WHERE p.rn = 1
      AND p.recipient IS NOT NULL
      {wallet_match}
),
cte_live AS (
    SELECT
        s.mint AS nft_mint,
        s.hnt_amount,
        s.sub_dao
    FROM helium.sub_daos_delegated_positions s
    WHERE s.mint IN (SELECT nft_mint FROM cte_assigned)
      AND coalesce(s.purged, false) = false
      AND s.hnt_amount > 0
      AND s.expiration_ts IS NOT NULL
      AND s.expiration_ts > {now_ts}
),
cte_hnt_positions AS (
    SELECT
        input_accounts.position AS position,
        min(input_accounts.mint) AS nft_mint
    FROM helium.voter_stake_registry
    WHERE instruction_type = 'InitializePositionV0'
      AND input_accounts.depositmint = 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'
      AND input_accounts.mint IN (SELECT nft_mint FROM cte_assigned)
    GROUP BY 1
),
cte_flows AS (
    SELECT position, sum(delta) AS amount_bones
    FROM (
        SELECT DISTINCT
            tx_id, instruction_index, input_accounts.position AS position,
            args.depositv0args.amount AS delta
        FROM helium.voter_stake_registry
        WHERE instruction_type = 'DepositV0'
          AND input_accounts.position IN (SELECT position FROM cte_hnt_positions)
        UNION ALL
        SELECT DISTINCT
            tx_id, instruction_index, input_accounts.position,
            -args.withdrawv0args.amount
        FROM helium.voter_stake_registry
        WHERE instruction_type = 'WithdrawV0'
          AND input_accounts.position IN (SELECT position FROM cte_hnt_positions)
        UNION ALL
        SELECT DISTINCT
            tx_id, instruction_index, input_accounts.sourceposition,
            -args.transferv0args.amount
        FROM helium.voter_stake_registry
        WHERE instruction_type = 'TransferV0'
          AND input_accounts.depositmint = 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'
          AND input_accounts.sourceposition IN (SELECT position FROM cte_hnt_positions)
        UNION ALL
        SELECT DISTINCT
            tx_id, instruction_index, input_accounts.targetposition,
            args.transferv0args.amount
        FROM helium.voter_stake_registry
        WHERE instruction_type = 'TransferV0'
          AND input_accounts.depositmint = 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'
          AND input_accounts.targetposition IN (SELECT position FROM cte_hnt_positions)
    )
    GROUP BY 1
),
cte_ws AS (
    SELECT
        p.nft_mint,
        f.amount_bones / 1e8 AS amount_deposited
    FROM cte_hnt_positions p
    JOIN cte_flows f ON f.position = p.position
    WHERE f.amount_bones > 0
),
cte_genesis AS (
    SELECT
        input_accounts.mint AS nft_mint,
        CASE
            WHEN min(to_unixtime(with_timezone(CAST(block_time AS TIMESTAMP), 'UTC'))) < 1697666191
            THEN 1697666191
            WHEN min(to_unixtime(with_timezone(CAST(block_time AS TIMESTAMP), 'UTC'))) < 1808154072
            THEN 1808154072
        END AS genesis_end
    FROM helium.voter_stake_registry
    WHERE instruction_type = 'InitializePositionV0'
      AND input_accounts.mint IN (SELECT nft_mint FROM cte_assigned)
    GROUP BY 1
),
cte_lockup AS (
    SELECT
        nft_mint,
        kind,
        lockup_ts,
        lockup_ts + CAST(periods AS DOUBLE) * 86400 AS lock_end_ts
    FROM (
        SELECT
            input_accounts.mint AS nft_mint,
            COALESCE(
                args.resetlockupv0args.kind,
                args.initializepositionv0args.kind
            ) AS kind,
            COALESCE(
                args.resetlockupv0args.periods,
                args.initializepositionv0args.periods
            ) AS periods,
            to_unixtime(with_timezone(CAST(block_time AS TIMESTAMP), 'UTC')) AS lockup_ts,
            row_number() OVER (
                PARTITION BY input_accounts.mint
                ORDER BY block_time DESC, instruction_index DESC
            ) AS rn
        FROM helium.voter_stake_registry
        WHERE instruction_type IN ('InitializePositionV0', 'ResetLockupV0')
          AND input_accounts.mint IN (SELECT nft_mint FROM cte_assigned)
    )
    WHERE rn = 1
      AND periods IS NOT NULL
)
SELECT
    a.payer AS "wallet",
    a.nft_mint AS "nftMint",
    a.recipient AS "proxyWallet",
    date_format(CAST(a.block_time AS TIMESTAMP), '%Y-%m-%d') AS "lastProxyAssignedDate",
    ROUND(
        CASE
            WHEN s.hnt_amount IS NOT NULL THEN CAST(s.hnt_amount AS DOUBLE) / 1e8
            ELSE CAST(w.amount_deposited AS DOUBLE)
        END
    , 4) AS "amountDeposited",
    CASE
        WHEN lk.lock_end_ts IS NULL OR lk.lockup_ts IS NULL THEN NULL
        WHEN s.hnt_amount IS NULL AND w.amount_deposited IS NULL THEN NULL
        ELSE ROUND(
            CASE
                WHEN s.hnt_amount IS NOT NULL THEN CAST(s.hnt_amount AS DOUBLE) / 1e8
                ELSE CAST(w.amount_deposited AS DOUBLE)
            END
            * 100.0
            * LEAST(
                CASE lower(lk.kind)
                    WHEN 'constant' THEN GREATEST(lk.lock_end_ts - lk.lockup_ts, 0)
                    ELSE GREATEST(lk.lock_end_ts - {now_ts}, 0)
                END,
                126144000.0
            ) / 126144000.0
            * CASE
                WHEN g.genesis_end IS NOT NULL AND {now_ts} <= g.genesis_end THEN 3.0
                ELSE 1.0
            END
        , 2)
    END AS "votingPower",
    CASE s.sub_dao
        WHEN 'Gm9xDCJawDEKDrrQW6haw94gABaYzQwCq4ZQU8h8bd22' THEN 'Mobile'
        WHEN '39Lw1RH6zt8AJvKn3BTxmUDofzduCM2J3kSaGDZ8L7Sk' THEN 'IoT'
        ELSE CASE WHEN s.sub_dao IS NULL THEN NULL ELSE 'Unknown' END
    END AS "network",
    s.sub_dao AS "subDao"
FROM cte_assigned a
LEFT JOIN cte_live s ON s.nft_mint = a.nft_mint
LEFT JOIN cte_ws w ON w.nft_mint = a.nft_mint
LEFT JOIN cte_genesis g ON g.nft_mint = a.nft_mint
LEFT JOIN cte_lockup lk ON lk.nft_mint = a.nft_mint
ORDER BY a.block_time DESC
