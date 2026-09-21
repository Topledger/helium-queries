-- query_name: HOTSPOT_ONBOARD_CADENCE
-- New issue / onboard events per day, week, or month from Entity Manager.
SELECT
    CASE
        WHEN '{bucket}' = 'total'
            THEN '{start_date}'
        ELSE date_format(
                date_trunc('{bucket}', CAST(block_date AS date)),
                '%Y-%m-%dT%H:%i:%sZ'
             )
    END                                                                     AS "date",
    count(DISTINCT input_accounts.keyToAsset)                               AS "hotspotCount",
    count(DISTINCT CASE
        WHEN instruction_type IN ('GenesisIssueHotspotV0', 'IssueDataOnlyEntityV0')
        THEN input_accounts.keyToAsset
    END)                                                                    AS "issuedCount",
    count(DISTINCT CASE
        WHEN instruction_type IN ('OnboardIotHotspotV0', 'OnboardDataOnlyIotHotspotV0')
        THEN input_accounts.keyToAsset
    END)                                                                    AS "iotOnboardCount",
    count(DISTINCT CASE
        WHEN instruction_type IN ('OnboardMobileHotspotV0', 'OnboardDataOnlyMobileHotspotV0')
        THEN input_accounts.keyToAsset
    END)                                                                    AS "mobileOnboardCount"
FROM helium.entity_manager
WHERE instruction_type IN (
        'GenesisIssueHotspotV0',
        'OnboardIotHotspotV0',
        'OnboardMobileHotspotV0',
        'IssueDataOnlyEntityV0',
        'OnboardDataOnlyIotHotspotV0',
        'OnboardDataOnlyMobileHotspotV0'
    )
  AND input_accounts.keyToAsset IS NOT NULL
  AND CAST(block_date AS date) BETWEEN date('{start_date}') AND date('{end_date}')
GROUP BY 1
ORDER BY 1
