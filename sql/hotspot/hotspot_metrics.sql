-- query_name: HOTSPOT_METRICS
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
        b.name AS name
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
)
SELECT
    count(DISTINCT name)                                                    AS "makerCount",
    count(DISTINCT mint)                                                    AS "hotspotCount"
FROM cte_hotspot
