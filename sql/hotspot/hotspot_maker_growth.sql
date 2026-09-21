-- query_name: HOTSPOT_MAKER_GROWTH
-- Maker inventory with first and latest issue/onboard date.
WITH cte_maker AS (
    SELECT
        input_accounts.maker AS maker,
        args.initializemakerv0args.name AS name
    FROM helium.entity_manager
    WHERE instruction_type = 'InitializeMakerV0'
),
cte_hotspot AS (
    SELECT
        a.input_accounts.keyToAsset AS mint,
        b.name AS name,
        min(CAST(a.block_date AS date)) AS first_mint_date,
        max(CAST(a.block_date AS date)) AS last_mint_date
    FROM helium.entity_manager a
    JOIN cte_maker b
      ON a.input_accounts.maker = b.maker
    WHERE a.instruction_type IN (
        'GenesisIssueHotspotV0',
        'OnboardIotHotspotV0',
        'OnboardMobileHotspotV0',
        'IssueDataOnlyEntityV0',
        'OnboardDataOnlyIotHotspotV0',
        'OnboardDataOnlyMobileHotspotV0'
    )
      AND a.input_accounts.keyToAsset IS NOT NULL
    GROUP BY 1, 2
)
SELECT
    coalesce(nullif(trim(name), ''), 'Unknown')                             AS "makerName",
    date_format(CAST(min(first_mint_date) AS TIMESTAMP), '%Y-%m-%d')       AS "firstMintDate",
    date_format(CAST(max(last_mint_date) AS TIMESTAMP), '%Y-%m-%d')        AS "lastMintDate",
    count(DISTINCT mint)                                                    AS "hotspotCount"
FROM cte_hotspot
WHERE 1 = 1
  {maker_filter}
GROUP BY 1
ORDER BY 4 DESC
