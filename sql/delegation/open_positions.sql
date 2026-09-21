-- query_name: DELEGATION_OPEN_POSITIONS
SELECT
    block_time AS "blockTime",
    position AS "position",
    nft_mint AS "nftMint",
    positionauthority AS "positionAuthority",
    subdao AS "subDao",
    tx_id AS "txId",
    instruction_type AS "instructionType"
FROM (
    SELECT
        block_time,
        input_accounts.positionauthority,
        input_accounts.mint AS nft_mint,
        input_accounts.position,
        instruction_type,
        input_accounts.subdao,
        tx_id,
        row_number() OVER (
            PARTITION BY input_accounts.mint
            ORDER BY block_time DESC, instruction_index DESC
        ) AS rn
    FROM helium.sub_daos
    WHERE instruction_type IN (
        'DelegateV0',
        'CloseDelegationV0',
        'ExtendExpirationTsV0',
        'ChangeDelegationV0'
    )
)
WHERE rn = 1
  AND instruction_type <> 'CloseDelegationV0'
  {authority_filter}
  {nft_mint_filter}
  {subdao_filter}
ORDER BY block_time DESC
