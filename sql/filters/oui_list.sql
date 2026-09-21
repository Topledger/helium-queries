-- query_name: OUI_LIST
-- Lookup: valid OUI identifiers for the OUI dropdown.
SELECT DISTINCT
    cast(oui AS varchar) AS "oui"
FROM helium.oui_mapping
WHERE oui IS NOT NULL
ORDER BY 1
