-- query_name: OUI_LIST
-- Valid OUI identifiers for UI dropdowns.
SELECT DISTINCT
    cast(oui AS varchar) AS "oui"
FROM helium.oui_mapping
WHERE oui IS NOT NULL
ORDER BY 1
