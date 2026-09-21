-- query_name: HOTSPOT_NETWORK_MIX
-- Current hotspot inventory by IoT / Mobile onboarding records.
WITH network_hotspots AS (
    SELECT DISTINCT
        input_accounts.keyToAsset AS key_to_asset_key,
        CASE
            WHEN instruction_type IN (
                'OnboardIotHotspotV0',
                'OnboardDataOnlyIotHotspotV0'
            ) THEN 'IoT'
            WHEN instruction_type IN (
                'OnboardMobileHotspotV0',
                'OnboardDataOnlyMobileHotspotV0'
            ) THEN 'Mobile'
        END AS network
    FROM helium.entity_manager
    WHERE input_accounts.keyToAsset IS NOT NULL
      AND instruction_type IN (
          'OnboardIotHotspotV0',
          'OnboardDataOnlyIotHotspotV0',
          'OnboardMobileHotspotV0',
          'OnboardDataOnlyMobileHotspotV0'
      )
)
SELECT
    network                                                                 AS "network",
    CASE network
        WHEN 'IoT' THEN '39Lw1RH6zt8AJvKn3BTxmUDofzduCM2J3kSaGDZ8L7Sk'
        WHEN 'Mobile' THEN 'Gm9xDCJawDEKDrrQW6haw94gABaYzQwCq4ZQU8h8bd22'
    END                                                                     AS "subDao",
    count(DISTINCT key_to_asset_key)                                        AS "hotspotCount"
FROM network_hotspots
GROUP BY 1
ORDER BY 3 DESC
