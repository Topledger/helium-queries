-- query_name: DELEGATION_DELEGATED_POSITIONS
-- On-chain DelegatedPositionV0 snapshot + current NFT holder / lockup from voter_stake_registry.
-- All timestamps and voting power are UTC.
-- Voting power (HIP-76), UTC seconds:
--   Constant: full lock (end - start) / 4 years, does not decay
--   Cliff:    time left (end - now) / 4 years
--   x3 while now <= genesis_end
-- Lock end = latest InitializePositionV0 / ResetLockupV0 time + periods (days).
SELECT
    CAST(d.block_date AS VARCHAR) AS "blockDate",
    w.wallet,
    CASE lower(lk.kind)
        WHEN 'cliff' THEN 'Cliff'
        WHEN 'constant' THEN 'Constant'
        ELSE lk.kind
    END AS kind,
    d.mint AS "nftMint",
    d.position,
    d.hnt_amount AS "hntAmount",
    CASE d.sub_dao
        WHEN 'Gm9xDCJawDEKDrrQW6haw94gABaYzQwCq4ZQU8h8bd22' THEN 'Mobile'
        WHEN '39Lw1RH6zt8AJvKn3BTxmUDofzduCM2J3kSaGDZ8L7Sk' THEN 'IoT'
        ELSE 'Unknown'
    END AS network,
    d.sub_dao AS "subDao",
    CASE
        WHEN lk.lock_end_ts IS NULL OR lk.lockup_ts IS NULL THEN NULL
        ELSE ROUND(
            CAST(d.hnt_amount AS DOUBLE) / 1e8
            * 100.0
            * LEAST(
                CASE lower(lk.kind)
                    WHEN 'constant' THEN GREATEST(lk.lock_end_ts - lk.lockup_ts, 0)
                    ELSE GREATEST(lk.lock_end_ts - {now_ts}, 0)
                END,
                126144000.0
            ) / 126144000.0
            * CASE
                WHEN g.genesis_end IS NOT NULL AND {now_ts} <= g.genesis_end
                THEN 3.0
                ELSE 1.0
            END
        , 2)
    END AS "votingPower",
    CASE
        WHEN g.genesis_end IS NOT NULL
        THEN date_format(from_unixtime(g.genesis_end) AT TIME ZONE 'UTC', '%Y-%m-%d')
        ELSE NULL
    END AS "landrushEndDate",
    d.last_claimed_epoch AS "lastClaimedEpoch",
    CASE
        WHEN d.start_ts IS NULL OR d.start_ts = 0 THEN NULL
        ELSE date_format(from_unixtime(d.start_ts) AT TIME ZONE 'UTC', '%Y-%m-%d')
    END AS "startDate",
    CASE
        WHEN lk.lock_end_ts IS NULL OR lk.lock_end_ts = 0 THEN NULL
        ELSE date_format(from_unixtime(lk.lock_end_ts) AT TIME ZONE 'UTC', '%Y-%m-%d')
    END AS "lockEndDate",
    d.purged,
    d.bump_seed AS "bumpSeed",
    d.claimed_epochs_bitmap AS "claimedEpochsBitmap",
    CASE
        WHEN d.expiration_ts IS NULL OR d.expiration_ts = 0 THEN NULL
        ELSE date_format(from_unixtime(d.expiration_ts) AT TIME ZONE 'UTC', '%Y-%m-%d')
    END AS "expirationDate"
FROM helium.sub_daos_delegated_positions d
LEFT JOIN (
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
    GROUP BY 1
) g ON g.nft_mint = d.mint
LEFT JOIN (
    SELECT nft_mint, wallet
    FROM (
        SELECT
            input_accounts.mint AS nft_mint,
            COALESCE(
                input_accounts."to",
                input_accounts.voter,
                input_accounts.positionauthority,
                input_accounts.recipient
            ) AS wallet,
            row_number() OVER (
                PARTITION BY input_accounts.mint
                ORDER BY block_time DESC, instruction_index DESC
            ) AS rn
        FROM helium.voter_stake_registry
        WHERE instruction_type IN (
            'InitializePositionV0',
            'LedgerTransferPositionV0',
            'ResetLockupV0',
            'VoteV0'
        )
          AND input_accounts.mint IN (
              SELECT mint FROM helium.sub_daos_delegated_positions
          )
    )
    WHERE rn = 1
      AND wallet IS NOT NULL
) w ON w.nft_mint = d.mint
LEFT JOIN (
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
    )
    WHERE rn = 1
      AND periods IS NOT NULL
) lk ON lk.nft_mint = d.mint
WHERE 1 = 1
  {wallet_filter}
  {nft_mint_filter}
  {subdao_filter}
ORDER BY d.hnt_amount DESC
