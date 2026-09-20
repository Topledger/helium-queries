-- query_name: OUI_DC_USAGE
WITH cte_oui AS (
    SELECT cast(oui AS varchar) AS oui_id, escrow AS oui_escrow_account
    FROM helium.oui_mapping
    WHERE cast(oui AS varchar) = '{oui_id}'
),
cte_escrow_account AS (
    SELECT oui_id, a.escrow_account
    FROM (
        SELECT DISTINCT input_accounts.escrowAccount AS escrow_account
        FROM helium.data_credits
        WHERE instruction_type = 'BurnDelegatedDataCreditsV0'
    ) a
    JOIN cte_oui b ON a.escrow_account = b.oui_escrow_account
)
SELECT
    b.oui_id AS "oui",
    coalesce(
        sum(args.burndelegateddatacreditsv0args.amount),
        0
    ) AS "dcUsage"
FROM cte_escrow_account b
LEFT JOIN helium.data_credits a
       ON a.input_accounts.escrowAccount = b.escrow_account
      AND a.block_date BETWEEN date('{start_date}') AND date('{end_date}')
GROUP BY 1
