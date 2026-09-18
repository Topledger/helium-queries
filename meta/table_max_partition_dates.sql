-- query_name: TABLE_MAX_PARTITION_DATES
SELECT 'helium_oracle_iot.gatewayrewardshare' AS "tableName",
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000)))) AS "maxPartitionDate"
FROM hive.helium_oracle_iot.gatewayrewardshare
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'

UNION ALL
SELECT 'helium_oracle_iot.iotbeaconingestreport',
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))))
FROM hive.helium_oracle_iot.iotbeaconingestreport
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'

UNION ALL
SELECT 'helium_oracle_iot.iotinvalidbeaconreport',
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))))
FROM hive.helium_oracle_iot.iotinvalidbeaconreport
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'

UNION ALL
SELECT 'helium_oracle_iot.iotinvalidwitnessreport',
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))))
FROM hive.helium_oracle_iot.iotinvalidwitnessreport
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'

UNION ALL
SELECT 'helium_oracle_iot.iotpoc',
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))))
FROM hive.helium_oracle_iot.iotpoc
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'

UNION ALL
SELECT 'helium_oracle_iot.iotrewardshare',
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))))
FROM hive.helium_oracle_iot.iotrewardshare
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'

UNION ALL
SELECT 'helium_oracle_iot.packetreport',
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))))
FROM hive.helium_oracle_iot.packetreport
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'

UNION ALL
SELECT 'helium_oracle_iot.rewardmanifestiot',
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))))
FROM hive.helium_oracle_iot.rewardmanifestiot
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'

UNION ALL
SELECT 'helium_oracle_mobile.cellspeedtestingestreport',
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))))
FROM hive.helium_oracle_mobile.cellspeedtestingestreport
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'

UNION ALL
SELECT 'helium_oracle_mobile.datatransfersessioningestreport',
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))))
FROM hive.helium_oracle_mobile.datatransfersessioningestreport
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'

UNION ALL
SELECT 'helium_oracle_mobile.mobilerewardshare',
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))))
FROM hive.helium_oracle_mobile.mobilerewardshare
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'

UNION ALL
SELECT 'helium_oracle_mobile.rewardmanifestmobile',
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))))
FROM hive.helium_oracle_mobile.rewardmanifestmobile
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'

UNION ALL
SELECT 'helium_oracle_mobile.speedtestavg',
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))))
FROM hive.helium_oracle_mobile.speedtestavg
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'

UNION ALL
SELECT 'helium_oracle_mobile.validatedheartbeat',
       MAX(COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))))
FROM hive.helium_oracle_mobile.validatedheartbeat
WHERE COALESCE(TRY_CAST(partition_0 AS DATE), DATE(FROM_UNIXTIME(TRY_CAST(partition_0 AS BIGINT) / 1000))) >= DATE '{min_date}'
ORDER BY 2 DESC
