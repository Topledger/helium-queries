-- query_name: DELEGATION_WALLET_POSITIONS
-- All HNT locks that still have a deposit: live delegated + undelegated.
-- wallet = creating wallet from InitializePositionV0 (recipient).
-- Amount: live snapshot when delegated, else VSR deposit − withdraw − transfer.
-- Empty (0 HNT) and closed locks are omitted.
WITH cte_hnt_positions AS (
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
cte_ws AS (
    SELECT
        p.nft_mint,
        p.position,
        f.amount_bones / 1e8 AS amount_deposited
    FROM cte_hnt_positions p
    JOIN cte_flows f ON f.position = p.position
    WHERE p.position NOT IN (SELECT position FROM cte_closed)
      AND f.amount_bones > 0
),
cte_live AS (
    SELECT
        s.mint AS nft_mint,
        s.position,
        s.hnt_amount,
        s.sub_dao
    FROM helium.sub_daos_delegated_positions s
    WHERE coalesce(s.purged, false) = false
      AND s.hnt_amount > 0
      AND s.expiration_ts IS NOT NULL
      AND s.expiration_ts > {now_ts}
),
cte_all AS (
    SELECT
        coalesce(l.nft_mint, w.nft_mint) AS nft_mint,
        coalesce(l.position, w.position) AS position,
        l.hnt_amount,
        l.sub_dao,
        w.amount_deposited AS ws_amount
    FROM cte_ws w
    FULL OUTER JOIN cte_live l ON l.nft_mint = w.nft_mint
),
cte_base AS (
    SELECT *
    FROM cte_all
    WHERE 1 = 1
      {nft_mint_filter}
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
      AND input_accounts.mint IN (SELECT nft_mint FROM cte_base)
    GROUP BY 1
),
cte_wallet AS (
    SELECT
        input_accounts.mint AS nft_mint,
        min(COALESCE(
            input_accounts.recipient,
            input_accounts.positionauthority,
            input_accounts.payer
        )) AS wallet
    FROM helium.voter_stake_registry
    WHERE instruction_type = 'InitializePositionV0'
      AND input_accounts.mint IN (SELECT nft_mint FROM cte_base)
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
          AND input_accounts.mint IN (SELECT nft_mint FROM cte_base)
    )
    WHERE rn = 1
      AND periods IS NOT NULL
),
cte_latest_delegate AS (
    SELECT
        block_time,
        nft_mint
    FROM (
        SELECT
            block_time,
            input_accounts.mint AS nft_mint,
            row_number() OVER (
                PARTITION BY input_accounts.mint
                ORDER BY block_time DESC, instruction_index DESC
            ) AS rn
        FROM helium.sub_daos
        WHERE instruction_type IN (
            'DelegateV0',
            'ExtendExpirationTsV0',
            'ChangeDelegationV0'
        )
          AND input_accounts.mint IN (SELECT nft_mint FROM cte_base)
    )
    WHERE rn = 1
),
cte_last_proxy_assigned AS (
    SELECT
        date(block_time) AS block_date,
        asset AS nft
    FROM (
        SELECT
            a.block_time,
            a.asset,
            row_number() OVER (
                PARTITION BY a.asset
                ORDER BY a.block_time DESC
            ) AS rn
        FROM helium.assign_proxy a
        WHERE a.asset IN (SELECT nft_mint FROM cte_base)
    )
    WHERE rn = 1
)
SELECT
    w.wallet AS "wallet",
    s.nft_mint AS "nftMint",
    'HNT' AS "tokenSymbol",
    ROUND(
        CASE
            WHEN s.hnt_amount IS NOT NULL THEN CAST(s.hnt_amount AS DOUBLE) / 1e8
            ELSE CAST(s.ws_amount AS DOUBLE)
        END
    , 4) AS "amountDeposited",
    CASE
        WHEN lk.lockup_ts IS NULL THEN NULL
        ELSE date_format(from_unixtime(lk.lockup_ts) AT TIME ZONE 'UTC', '%Y-%m-%d')
    END AS "startDate",
    CASE
        WHEN lk.lock_end_ts IS NULL THEN NULL
        ELSE date_format(from_unixtime(lk.lock_end_ts) AT TIME ZONE 'UTC', '%Y-%m-%d')
    END AS "endDate",
    CASE lower(lk.kind)
        WHEN 'cliff' THEN 'Cliff'
        WHEN 'constant' THEN 'Constant'
        ELSE lk.kind
    END AS "kind",
    CASE
        WHEN g.genesis_end IS NOT NULL
        THEN date_format(from_unixtime(g.genesis_end) AT TIME ZONE 'UTC', '%Y-%m-%d')
        ELSE NULL
    END AS "landrushEndDate",
    CASE
        WHEN lk.lock_end_ts IS NULL OR lk.lockup_ts IS NULL THEN NULL
        ELSE ROUND(
            CASE
                WHEN s.hnt_amount IS NOT NULL THEN CAST(s.hnt_amount AS DOUBLE) / 1e8
                ELSE CAST(s.ws_amount AS DOUBLE)
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
    s.position AS "position",
    CASE
        WHEN s.hnt_amount IS NOT NULL THEN 'delegated'
        ELSE 'undelegated'
    END AS "status",
    CASE
        WHEN d.block_time IS NULL THEN NULL
        ELSE date_format(CAST(d.block_time AS TIMESTAMP), '%Y-%m-%d')
    END AS "lastDelegatedDate",
    CASE
        WHEN e.block_date IS NULL THEN NULL
        ELSE CAST(e.block_date AS VARCHAR)
    END AS "lastProxyAssignedDate",
    CASE s.sub_dao
        WHEN 'Gm9xDCJawDEKDrrQW6haw94gABaYzQwCq4ZQU8h8bd22' THEN 'Mobile'
        WHEN '39Lw1RH6zt8AJvKn3BTxmUDofzduCM2J3kSaGDZ8L7Sk' THEN 'IoT'
        ELSE CASE WHEN s.sub_dao IS NULL THEN NULL ELSE 'Unknown' END
    END AS "network",
    s.sub_dao AS "subDao"
FROM cte_base s
LEFT JOIN cte_wallet w ON w.nft_mint = s.nft_mint
LEFT JOIN cte_genesis g ON g.nft_mint = s.nft_mint
LEFT JOIN cte_lockup lk ON lk.nft_mint = s.nft_mint
LEFT JOIN cte_latest_delegate d ON d.nft_mint = s.nft_mint
LEFT JOIN cte_last_proxy_assigned e ON e.nft = s.nft_mint
WHERE 1 = 1
  {wallet_filter}
  {subdao_filter}
  {status_filter}
ORDER BY
    CASE
        WHEN s.hnt_amount IS NOT NULL THEN CAST(s.hnt_amount AS DOUBLE)
        ELSE CAST(s.ws_amount AS DOUBLE) * 1e8
    END DESC
