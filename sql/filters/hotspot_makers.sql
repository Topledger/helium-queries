-- query_name: HOTSPOT_MAKERS
-- Lookup: maker names for the Gateway maker filter.
SELECT DISTINCT
    args.initializemakerv0args.name AS "makerName"
FROM helium.entity_manager
WHERE instruction_type = 'InitializeMakerV0'
  AND args.initializemakerv0args.name IS NOT NULL
ORDER BY 1
