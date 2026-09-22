#!/usr/bin/env node
/** Build queries/index.html — static catalog of all /api/helium/* endpoints. */
const fs = require('fs');
const path = require('path');

/** SQL groups at repo root; app/ and pipeline/ are siblings (helium-queries layout). */
function resolveQueriesRoot() {
  const envRoot = process.env.HELIUM_QUERIES_ROOT?.trim();
  if (envRoot) {
    const resolved = path.resolve(envRoot);
    if (fs.existsSync(resolved)) return resolved;
  }
  const monorepoQueries = path.join(process.cwd(), 'queries');
  if (fs.existsSync(path.join(monorepoQueries, 'app', 'catalog', 'generate-queries-index.js'))) {
    return monorepoQueries;
  }
  const fromFile = path.resolve(__dirname, '../..');
  if (fs.existsSync(path.join(fromFile, 'app', 'catalog', 'generate-queries-index.js'))) {
    return fromFile;
  }
  return fromFile;
}

const SQL_DIR = 'sql';

const REPO_ROOT = resolveQueriesRoot();
const QUERIES = path.join(REPO_ROOT, SQL_DIR);
const OUT = path.join(REPO_ROOT, 'index.html');
const STYLE_SRC = path.join(REPO_ROOT, 'app', 'catalog', 'catalog-theme.html');
const DATE_RANGE_PICKER_RUNTIME = fs.readFileSync(
  path.join(REPO_ROOT, 'app', 'catalog', 'date-range-picker.init.js'),
  'utf8'
);
const DATA_DIR = path.join(REPO_ROOT, 'data');

const SKIP_QUERY_DIRS = new Set([
  'filters',
  'gateway',
  'meta',
  'network',
  'relay',
]);

const SKIP_CATALOG_QUERIES = new Set([]);

require('dotenv').config({ path: path.join(REPO_ROOT, '.env') });

function resolveBaseUrl(override) {
  if (override) return String(override).replace(/\/$/, '');
  return (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

const GROUP_ORDER = [
  'hotspot',
  'iot',
  'mobile',
  'oui',
  'delegation',
];

const ENDPOINT_ORDER = {
  hotspot: [
    'hotspot_by_maker',
    'hotspot_get',
    'hotspot_metrics',
    'hotspot_onboard_cadence',
    'hotspot_network_mix',
    'hotspot_maker_growth',
  ],
  iot: [
    'iot_hotspot_reward_daily',
    'iot_hotspot_reward_total',
    'iot_network_reward_daily',
    'iot_network_reward_total',
    'iot_packets_daily',
    'iot_top_hotspots_by_packet_count',
    'iot_top_hotspots_by_payload_size',
    'iot_gateway_data',
    'iot_gateway_data_sum',
  ],
  mobile: [
    'gateway_mobile_daily_reward',
    'gateway_mobile_daily_data',
    'gateway_mobile_daily_heartbeat_hours',
    'gateway_mobile_daily_speedtest_averages',
    'network_mobile_daily_reward',
    'network_mobile_daily_data',
    'network_mobile_daily_heartbeat_hours',
    'network_mobile_daily_speedtest_averages',
    'network_mobile_top_gateways_by_sessions',
    'network_mobile_top_gateways_by_data',
  ],
  oui: [
    'oui_data',
    'oui_dc_usage',
    'oui_packet_size_distribution',
    'oui_top_gateways_by_payload',
  ],
  delegation: [
    'active_stake',
    'active_stake_by_dao',
    'wallet_positions',
    'delegated_positions',
    'wallet_proxies',
    'open_positions',
  ],
};

const ENDPOINT_TITLES = {
  'hotspot/hotspot_by_maker': 'Gateways by Maker',
  'hotspot/hotspot_get': 'Gateway Identity Lookup',
  'hotspot/hotspot_metrics': 'Gateway Network Totals',
  'hotspot/hotspot_onboard_cadence': 'Gateway Onboarding Activity',
  'hotspot/hotspot_network_mix': 'IoT vs Mobile Gateway Count',
  'hotspot/hotspot_maker_growth': 'Maker Issuance History',
  'iot/iot_hotspot_reward_daily': 'Gateway IoT Reward by Day',
  'iot/iot_hotspot_reward_total': 'Gateway IoT Reward Total',
  'iot/iot_network_reward_daily': 'Network IoT Reward by Day',
  'iot/iot_network_reward_total': 'Network IoT Reward Total',
  'iot/iot_packets_daily': 'IoT Packet Activity by Day',
  'iot/iot_top_hotspots_by_packet_count': 'Top Gateways by IoT Packet Count',
  'iot/iot_top_hotspots_by_payload_size': 'Top Gateways by IoT Payload',
  'iot/iot_gateway_data': 'Gateway IoT Data by Day',
  'iot/iot_gateway_data_sum': 'Gateway IoT Packet Summary',
  'oui/oui_data': 'OUI Daily Packet Activity',
  'oui/oui_dc_usage': 'OUI Data Credit Burns',
  'oui/oui_packet_size_distribution': 'OUI Daily Packet Size Distribution',
  'delegation/open_positions': 'Open Delegations',
};

const ENDPOINT_DESCRIPTIONS = {
  'hotspot/hotspot_by_maker':
    'Shows how many gateways were issued by each maker. Select a maker to return only that maker.',
  'hotspot/hotspot_get':
    'Finds a gateway using any supported identity and returns the keys that link it across Helium and Solana.',
  'hotspot/hotspot_metrics':
    'Returns the total number of gateway makers and issued gateways.',
  'hotspot/hotspot_onboard_cadence':
    'Shows how many gateways were issued or onboarded to IoT and Mobile in each time period.',
  'hotspot/hotspot_network_mix':
    'Shows the current gateway count split between the IoT and Mobile networks.',
  'hotspot/hotspot_maker_growth':
    'Shows each maker’s gateway count and the first and latest dates that maker issued a gateway.',

  'iot/iot_hotspot_reward_daily':
    'Returns one gateway’s IoT rewards for each day, split into beacon, witness, and data-transfer rewards.',
  'iot/iot_hotspot_reward_total':
    'Returns one gateway’s total IoT rewards for the selected date range, split by reward type.',
  'iot/iot_network_reward_daily':
    'Returns total IoT network rewards for each day, split into beacon, witness, and data-transfer rewards.',
  'iot/iot_network_reward_total':
    'Returns total IoT network rewards for the selected date range, including operational-fund rewards.',
  'iot/iot_packets_daily':
    'Shows daily IoT packet activity, payload size, estimated Data Credits, and radio-quality metrics.',
  'iot/iot_top_hotspots_by_packet_count':
    'Ranks gateways by the number of IoT packets handled during the selected date range.',
  'iot/iot_top_hotspots_by_payload_size':
    'Ranks gateways by total IoT payload bytes handled during the selected date range.',
  'iot/iot_gateway_data':
    'Shows one gateway’s daily IoT packet volume, payload size, and radio-quality metrics.',
  'iot/iot_gateway_data_sum':
    'Summarizes one gateway’s IoT packet and payload activity by hour, day, week, or the full date range.',

  'mobile/gateway_mobile_daily_reward':
    'Returns one gateway’s daily Mobile rewards, split into coverage and data-transfer rewards.',
  'mobile/gateway_mobile_daily_data':
    'Shows one gateway’s daily Mobile data sessions, transferred bytes, and rewardable bytes.',
  'mobile/gateway_mobile_daily_heartbeat_hours':
    'Shows one gateway’s daily heartbeat count, valid heartbeats, valid hours, and cell type.',
  'mobile/gateway_mobile_daily_speedtest_averages':
    'Shows one gateway’s daily average upload speed, download speed, latency, and reward multiplier.',
  'mobile/network_mobile_daily_reward':
    'Returns daily Mobile rewards across the network and the number of gateways that earned rewards.',
  'mobile/network_mobile_daily_data':
    'Shows daily Mobile data sessions, transferred bytes, rewardable bytes, and active gateways across the network.',
  'mobile/network_mobile_daily_heartbeat_hours':
    'Shows daily Mobile heartbeat coverage across the network, grouped by valid-hour thresholds.',
  'mobile/network_mobile_daily_speedtest_averages':
    'Shows daily network-wide Mobile speed-test averages and the number of gateways tested.',
  'mobile/network_mobile_top_gateways_by_sessions':
    'Ranks Mobile gateways by data-session count during the selected date range.',
  'mobile/network_mobile_top_gateways_by_data':
    'Ranks Mobile gateways by total transferred bytes during the selected date range.',

  'oui/oui_data':
    'Shows daily IoT packet, payload, and gateway activity for one OUI.',
  'oui/oui_dc_usage':
    'Returns the Data Credits burned by one OUI during the selected date range.',
  'oui/oui_packet_size_distribution':
    'Shows one row per day and payload-size range for the selected OUI.',
  'oui/oui_top_gateways_by_payload':
    'Ranks gateways serving one OUI by total payload bytes during the selected date range.',

  'delegation/active_stake':
    'Returns current HNT stake totals for delegated and undelegated positions.',
  'delegation/active_stake_by_dao':
    'Shows current locked HNT grouped by Mobile, IoT, and undelegated stake.',
  'delegation/wallet_positions':
    'Lists a wallet’s open HNT stake positions with deposit, lock, delegation, and voting-power details.',
  'delegation/delegated_positions':
    'Lists delegated HNT stake positions with their lock, subDAO, claim, and voting-power details.',
  'delegation/wallet_proxies':
    'Lists the latest vote-proxy assignments owned by or assigned to a wallet.',
  'delegation/open_positions':
    'Lists stake-position creation events, optionally filtered by authority, NFT mint, or subDAO.',
};

function readStoredOptions(name) {
  try {
    const values = JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${name}.json`), 'utf8'));
    return Array.isArray(values) ? values.map(String) : [];
  } catch {
    return [];
  }
}

const STORED_OPTIONS = {
  makers: readStoredOptions('makers'),
  regions: readStoredOptions('regions'),
  datarates: readStoredOptions('datarates'),
  ouis: readStoredOptions('ouis'),
};

const FRAGMENT_TO_PARAMS = {
  lookup_filter: ['address', 'entity_key', 'entity_key_b64', 'asset_id', 'key_to_asset_key'],
  hotspot_filter: ['address'],
  hotspot_filter_radio: ['address'],
  hotspot_filter_gateway: ['address'],
  address_filter: ['address'],
  entity_key_filter: ['entity_key'],
  asset_id_filter: ['asset_id'],
  key_to_asset_filter: ['key_to_asset_key'],
  wallet_filter: ['wallet'],
  wallet_match: ['wallet', 'role'],
  authority_filter: ['authority'],
  nft_mint_filter: ['nft_mint'],
  subdao_filter: ['sub_dao', 'network'],
  status_filter: ['status'],
  maker_filter: ['maker'],
  type_filter: ['packet_type'],
  free_filter: ['free'],
};

const PARAM_DISPLAY_ORDER = [
  'start_date',
  'end_date',
  'bucket',
  'min_date',
  'address',
  'entity_key',
  'entity_key_b64',
  'asset_id',
  'key_to_asset_key',
  'wallet',
  'role',
  'oui_id',
  'cbsd_id',
  'authority',
  'nft_mint',
  'sub_dao',
  'network',
  'maker',
  'status',
  'packet_type',
  'free',
  'offset',
  'limit',
];

const PARAM_META = {
  start_date: { desc: '' },
  end_date: { desc: '' },
  entity_key: { desc: '' },
  entity_key_b64: { desc: '' },
  address: { desc: '' },
  bucket: { desc: '' },
  offset: { desc: '' },
  limit: { desc: '' },
  oui_id: { desc: '' },
  cbsd_id: { desc: '' },
  min_date: { desc: '' },
  now_ts: { desc: '' },
  wallet: { desc: '' },
  role: { desc: '' },
  nft_mint: { desc: '' },
  sub_dao: { desc: '' },
  network: { desc: '' },
  authority: { desc: '' },
  status: { desc: '' },
  maker: { desc: '' },
  asset_id: { desc: '' },
  key_to_asset_key: { desc: '' },
  packet_type: { desc: '' },
  free: { desc: '' },
};

/** Reference docs for Methods card (not shown under parameter inputs). */
const PARAM_METHOD_DOCS = {
  month: {
    type: 'month (YYYY-MM)',
    default: 'current month',
    desc: 'Calendar month to query. Use either month or from/to, not both.',
  },
  from: {
    type: 'date (YYYY-MM-DD)',
    default: 'first day of current month',
    desc: 'Inclusive start date. Must be paired with to; ranges are limited to 30 days.',
  },
  to: {
    type: 'date (YYYY-MM-DD)',
    default: 'yesterday',
    desc: 'Inclusive end date. Must be paired with from and cannot be in the future.',
  },
  hotspot_key: {
    type: 'string',
    default: '—',
    desc: 'Gateway key, entity key, base64 entity key, asset ID, or key-to-asset account key.',
  },
  include_operational: {
    type: 'false | true',
    default: 'false',
    desc: 'Include operational-fund rewards in the network reward total.',
  },
  region: { type: 'string', default: 'empty (all)', desc: 'LoRa RF region.' },
  datarate: { type: 'string', default: 'empty (all)', desc: 'LoRa datarate such as SF7BW125.' },
  type: { type: 'join | uplink', default: 'empty (all)', desc: 'IoT packet type.' },
  billing: { type: 'paid | free', default: 'empty (all)', desc: 'Filter DC-billed or free traffic.' },
  position_authority: { type: 'string', default: 'empty', desc: 'Position authority wallet.' },
  subdao: { type: 'string', default: 'empty', desc: 'Mobile, IoT, or a sub-DAO account.' },
  start_date: {
    type: 'date (YYYY-MM-DD)',
    default: '7 days before today',
    desc: 'Inclusive lower bound on partition_0. With bucket day/week/hour, one row per bucket in this range.',
  },
  end_date: {
    type: 'date (YYYY-MM-DD)',
    default: 'today',
    desc: 'Inclusive upper bound on partition_0.',
  },
  bucket: {
    type: 'hour | day | week | total',
    default: 'day',
    desc: 'Rollup granularity inside the date range. total = single row for the whole window.',
  },
  min_date: {
    type: 'date (YYYY-MM-DD)',
    default: '2024-01-01',
    desc: 'Partition floor (meta freshness query).',
  },
  entity_key: { type: 'string', default: 'empty (all)', desc: 'Helium entity key filter.' },
  entity_key_b64: { type: 'string', default: 'empty', desc: 'Base64-encoded Helium entity key.' },
  address: { type: 'string', default: 'empty (all)', desc: 'Gateway signing pubkey (base58).' },
  asset_id: { type: 'string', default: 'empty', desc: 'Gateway compressed-NFT asset ID.' },
  key_to_asset_key: { type: 'string', default: 'empty', desc: 'Key-to-asset account pubkey.' },
  wallet: { type: 'string', default: 'empty', desc: 'Solana wallet pubkey.' },
  role: { type: 'owner | proxy', default: 'owner', desc: 'Wallet proxy role (wallet_proxies).' },
  oui_id: { type: 'string', default: '—', desc: 'LoRaWAN OUI id (alias query param: oui). Required for OUI endpoints.' },
  cbsd_id: { type: 'string', default: 'empty', desc: 'Mobile radio CBSD id.' },
  offset: { type: 'integer', default: '0', desc: 'Pagination offset (SQL OFFSET).' },
  limit: { type: 'integer', default: '100', desc: 'Pagination limit (SQL LIMIT).' },
  nft_mint: { type: 'string', default: 'empty', desc: 'Stake NFT mint.' },
  sub_dao: { type: 'string', default: 'empty', desc: 'Sub-DAO mint address.' },
  network: { type: 'Mobile | IoT', default: 'empty', desc: 'Network shorthand (maps to sub-DAO mint).' },
  authority: { type: 'string', default: 'empty', desc: 'Position authority (alias: position_authority).' },
  status: { type: 'delegated | undelegated', default: 'empty', desc: 'Delegation status filter.' },
  maker: { type: 'string', default: 'empty', desc: 'Gateway maker name. Leave empty to include all makers.' },
  packet_type: { type: 'string', default: 'empty', desc: 'IoT packet type (alias: type).' },
  free: { type: 'true | false', default: 'empty', desc: 'Free vs paid IoT packets.' },
  now_ts: { type: 'integer (unix s)', default: 'current UTC', desc: 'Reference time for delegation lock / voting power.' },
};

function parseHeader(sql) {
  const lines = sql.split('\n').slice(0, 5);
  let queryName = null;
  const desc = [];
  for (const line of lines) {
    const qn = line.match(/^--\s*query_name:\s*(\S+)/);
    if (qn) {
      queryName = qn[1];
      const rest = line.replace(/^--\s*query_name:\s*\S+\s*/, '').replace(/^--\s*/, '').trim();
      if (rest) desc.push(rest);
      continue;
    }
    if (line.startsWith('--') && queryName) {
      const t = line.replace(/^--\s*/, '').trim();
      if (t) desc.push(t);
    } else if (!line.startsWith('--') && line.trim()) break;
  }
  return { queryName, description: desc.join(' ').trim() };
}

function extractSqlPlaceholders(sql) {
  const found = new Set();
  const re = /\{([a-z_]+)\}/g;
  let m;
  while ((m = re.exec(sql))) found.add(m[1]);
  return found;
}

function apiParamsForSql(sql) {
  const raw = extractSqlPlaceholders(sql);
  const params = new Set();
  for (const key of raw) {
    if (FRAGMENT_TO_PARAMS[key]) FRAGMENT_TO_PARAMS[key].forEach((p) => params.add(p));
    else params.add(key);
  }
  return sortParamsForDisplay([...params]);
}

function sortParamsForDisplay(params) {
  const rank = new Map(PARAM_DISPLAY_ORDER.map((p, i) => [p, i]));
  return params.sort((a, b) => {
    const ra = rank.has(a) ? rank.get(a) : 1000;
    const rb = rank.has(b) ? rank.get(b) : 1000;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

/** Output column descriptions (camelCase keys match SQL AS "…" aliases). */
const FIELD_DESCRIPTIONS = {
  address: 'Base58 signing key used to identify the gateway.',
  hotspotKey: 'Gateway signing pubkey used for PoC beacons and witnesses.',
  entityKey: 'Canonical Helium Entity Manager key for this gateway.',
  entityKeyB64: 'The same entity key encoded as base64.',
  keyToAssetKey: 'Solana account that links the Helium entity key to its compressed NFT.',
  assetId: 'Solana compressed-NFT asset ID representing the gateway.',
  keySerialization: 'Encoding used for the entity key, such as b58 or utf8.',
  dao: 'Raw Solana DAO or subDAO mint recorded for the gateway.',
  networks: 'Networks this gateway is onboarded to: IoT, Mobile, or both.',
  subDaos: 'SubDAO mint addresses for the networks this gateway is onboarded to.',
  mintDate: 'Date the gateway entity was first issued or minted, in YYYY-MM-DD format.',
  date: 'Calendar date for this row, in YYYY-MM-DD format.',
  network: 'Helium network membership: IoT or Mobile.',
  cbsdId: 'Mobile CBRS radio device ID (one gateway may have many).',
  coverageObject: 'Coverage hex snapshot UUID for Mobile reward attribution.',
  subscriberId: 'Mobile subscriber entity key (user, not gateway).',
  beaconAmount: 'IoT PoC beacon reward (whole tokens; source is bones ÷ 1e6).',
  witnessAmount: 'IoT PoC witness reward (whole tokens).',
  dcTransferAmount: 'IoT DC transfer reward (whole tokens).',
  beaconIot: 'IoT beacon rewards in whole IOT tokens.',
  witnessIot: 'IoT witness rewards in whole IOT tokens.',
  dcTransferIot: 'IoT data-transfer rewards in whole IOT tokens.',
  operationalIot: 'IoT rewards allocated to the network operational fund, in whole IOT tokens.',
  totalIot: 'Total IoT rewards in whole IOT tokens.',
  dailyReward: 'Total rewards earned on this date in whole tokens.',
  dcTransferReward: 'Mobile DC transfer reward (whole tokens).',
  pocReward: 'Mobile PoC reward for a radio (whole tokens).',
  discoveryLocationAmount: 'Mobile subscriber onboarding / discovery reward.',
  total_reward: 'Row total reward in whole tokens (sum of components).',
  totalReward: 'Row total reward in whole tokens.',
  partitionDate: 'Oracle partition date for the reward or data row.',
  rewardDate: 'Date the rewards were recorded, in YYYY-MM-DD format.',
  startPeriod: 'Reward period start (epoch / period id).',
  endPeriod: 'Reward period end (epoch / period id).',
  rewardType: 'Mobile reward line type (PoC, DC transfer, etc.).',
  snapshotDate: 'As-of date for aggregated snapshot metrics.',
  blockDate: 'Block date for on-chain or aggregated row.',
  blockTime: 'Block time (UTC) for the transaction or event.',
  bucketStart: 'Start of time bucket (hour / day / week rollup).',
  hourStart: 'Start of UTC hour bucket.',
  startDate: 'Lock or position start timestamp.',
  endDate: 'Lock or position end timestamp.',
  lockEndDate: 'Stake lock end (UTC).',
  landrushEndDate: 'Landrush phase end for the stake position.',
  expirationDate: 'Position or lock expiration (UTC).',
  lastDelegatedDate: 'Last time the position was delegated.',
  lastProxyAssignedDate: 'Last proxy assignment for the stake NFT.',
  lastClaimedEpoch: 'Most recent claimed rewards epoch.',
  hntAmount: 'HNT amount in whole HNT, rounded to four decimal places.',
  hntDelegated: 'HNT currently delegated to sub-DAOs.',
  hntUndelegated: 'HNT locked but not delegated.',
  delegatedPositions: 'Count of delegated stake positions.',
  undelegatedPositions: 'Count of undelegated stake positions.',
  positions: 'Count of open stake positions.',
  stakePercent: 'Share of total stake (%).',
  subDao: 'Sub-DAO mint (Mobile / IoT).',
  nftMint: 'Stake position NFT mint.',
  tokenSymbol: 'Staked token symbol (usually HNT).',
  amountDeposited: 'HNT deposited in the position.',
  votingPower: 'Voting power for governance (HIP-76 rules).',
  bumpSeed: 'On-chain PDA bump seed.',
  claimedEpochsBitmap: 'Bitmap of claimed reward epochs.',
  proxyWallet: 'Wallet assigned as vote proxy.',
  wallet: 'Wallet that owns the stake position or assigned the vote proxy.',
  position: 'Solana account for the stake or delegation position.',
  positions: 'Number of stake positions.',
  kind: 'Lock type: Cliff or Constant.',
  status: 'Current stake status: delegated or undelegated.',
  purged: 'Whether the delegated-position record has been purged.',
  positionAuthority: 'Authority that opened the position.',
  instructionType: 'On-chain instruction name for the event.',
  txId: 'Solana transaction signature.',
  makerName: 'Gateway maker display name.',
  makerCount: 'Number of distinct gateway makers.',
  hotspotCount: 'Number of gateways.',
  uniqueHotspots: 'Number of distinct gateways.',
  issuedCount: 'Distinct gateways issued in the period.',
  iotOnboardCount: 'Distinct gateways onboarded to IoT in the period.',
  mobileOnboardCount: 'Distinct gateways onboarded to Mobile in the period.',
  firstMintDate: 'Earliest issue or onboard date for this maker.',
  lastMintDate: 'Most recent issue or onboard date for this maker.',
  tableName: 'Oracle table name.',
  maxPartitionDate: 'Latest partition_0 date loaded for the table.',
  packetCount: 'Number of LoRaWAN / data packets.',
  totalPayloadSize: 'Sum of payload bytes.',
  avgPayloadSize: 'Average packet payload size in bytes.',
  minPayloadSize: 'Smallest packet payload size in bytes.',
  maxPayloadSize: 'Largest packet payload size in bytes.',
  payloadSize: 'Single packet payload size (bytes).',
  payloadHash: 'Packet payload hash (duplicate detection).',
  payloadSizeGroup: 'Histogram bucket for payload sizes.',
  joinCount: 'Join request packet count.',
  uplinkCount: 'Uplink packet count.',
  freeCount: 'Free packet count.',
  paidCount: 'Paid packet count.',
  paidPacketCount: 'Number of packets that consumed Data Credits.',
  freePayloadSize: 'Payload bytes on free packets.',
  paidPayloadSize: 'Payload bytes on paid packets.',
  paidPayloadBytes: 'Payload bytes carried by paid packets.',
  dataCredits: 'Estimated Data Credits consumed (one DC per 24 payload bytes per packet).',
  estimatedDc: 'Estimated Data Credits consumed, using one DC per 24 payload bytes per paid packet.',
  paidPct: 'Percentage of packets that were billed.',
  appearances: 'Times the same payload hash was seen.',
  packetType: 'IoT packet type (join, uplink, etc.).',
  dataRate: 'LoRaWAN data rate identifier.',
  region: 'RF regulatory region.',
  frequency: 'Radio frequency (Hz).',
  rssi: 'Received signal strength (dBm).',
  snr: 'Signal-to-noise ratio (dB).',
  avgRssi: 'Average RSSI over the bucket.',
  avgSnr: 'Average SNR over the bucket.',
  minRssi: 'Minimum RSSI in bucket.',
  maxRssi: 'Maximum RSSI in bucket.',
  minSnr: 'Minimum SNR in bucket.',
  maxSnr: 'Maximum SNR in bucket.',
  avgFrequency: 'Average frequency (Hz).',
  minFrequency: 'Minimum frequency in Hz.',
  maxFrequency: 'Maximum frequency in Hz.',
  oui: 'LoRaWAN OUI (organization) id.',
  netId: 'LoRaWAN NetID.',
  free: 'Whether the packet was free (boolean).',
  receivedTimestamp: 'Timestamp when the packet was received.',
  usageTimestamp: 'Mobile session usage timestamp.',
  eventId: 'Mobile data session event id.',
  payer: 'Account that paid for mobile data.',
  radioAccessTechnology: 'RAT (e.g. LTE) for the session.',
  uploadBytes: 'Upload bytes in the session or bucket.',
  downloadBytes: 'Download bytes in the session or bucket.',
  rewardableBytes: 'Bytes eligible for mobile rewards.',
  totalBytes: 'Upload + download bytes.',
  sessionCount: 'Number of mobile data sessions.',
  rewardCancelled: 'Whether the session reward was cancelled.',
  heartbeatCount: 'Mobile heartbeat events in the hour.',
  validHeartbeatCount: 'Heartbeats passing validation rules.',
  cellType: 'Mobile cell type for heartbeat validation.',
  uploadSpeedAvgBps: 'Average upload speed (bps).',
  downloadSpeedAvgBps: 'Average download speed (bps).',
  latencyAvgMs: 'Average latency (ms).',
  rewardMultiplierAvg: 'Average speedtest reward multiplier.',
  sampleCount: 'Number of speedtest samples.',
  uniqueGateways: 'Distinct gateways in the bucket.',
  rewardedGateways: 'Gateways that received rewards in the period.',
  beaconGateways: 'Gateways earning beacon rewards.',
  witnessGateways: 'Gateways earning witness rewards.',
  dcTransferGateways: 'Gateways earning DC transfer rewards.',
  rewardedRadios: 'Mobile radios rewarded in the period.',
  rewardedSubscribers: 'Mobile subscribers rewarded in the period.',
  gatewaysWithHeartbeat: 'Gateways with any heartbeat in bucket.',
  gatewaysWith4h: 'Gateways meeting 4h heartbeat threshold.',
  gatewaysWith12h: 'Gateways meeting 12h heartbeat threshold.',
  gatewaysWith18h: 'Gateways meeting 18h heartbeat threshold.',
  avgValidHours: 'Average valid heartbeat hours.',
  validHeartbeatHours: 'Number of distinct hours containing at least one valid heartbeat.',
  lastDayDcUsage: 'DC usage in the last day.',
  last7DaysDcUsage: 'DC usage in the last 7 days.',
  dcUsage: 'Data Credits burned by the OUI during the selected date range.',
  gateway: 'Gateway identifier in OUI ranking queries.',
};

const FIELD_TYPES = {
  address: 'string',
  assetId: 'string',
  entityKey: 'string',
  entityKeyB64: 'string',
  keyToAssetKey: 'string',
  keySerialization: 'string',
  dao: 'string',
  networks: 'string[]',
  subDaos: 'string[]',
  mintDate: 'date | null',
  amountDeposited: 'number',
  estimatedDc: 'integer',
  gatewaysWithHeartbeat: 'integer',
  gatewaysWith4h: 'integer',
  gatewaysWith12h: 'integer',
  gatewaysWith18h: 'integer',
  rewardMultiplierAvg: 'number',
  positions: 'integer',
  purged: 'boolean',
};

const STRING_FIELDS = new Set([
  'address',
  'assetId',
  'cellType',
  'coverageObject',
  'dao',
  'entityKey',
  'entityKeyB64',
  'eventId',
  'gateway',
  'hotspotKey',
  'instructionType',
  'keySerialization',
  'keyToAssetKey',
  'makerName',
  'network',
  'nftMint',
  'oui',
  'payer',
  'payloadHash',
  'payloadSizeGroup',
  'positionAuthority',
  'position',
  'proxyWallet',
  'radioAccessTechnology',
  'region',
  'rewardType',
  'subDao',
  'subscriberId',
  'tableName',
  'tokenSymbol',
  'txId',
  'wallet',
  'kind',
  'status',
]);

const DATE_FIELDS = new Set([
  'blockDate',
  'bucketStart',
  'date',
  'endDate',
  'expirationDate',
  'firstMintDate',
  'landrushEndDate',
  'lastDelegatedDate',
  'lastMintDate',
  'lastProxyAssignedDate',
  'lockEndDate',
  'maxPartitionDate',
  'mintDate',
  'partitionDate',
  'rewardDate',
  'snapshotDate',
  'startDate',
]);

const DATETIME_FIELDS = new Set([
  'blockTime',
  'hourStart',
  'receivedTimestamp',
  'usageTimestamp',
]);

function fieldType(field) {
  if (FIELD_TYPES[field]) return FIELD_TYPES[field];
  if (STRING_FIELDS.has(field)) return 'string';
  if (DATE_FIELDS.has(field)) return 'date';
  if (DATETIME_FIELDS.has(field)) return 'datetime';
  if (field === 'free' || field === 'rewardCancelled') return 'boolean';
  if (/^(avg|min|max)/.test(field)) return 'number';
  if (
    /(Count|Bytes|Size|Hours|Epoch|Positions|Gateways|Hotspots|Radios|Subscribers)$/.test(field) ||
    ['appearances', 'bumpSeed', 'claimedEpochsBitmap', 'frequency', 'joinCount', 'offset', 'uplinkCount'].includes(field)
  ) {
    return 'integer';
  }
  if (
    /(Amount|Reward|Iot|Pct|Percent|Power|Staked|Delegated|Undelegated|Rssi|Snr|Frequency|Bps|Ms|Multiplier|Usage)$/.test(field) ||
    ['hntAmount', 'total_reward'].includes(field)
  ) {
    return 'number';
  }
  return 'string | number | null';
}

function fieldDescription(field) {
  if (FIELD_DESCRIPTIONS[field]) return FIELD_DESCRIPTIONS[field];
  const snake = field.replace(/([A-Z])/g, '_$1').toLowerCase();
  if (FIELD_DESCRIPTIONS[snake]) return FIELD_DESCRIPTIONS[snake];
  return '';
}

function parseOutputColumns(sql) {
  const cols = [];
  const seen = new Set();
  const re = /\bAS\s+"([^"]+)"/gi;
  let m;
  while ((m = re.exec(sql))) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      cols.push({
        field: m[1],
        type: fieldType(m[1]),
        description: fieldDescription(m[1]),
      });
    }
  }
  return cols;
}

function titleCase(name) {
  return name
    .split('_')
    .map((w) => {
      if (['dao', 'hnt', 'iot', 'oui'].includes(w.toLowerCase())) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

function groupLabel(g) {
  if (g === 'hotspot') return 'Gateway';
  if (g === 'delegation') return 'Delegations';
  if (g === 'iot') return 'IoT';
  if (g === 'oui') return 'OUI';
  return g.charAt(0).toUpperCase() + g.slice(1);
}

function endpointTitle(group, name) {
  return ENDPOINT_TITLES[`${group}/${name}`] || titleCase(name);
}

function sortQueryFiles(group, files) {
  const order = ENDPOINT_ORDER[group] || [];
  const rank = new Map(order.map((name, index) => [name, index]));
  return files.sort((a, b) => {
    const aName = a.replace(/\.sql$/, '');
    const bName = b.replace(/\.sql$/, '');
    const aRank = rank.has(aName) ? rank.get(aName) : 1000;
    const bRank = rank.has(bName) ? rank.get(bName) : 1000;
    return aRank - bRank || aName.localeCompare(bName);
  });
}

function defaultDates() {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() - 1);
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  if (end < start) end.setTime(start.getTime());
  const iso = (d) => [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
  return {
    start: iso(start),
    end: iso(end),
    currentMonth: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
  };
}

function paramRequired(group, name, param) {
  if (group === 'oui' && param === 'oui_id') return true;
  if (name === 'radio_rewards_sum' && param === 'cbsd_id') return true;
  if (name === 'wallet_proxies' && param === 'wallet') return true;
  return false;
}

function paramToFilter(p, group, name, dates) {
  const meta = PARAM_META[p] || { desc: '' };
  let type = 'text';
  let options = null;
  let defaultVal = '';
  if (p === 'start_date') {
    type = 'date';
    defaultVal = '';
  } else if (p === 'end_date') {
    type = 'date';
    defaultVal = '';
  } else if (p === 'min_date') {
    type = 'date';
    defaultVal = '2024-01-01';
  } else if (p === 'bucket') {
    type = 'select';
    options = ['hour', 'day', 'week', 'total'];
    defaultVal = 'day';
  } else if (p === 'role') {
    type = 'select';
    options = ['owner', 'proxy'];
    defaultVal = 'owner';
  } else if (p === 'status') {
    type = 'select';
    options = ['delegated', 'undelegated'];
  } else if (p === 'network') {
    type = 'select';
    options = ['Mobile', 'IoT'];
  } else if (p === 'free') {
    type = 'select';
    options = ['true', 'false'];
  } else if (p === 'limit') defaultVal = '100';
  else if (p === 'offset') defaultVal = '0';

  return {
    name: p,
    label: titleCase(p),
    type,
    required: paramRequired(group, name, p),
    description: meta.desc,
    default: defaultVal,
    options,
  };
}

function filter(name, label, type = 'text', extra = {}) {
  return {
    name,
    label,
    type,
    required: false,
    description: PARAM_METHOD_DOCS[name]?.desc || '',
    default: '',
    options: null,
    ...extra,
  };
}

function dateFilters() {
  return [
    filter('from', 'From', 'date', {
      default: '',
    }),
    filter('to', 'To', 'date', {
      default: '',
    }),
  ];
}

function endpointFilters(group, name, dates, inferred) {
  const datesOnly = () => dateFilters();
  const gatewayDates = () => [
    filter('address', 'Gateway', 'text', {
      required: true,
      description: 'Gateway key, entity key, base64 entity key, asset id, or key-to-asset key.',
    }),
    ...dateFilters(),
  ];
  const hotspotDates = () => [
    filter('hotspot_key', 'Gateway key', 'text', {
      required: true,
    }),
    ...dateFilters(),
  ];
  const topLimit = () => filter('limit', 'Top N', 'select', {
    default: '10',
    options: ['10', '50', '100'],
  });
  const ouiDates = () => [
    filter('oui_id', 'OUI id', 'select', {
      required: true,
      options: STORED_OPTIONS.ouis,
      includeEmpty: true,
      emptyLabel: 'Select OUI',
    }),
    ...dateFilters(),
  ];

  if (group === 'delegation') {
    const text = (key, label = titleCase(key)) => filter(key, label);
    const network = filter('network', 'Network', 'select', {
      options: ['mobile', 'iot', 'undelegated'],
      includeEmpty: true,
      emptyLabel: 'All networks',
    });
    const byName = {
      active_stake: [],
      active_stake_by_dao: [network],
      delegated_positions: [text('wallet'), text('nft_mint', 'Stake NFT'), network],
      open_positions: [
        text('position_authority', 'Position authority'),
        text('nft_mint', 'NFT mint'),
        text('subdao', 'SubDAO'),
      ],
      wallet_positions: [text('wallet'), text('nft_mint', 'Stake NFT'), network],
      wallet_proxies: [
        filter('wallet', 'Wallet', 'text', { required: true }),
        filter('role', 'Role', 'select', { default: 'owner', options: ['owner', 'proxy'] }),
        text('nft_mint', 'Stake NFT'),
      ],
    };
    if (Object.prototype.hasOwnProperty.call(byName, name)) return byName[name];
  }

  if (group === 'hotspot') {
    const makerSelect = filter('maker', 'Maker', 'select', {
      options: STORED_OPTIONS.makers,
      includeEmpty: true,
      emptyLabel: STORED_OPTIONS.makers.length
        ? `All makers (${STORED_OPTIONS.makers.length})`
        : 'All makers',
    });
    if (name === 'hotspot_onboard_cadence') {
      return [
        ...datesOnly(),
        filter('bucket', 'Bucket', 'select', {
          default: 'day',
          options: ['day', 'week', 'month', 'total'],
        }),
      ];
    }
    const byName = {
      hotspot_by_maker: [makerSelect],
      hotspot_maker_growth: [makerSelect],
      hotspot_network_mix: [],
      hotspot_get: [
        filter('hotspot_key', 'Gateway identity', 'text', {
          required: true,
        }),
      ],
      hotspot_metrics: [],
    };
    if (Object.prototype.hasOwnProperty.call(byName, name)) return byName[name];
  }

  if (group === 'iot') {
    if (name === 'iot_datarates' || name === 'iot_regions') return [];
    if (name === 'iot_gateway_data' || name === 'iot_gateway_data_sum') return gatewayDates();
    if (name === 'iot_hotspot_reward_daily' || name === 'iot_hotspot_reward_total') {
      return hotspotDates();
    }
    if (name === 'iot_network_reward_daily') return datesOnly();
    if (name === 'iot_network_reward_total') return datesOnly();
    if (name === 'iot_packets_daily') {
      return [
        ...datesOnly(),
        filter('region', 'Region', 'select', {
          options: STORED_OPTIONS.regions,
          includeEmpty: true,
          emptyLabel: 'All regions',
        }),
        filter('datarate', 'Datarate', 'select', {
          options: STORED_OPTIONS.datarates,
          includeEmpty: true,
          emptyLabel: 'All datarates',
        }),
        filter('type', 'Packet type', 'select', {
          options: ['join', 'uplink'],
          includeEmpty: true,
          emptyLabel: 'All packet types',
        }),
        filter('billing', 'Traffic', 'select', {
          options: ['paid', 'free'],
          includeEmpty: true,
          emptyLabel: 'All traffic',
        }),
      ];
    }
    if (name === 'iot_top_hotspots_by_packet_count' || name === 'iot_top_hotspots_by_payload_size') {
      return [...datesOnly(), topLimit()];
    }
  }

  if (group === 'mobile') {
    const base = name.startsWith('gateway_') ? gatewayDates() : datesOnly();
    if (name === 'network_mobile_top_gateways_by_data' ||
        name === 'network_mobile_top_gateways_by_sessions') {
      return [...base, topLimit()];
    }
    return base;
  }

  if (group === 'oui') {
    if (name === 'oui_list') return [];
    const base = ouiDates();
    if (name === 'oui_top_gateways_by_payload') {
      return [...base, filter('limit', 'Limit', 'number', { default: '10' })];
    }
    return base;
  }

  return inferred;
}

function isQueryGroupDir(name) {
  return (
    name &&
    !name.startsWith('.') &&
    name !== 'index.html' &&
    !SKIP_QUERY_DIRS.has(name)
  );
}

function sortGroupIds(ids) {
  const set = new Set(ids);
  const ordered = GROUP_ORDER.filter((id) => set.has(id));
  const rest = [...set].filter((id) => !GROUP_ORDER.includes(id)).sort((a, b) => a.localeCompare(b));
  return [...ordered, ...rest];
}

function collectEndpoints(baseUrl) {
  const BASE = resolveBaseUrl(baseUrl);
  const dates = defaultDates();
  const endpoints = [];
  const groups = fs
    .readdirSync(QUERIES, { withFileTypes: true })
    .filter((d) => d.isDirectory() && isQueryGroupDir(d.name));
  const groupRank = new Map(GROUP_ORDER.map((name, index) => [name, index]));

  for (const g of groups.sort((a, b) => {
    const aRank = groupRank.has(a.name) ? groupRank.get(a.name) : 1000;
    const bRank = groupRank.has(b.name) ? groupRank.get(b.name) : 1000;
    return aRank - bRank || a.name.localeCompare(b.name);
  })) {
    const dir = path.join(QUERIES, g.name);
    const files = sortQueryFiles(
      g.name,
      fs.readdirSync(dir).filter((file) => {
        if (!file.endsWith('.sql')) return false;
        const name = file.replace(/\.sql$/, '');
        return !SKIP_CATALOG_QUERIES.has(`${g.name}/${name}`);
      }),
    );
    for (const file of files) {
      const name = file.replace(/\.sql$/, '');
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      const { queryName, description } = parseHeader(sql);
      const params = apiParamsForSql(sql);
      const id = `${g.name}-${name}`;
      const apiPath = `/api/helium/${g.name}/${name}`;
      const clientDescription =
        ENDPOINT_DESCRIPTIONS[`${g.name}/${name}`] ||
        description ||
        `Returns data for this ${groupLabel(g.name)} endpoint.`;
      endpoints.push({
        id,
        title: endpointTitle(g.name, name),
        query_name: queryName,
        description: clientDescription,
        long_description: clientDescription,
        method: 'GET',
        path: apiPath,
        url: BASE + apiPath,
        category: g.name,
        tag: groupLabel(g.name),
        filters: endpointFilters(
          g.name,
          name,
          dates,
          params
            .filter((p) => p !== 'now_ts')
            .map((p) => paramToFilter(p, g.name, name, dates)),
        ),
        response_schema: parseOutputColumns(sql),
      });
    }
  }

  const groupMap = new Map();
  for (const ep of endpoints) {
    if (!groupMap.has(ep.category)) {
      groupMap.set(ep.category, { id: ep.category, label: ep.tag, apis: [] });
    }
    groupMap.get(ep.category).apis.push({
      id: ep.id,
      title: ep.title,
      path: ep.path,
    });
  }

  const groupsOut = sortGroupIds([...groupMap.keys()]).map((id) => groupMap.get(id));
  return { endpoints, groups: groupsOut, dates };
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function paramMethodType(f) {
  const doc = PARAM_METHOD_DOCS[f.name];
  if (doc?.type) return doc.type;
  if (f.type === 'date') return 'date (YYYY-MM-DD)';
  if (f.type === 'month-select') return 'month (YYYY-MM)';
  if (f.type === 'number') return 'integer';
  if (f.type === 'select' && f.options?.length) {
    return f.options.map((o) => typeof o === 'object' ? o.value : o).join(' | ');
  }
  if (f.name === 'offset' || f.name === 'limit' || f.name === 'now_ts') return 'integer';
  return 'string';
}

function paramMethodDefault(f) {
  if (f.default !== undefined && String(f.default) !== '') return String(f.default);
  const doc = PARAM_METHOD_DOCS[f.name];
  return doc?.default || '—';
}

function paramMethodDesc(f) {
  if (f.description) return f.description;
  const doc = PARAM_METHOD_DOCS[f.name];
  return doc?.desc || '—';
}

function renderMethodParam(f) {
  const reqLabel = f.required ? 'Required' : 'Optional';
  const reqClass = f.required ? 'required' : 'optional';
  const def = paramMethodDefault(f);
  const hasDefault = def !== '—' && def !== 'empty (all)' && def !== 'empty';
  let usage = '';
  if (f.required) {
    usage = 'You must include this in every request.';
  } else if (hasDefault) {
    usage = `If you omit it, the server uses <code>${esc(def)}</code>.`;
  } else {
    usage = 'Optional — omit unless you need to filter by this field.';
  }
  return `<article class="method-param">
    <div class="method-param-head">
      <code class="method-param-name">${esc(f.name)}</code>
      <span class="req-pill ${reqClass}">${reqLabel}</span>
      <span class="type-pill">${esc(paramMethodType(f))}</span>
    </div>
    <p class="method-param-desc">${esc(paramMethodDesc(f))}</p>
    <p class="method-param-usage">${usage}</p>
  </article>`;
}

const SECTION_CHEVRON =
  '<svg class="section-collapse-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

const COPY_BTN_ICONS =
  '<svg class="icon-copy" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
  '<svg class="icon-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

function renderCopyIconButton(className, title, extraAttrs = '') {
  const t = esc(title);
  return `<button class="icon-btn ${className}" type="button" title="${t}" aria-label="${t}" data-copy-title="${t}"${extraAttrs}>${COPY_BTN_ICONS}</button>`;
}

function renderCollapsibleSection(title, innerBody, options = {}) {
  const open = options.open === true;
  const bodyClass = options.bodyClass || '';
  const bodyStyle = options.bodyStyle || '';
  return `<details class="section-card section-collapse methods-card"${open ? ' open' : ''}>
      <summary class="section-card-head section-collapse-summary">${SECTION_CHEVRON}<span>${esc(title)}</span></summary>
      <div class="section-card-body${bodyClass ? ' ' + bodyClass : ''}"${bodyStyle ? ` style="${bodyStyle}"` : ''}>${innerBody}</div>
    </details>`;
}

function renderParametersDocCard(item) {
  const documentedFilters = item.filters.filter((f) => f.name !== '_date_mode');
  if (!documentedFilters.length) return '';
  const paramBlocks = documentedFilters.map((f) => renderMethodParam(f)).join('');
  return renderCollapsibleSection(
    'Parameters',
    `<div class="method-param-list">${paramBlocks}</div>`
  );
}

const DATE_RANGE_PAIRS = [
  ['from', 'to'],
  ['start_date', 'end_date'],
];

function isDateRangePair(a, b) {
  if (!a || !b || a.type !== 'date' || b.type !== 'date') return false;
  return DATE_RANGE_PAIRS.some(([startName, endName]) => a.name === startName && b.name === endName);
}

const DATE_RANGE_CAL_ICON =
  '<svg class="date-range-cal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>';

function renderDateRangeFilter(startF, endF, itemId) {
  const dateMode = startF.date_mode || endF.date_mode;
  const isInactiveDateMode = dateMode && dateMode !== 'month';
  const disabledAttr = isInactiveDateMode ? ' data-disabled="1"' : '';
  const dateModeAttrs = dateMode
    ? ` data-date-mode="${esc(dateMode)}"${isInactiveDateMode ? ' hidden' : ''}`
    : '';
  const startVal = esc(startF.default || '');
  const endVal = esc(endF.default || '');
  const presets = [
    ['last-week', 'Last week'],
    ['last-30', 'Last 30 days'],
    ['this-week', 'This week'],
    ['this-month', 'This month'],
  ]
    .map(
      ([id, label]) =>
        `<button type="button" class="date-range-preset" data-range-preset="${id}">${esc(label)}</button>`
    )
    .join('');
  return `<div class="filter-row filter-row-span-2 date-range-filter-row" data-filter-type="date-range"${dateModeAttrs}>
    <div class="date-range-picker"${disabledAttr} id="dr-${esc(itemId)}">
      <div class="date-range-top">
        <div class="date-range-fields">
          <div class="date-range-field">
            <span class="date-range-field-label">Start day</span>
            <div class="date-range-input-wrap">
              ${DATE_RANGE_CAL_ICON}
              <input type="text" class="date-range-display" id="dr-${esc(itemId)}-start" data-range-part="start-input" data-name="${esc(startF.name)}" value="${startVal}" placeholder="YYYY-MM-DD" autocomplete="off" spellcheck="false" inputmode="text">
            </div>
          </div>
          <span class="date-range-field-arrow" aria-hidden="true">→</span>
          <div class="date-range-field">
            <span class="date-range-field-label">End day</span>
            <div class="date-range-input-wrap">
              ${DATE_RANGE_CAL_ICON}
              <input type="text" class="date-range-display" data-range-part="end-input" data-name="${esc(endF.name)}" value="${endVal}" placeholder="YYYY-MM-DD" autocomplete="off" spellcheck="false" inputmode="text">
            </div>
          </div>
        </div>
        <div class="date-range-presets-row">
          <div class="date-range-presets">${presets}</div>
          <span class="date-range-max-note">Max 30 days</span>
        </div>
      </div>
      <div class="date-range-calendar">
        <div class="date-range-calendar-bar">
          <span class="date-range-summary" data-range-part="range-summary"></span>
          <div class="date-range-month-nav">
            <button type="button" data-range-part="prev-month" aria-label="Previous month">‹</button>
            <button type="button" data-range-part="next-month" aria-label="Next month">›</button>
          </div>
        </div>
        <span class="date-range-hint" data-range-part="range-hint" hidden></span>
        <div class="date-range-months">
          <div class="date-range-month-pane">
            <div class="date-range-month-title" data-range-part="month-label-0"></div>
            <div class="date-range-weekdays" aria-hidden="true">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
            <div class="date-range-grid" data-range-part="grid-0"></div>
          </div>
          <div class="date-range-month-pane">
            <div class="date-range-month-title" data-range-part="month-label-1"></div>
            <div class="date-range-weekdays" aria-hidden="true">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
            <div class="date-range-grid" data-range-part="grid-1"></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderFiltersForPanel(filters, itemId) {
  const parts = [];
  for (let i = 0; i < filters.length; ) {
    const f = filters[i];
    const next = filters[i + 1];
    if (isDateRangePair(f, next)) {
      parts.push(renderDateRangeFilter(f, next, itemId));
      i += 2;
    } else {
      parts.push(renderFilter(f, itemId));
      i += 1;
    }
  }
  return parts.join('');
}

function renderFilter(f, itemId) {
  const fid = `f-${itemId}-${f.name}`;
  let input = '';
  const isInactiveDateMode = f.date_mode && f.date_mode !== 'month';
  const disabled = isInactiveDateMode ? ' disabled' : '';
  if (f.type === 'select') {
    const empty = f.includeEmpty
      ? `<option value="">${esc(f.emptyLabel || 'All')}</option>`
      : '';
    const opts = (f.options || [])
      .map((option) => {
        const value = typeof option === 'object' ? option.value : option;
        const label = typeof option === 'object' ? option.label : option;
        return `<option value="${esc(value)}"${String(f.default) === String(value) ? ' selected' : ''}>${esc(label)}</option>`;
      })
      .join('');
    input = `<select id="${fid}" data-name="${esc(f.name)}"${disabled}>${empty}${opts}</select>`;
  } else if (f.type === 'date-mode') {
    const opts = (f.options || [])
      .map((option) => `<option value="${esc(option.value)}"${f.default === option.value ? ' selected' : ''}>${esc(option.label)}</option>`)
      .join('');
    input = `<select id="${fid}" class="date-mode-select">${opts}</select>`;
  } else if (f.type === 'month-select') {
    const opts = (f.options || [])
      .map((o) => `<option value="${esc(o)}"${f.default === o ? ' selected' : ''}>${esc(o)}</option>`)
      .join('');
    input = `<select id="${fid}" data-name="${esc(f.name)}"${disabled}>${opts}</select>`;
  } else if (f.type === 'date') {
    input = `<input id="${fid}" type="date" data-name="${esc(f.name)}" value="${esc(f.default || '')}"${disabled}>`;
  } else if (f.type === 'number') {
    input = `<input id="${fid}" type="number" data-name="${esc(f.name)}" value="${esc(f.default || '')}"${disabled}>`;
  } else {
    input = `<input id="${fid}" type="text" data-name="${esc(f.name)}" value="${esc(f.default || '')}" placeholder="${esc(f.name)}"${disabled}>`;
  }
  const dateModeAttrs = f.date_mode
    ? ` data-date-mode="${esc(f.date_mode)}"${isInactiveDateMode ? ' hidden' : ''}`
    : '';
  return `<div class="filter-row" data-filter="${esc(f.name)}" data-filter-type="${esc(f.type)}"${dateModeAttrs}>
    <label for="${fid}">${esc(f.label)}${f.required ? ' *' : ''}</label>
    ${input}
  </div>`;
}

function renderCodeSamplesCard(item) {
  const initialShell = `curl -s '${item.url.replace(/'/g, "'\\''")}'`;
  const lineCount = initialShell.split('\n').length;
  const gutter = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
  return `<div class="section-card code-samples-card">
      <div class="section-card-head">Client libraries</div>
      <div class="code-tabs-row">
        <div class="code-tabs" role="tablist">
          <button type="button" class="code-tab active" data-lang="shell" role="tab">Shell</button>
          <button type="button" class="code-tab" data-lang="node" role="tab">Node.js</button>
          <button type="button" class="code-tab" data-lang="python" role="tab">Python</button>
          <button type="button" class="code-tab" data-lang="rust" role="tab">Rust</button>
        </div>
        ${renderCopyIconButton('copy-code-btn', 'Copy code')}
      </div>
      <div class="code-editor-pane">
        <div class="code-editor-ln" aria-hidden="true">${gutter}</div>
        <pre class="code-sample-pre"><code>${esc(initialShell)}</code></pre>
      </div>
    </div>`;
}

function renderSampleCard() {
  return `<div class="section-card sample-card sample-collapsed">
      <div class="section-card-head sample-card-head" style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <span>Response</span>
        <div class="sample-toolbar">
          ${renderCopyIconButton('copy-sample-btn', 'Copy JSON', ' disabled')}
          <button class="icon-btn download-sample-csv-btn" type="button" title="Download CSV" aria-label="Download CSV" disabled>
            <svg viewBox="0 0 24 24"><path d="M12 3v12m0 0l4-4m-4 4l-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
          </button>
          <button class="btn load-sample-btn" type="button">Load response</button>
        </div>
      </div>
      <div class="section-card-body sample-card-body" hidden>
        <div class="sample-meta" hidden></div>
        <input class="sample-search" type="search" placeholder="Search response…" autocomplete="off" disabled>
        <div class="sample-view-tabs" role="tablist" hidden>
          <button type="button" class="sample-view-tab active" data-sample-view="json" role="tab" aria-selected="true">JSON</button>
          <button type="button" class="sample-view-tab" data-sample-view="table" role="tab" aria-selected="false">Table</button>
        </div>
        <div class="sample-body"></div>
      </div>
      <div class="sample-edge-progress" aria-hidden="true"><div class="sample-edge-progress-fill"></div></div>
    </div>`;
}

function renderPanel(item, isFirst) {
  const dataJson = JSON.stringify(item).replace(/</g, '\\u003c');
  const filtersHtml = item.filters.length
    ? `<div class="section-card params-card">
        <div class="section-card-head">Request</div>
        <div class="section-card-body"><div class="filter-grid">${renderFiltersForPanel(item.filters, item.id)}</div></div>
      </div>`
    : '';

  const schemaBody = item.response_schema.length
    ? `<table class="schema-table">
            <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
            <tbody>${item.response_schema
              .map((col) => {
                const desc = col.description || '—';
                return `<tr><td><code>${esc(col.field)}</code></td><td><span class="type-pill">${esc(col.type)}</span></td><td class="schema-desc">${esc(desc)}</td></tr>`;
              })
              .join('')}</tbody>
          </table>`
    : `<p class="hint" style="margin:0;padding:16px">No schema columns parsed — load the response to inspect its fields.</p>`;

  const schemaHtml = renderCollapsibleSection('Response schema', schemaBody, {
    bodyStyle: 'padding:0;overflow-x:auto',
  });

  return `<div id="panel-ep-${esc(item.id)}" class="panel${isFirst ? ' active' : ''}" data-endpoint='${dataJson}'>
    <div class="panel-eyebrow">${esc(item.tag)}</div>
    <h1>${esc(item.title)}</h1>
    <p class="panel-desc">${esc(item.long_description || item.description)}</p>
    <div class="panel-row-endpoint">
      <div class="section-card">
        <div class="section-card-head">Endpoint</div>
        <div class="section-card-body">
          <div class="path-bar">
            <span class="m">${item.method}</span>
            <span class="p endpoint-url-text">${esc(item.path)}</span>
            ${renderCopyIconButton('copy-url-btn', 'Copy URL')}
          </div>
        </div>
      </div>
    </div>
    <div class="panel-row-split">
      <div class="panel-col-main">
        ${renderParametersDocCard(item)}
        ${schemaHtml}
        ${filtersHtml}
        ${renderSampleCard()}
      </div>
      <div class="panel-col-side">
        ${renderCodeSamplesCard(item)}
      </div>
    </div>
  </div>`;
}

function renderNav(groups, firstId) {
  let html = '';
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const openAttr = i === 0 ? ' open' : '';
    html += `<details class="nav-tag" data-tag="${esc(group.id)}" data-search="${esc(group.label)}"${openAttr}>
      <summary>
        <svg class="nav-tag-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 6 6 6-6 6"/></svg>
        <span class="nav-tag-name">${esc(group.label)}</span>
        <span class="nav-tag-count">${group.apis.length}</span>
      </summary>
      <div class="nav-tag-list">`;
    for (const api of group.apis) {
      const active = api.id === firstId ? ' active' : '';
      html += `<button class="nav-api${active}" data-panel="ep-${esc(api.id)}" data-tag="${esc(group.id)}" data-search="${esc(api.title)} ${esc(api.path)}" type="button">${esc(api.title)}</button>`;
    }
    html += '</div></details>';
  }
  return html;
}

function extractStyles() {
  const src = fs.readFileSync(STYLE_SRC, 'utf8');
  const m = src.match(/<style>([\s\S]*?)<\/style>/);
  if (!m) throw new Error('Could not extract <style> from index.html');
  return m[1];
}

function runtimeScript(dates) {
  return `    const BASE = window.location.origin;
    document.getElementById("header-api-base").textContent = BASE;
    const DEFAULT_FROM = ${JSON.stringify(dates.start)};
    const DEFAULT_TO = ${JSON.stringify(dates.end)};
    const STORED_MAKERS = [];

${DATE_RANGE_PICKER_RUNTIME}

    (function initSidebarToggle() {
      var shell = document.querySelector(".shell");
      var toggle = document.getElementById("sidebar-toggle");
      var storageKey = "helium-apis-sidebar-collapsed";
      function setCollapsed(collapsed) {
        if (!shell) return;
        shell.classList.toggle("sidebar-collapsed", collapsed);
        if (toggle) {
          toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
          toggle.setAttribute("aria-label", collapsed ? "Show API sidebar" : "Hide API sidebar");
        }
        try { localStorage.setItem(storageKey, collapsed ? "1" : "0"); } catch (e) {}
      }
      try {
        if (localStorage.getItem(storageKey) === "1") setCollapsed(true);
      } catch (e) {}
      toggle?.addEventListener("click", function() {
        setCollapsed(!shell.classList.contains("sidebar-collapsed"));
      });
    })();

    const navItems = document.querySelectorAll(".nav-api");
    const panels = document.querySelectorAll(".panel");

    function copyToClipboardFallback(text) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, text.length);
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch (e) {
        return false;
      }
    }

    function copyToClipboard(text) {
      if (!text) return Promise.resolve(false);
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(function() { return true; }).catch(function() {
          return copyToClipboardFallback(text);
        });
      }
      return Promise.resolve(copyToClipboardFallback(text));
    }

    function showCopyFeedback(btn) {
      if (!btn) return;
      if (!btn.dataset.copyTitle) btn.dataset.copyTitle = btn.getAttribute("title") || "Copy";
      btn.classList.add("copied");
      btn.setAttribute("title", "Copied");
      btn.setAttribute("aria-label", "Copied");
      setTimeout(function() {
        btn.classList.remove("copied");
        var restore = btn.dataset.copyTitle || "Copy";
        btn.setAttribute("title", restore);
        btn.setAttribute("aria-label", restore);
      }, 1500);
    }

    function bindCopyButton(btn, getText) {
      if (!btn) return;
      btn.addEventListener("click", function() {
        var text = typeof getText === "function" ? getText() : getText;
        copyToClipboard(text).then(function(ok) {
          if (ok) showCopyFeedback(btn);
        });
      });
    }

    function showPanel(id) {
      panels.forEach((p) => p.classList.toggle("active", p.id === "panel-" + id));
      navItems.forEach((n) => n.classList.toggle("active", n.dataset.panel === id));
      const btn = document.querySelector('.sidebar .nav-api[data-panel="' + id + '"]');
      const tag = btn && btn.closest(".nav-tag");
      if (tag) tag.open = true;
    }

    navItems.forEach((btn) => {
      btn.addEventListener("click", () => showPanel(btn.dataset.panel));
    });

    document.getElementById("nav-search").addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      document.querySelectorAll(".sidebar .nav-tag").forEach((tag) => {
        const label = (tag.dataset.search || "").toLowerCase();
        let visible = 0;
        tag.querySelectorAll(".nav-api").forEach((btn) => {
          const hay = (btn.dataset.search || btn.textContent).toLowerCase();
          const match = !q || hay.includes(q);
          btn.classList.toggle("hidden", !match);
          if (match) visible += 1;
        });
        tag.classList.toggle("hidden", q && visible === 0);
        if (q && visible) tag.open = true;
      });
    });

    function buildUrl(panel) {
      const data = JSON.parse(panel.dataset.endpoint);
      let path = data.path;
      const params = new URLSearchParams();
      panel.querySelectorAll("[data-name]").forEach((input) => {
        if (input.disabled) return;
        const name = input.dataset.name;
        const val = (input.value || "").trim();
        if (val) params.set(name, val);
      });
      const qs = params.toString();
      return BASE + path + (qs ? "?" + qs : "");
    }

    function buildCodeSnippets(fullUrl) {
      const q = JSON.stringify(fullUrl);
      return {
        shell: "curl -s " + q,
        node: [
          "const url = " + q + ";",
          "",
          "const res = await fetch(url);",
          "if (!res.ok) throw new Error(await res.text());",
          "console.log(await res.text());"
        ].join("\\n"),
        python: [
          "import urllib.request",
          "",
          "url = " + q,
          "with urllib.request.urlopen(url) as response:",
          "    print(response.read().decode())"
        ].join("\\n"),
        rust: [
          "fn main() -> Result<(), Box<dyn std::error::Error>> {",
          "    let url = " + q + ";",
          "    let resp = reqwest::blocking::get(url)?;",
          "    println!(\\"{}\\", resp.text()?);",
          "    Ok(())",
          "}"
        ].join("\\n")
      };
    }

    function escHtml(t) {
      return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function highlightCode(text, lang) {
      return text.split("\\n").map(function(line) {
        var l = escHtml(line);
        l = l.replace(/("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')/g, '<span class="tok-str">$1</span>');
        l = l.replace(/\\b(require|const|await|async|if|throw|new|echo|puts|function|return|import|with|as|fn|let|mut|Ok)\\b/g, '<span class="tok-kw">$1</span>');
        l = l.replace(/\\b(curl_setopt|curl_init|curl_exec|curl_close|curl_error|urlopen|read|decode|print)\\b/g, '<span class="tok-fn">$1</span>');
        l = l.replace(/\\b(curl|fetch|console|Net::HTTP|URI|Exception|reqwest|println)\\b/g, '<span class="tok-fn">$1</span>');
        if (lang === "python") {
          l = l.replace(/\\b(import|from|with|as|print)\\b/g, '<span class="tok-kw">$1</span>');
        }
        if (lang === "rust") {
          l = l.replace(/\\b(fn|let|mut|Ok|Result)\\b/g, '<span class="tok-kw">$1</span>');
        }
        if (lang === "shell") {
          l = l.replace(/\\bcurl\\b/g, '<span class="tok-shell">curl</span>');
          l = l.replace(/(-s|-G|-H)\\b/g, '<span class="tok-kw">$1</span>');
        }
        return l;
      }).join("\\n");
    }

    function paintCodePanel(panel, lang, text) {
      const codeEl = panel.querySelector(".code-sample-pre code");
      const gutter = panel.querySelector(".code-editor-ln");
      if (!codeEl) return;
      panel._codePlain = text;
      const lines = text.split("\\n");
      if (gutter) gutter.textContent = lines.map(function(_, i) { return String(i + 1); }).join("\\n");
      codeEl.innerHTML = highlightCode(text, lang);
    }

    function showCodeTab(panel, lang) {
      panel.querySelectorAll(".code-tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.lang === lang);
      });
      const text =
        (panel._codeSamples && panel._codeSamples[lang]) ||
        (lang === "shell" ? "curl -s " + JSON.stringify(buildUrl(panel)) : "");
      paintCodePanel(panel, lang, text);
    }

    function syncCodeSamples(panel) {
      const url = buildUrl(panel);
      panel._codeSamples = buildCodeSnippets(url);
      const active = panel.querySelector(".code-tab.active");
      showCodeTab(panel, active ? active.dataset.lang : "shell");
    }

    function sampleRows(data) {
      if (!data) return [];
      if (Array.isArray(data.rows)) return data.rows;
      if (Array.isArray(data.records)) return data.records;
      if (data.record && typeof data.record === "object") return [data.record];
      if (Array.isArray(data)) return data;
      return [];
    }

    function describeSampleResult(preview, shown, total) {
      if (preview && preview.success === false) return preview.error || "Request failed";
      const n = shown != null ? shown : sampleRows(preview).length;
      const all = total != null ? total : n;
      if (n !== all) return n + " of " + all + " rows (filtered)";
      if (n === 1) return "1 row returned";
      return n + " rows returned";
    }

    function filterRowsByQuery(rows, q) {
      if (!q) return rows;
      const needle = q.toLowerCase();
      return rows.filter(function(row) {
        return JSON.stringify(row || {}).toLowerCase().includes(needle);
      });
    }

    function formatColumnLabel(key) {
      return String(key)
        .replace(/_/g, " ")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .trim()
        .split(/\s+/)
        .map(function(w) {
          var lower = w.toLowerCase();
          if (lower === "hnt" || lower === "iot" || lower === "oui" || lower === "dao") return w.toUpperCase();
          return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(" ");
    }

    function buildSampleTableHtml(rows) {
      if (!rows.length) return '<p class="sample-table-empty">No rows match.</p>';
      const keys = [];
      const seen = {};
      rows.forEach(function(row) {
        if (!row || typeof row !== "object") return;
        Object.keys(row).forEach(function(k) {
          if (!seen[k]) { seen[k] = true; keys.push(k); }
        });
      });
      if (!keys.length) return '<p class="sample-table-empty">No columns in rows.</p>';
      const head = keys.map(function(k) { return "<th>" + escHtml(formatColumnLabel(k)) + "</th>"; }).join("");
      const body = rows.map(function(row) {
        const cells = keys.map(function(k) {
          const v = row[k];
          const text = v === null || v === undefined ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v));
          return "<td>" + escHtml(text) + "</td>";
        }).join("");
        return "<tr>" + cells + "</tr>";
      }).join("");
      return '<div class="sample-table-wrap"><table class="sample-table"><thead><tr>' + head + '</tr></thead><tbody>' + body + "</tbody></table></div>";
    }

    function setSampleViewTab(panel, view) {
      panel.querySelectorAll(".sample-view-tab").forEach(function(tab) {
        const on = tab.dataset.sampleView === view;
        tab.classList.toggle("active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });
      panel.querySelectorAll(".sample-pane").forEach(function(pane) {
        pane.classList.toggle("active", pane.dataset.samplePane === view);
      });
    }

    function renderSampleContent(panel) {
      const data = panel._samplePreview;
      if (!data) return;
      const body = panel.querySelector(".sample-body");
      const tabs = panel.querySelector(".sample-view-tabs");
      const searchEl = panel.querySelector(".sample-search");
      const q = (searchEl && searchEl.value || "").trim();
      const allRows = sampleRows(data);
      const rows = filterRowsByQuery(allRows, q);
      const preview = Object.assign({}, data, { count: rows.length, rows: rows });
      panel._sampleJson = JSON.stringify(preview, null, 2);
      const view = panel._sampleView || "json";
      body.className = "sample-body sample-loaded";
      body.innerHTML =
        '<div class="sample-pane sample-pane-json' + (view === "json" ? " active" : "") + '" data-sample-pane="json">' +
        '<pre class="sample-pre">' + escHtml(panel._sampleJson) + "</pre></div>" +
        '<div class="sample-pane sample-pane-table' + (view === "table" ? " active" : "") + '" data-sample-pane="table">' +
        buildSampleTableHtml(rows) + "</div>";
      if (tabs) tabs.hidden = false;
      setSampleViewTab(panel, view);
      const meta = panel.querySelector(".sample-meta");
      if (meta) {
        meta.hidden = false;
        meta.textContent = describeSampleResult(data, rows.length, allRows.length);
      }
    }

    function collapseSamplePanel(panel) {
      const card = panel.querySelector(".sample-card");
      const wrap = panel.querySelector(".sample-card-body");
      if (card) {
        card.classList.add("sample-collapsed");
        card.classList.remove("sample-expanded");
      }
      if (wrap) wrap.hidden = true;
    }

    function expandSamplePanel(panel) {
      const card = panel.querySelector(".sample-card");
      const wrap = panel.querySelector(".sample-card-body");
      if (card) {
        card.classList.remove("sample-collapsed");
        card.classList.add("sample-expanded");
      }
      if (wrap) wrap.hidden = false;
    }

    function sampleDownloadBaseName(panel) {
      const data = JSON.parse(panel.dataset.endpoint);
      return (data.path || "sample").replace(/^\\/api\\/helium\\//, "").replace(/\\//g, "_");
    }

    function downloadBlob(filename, blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    }

    function csvEscapeCell(value) {
      if (value === null || value === undefined) return "";
      var s = typeof value === "object" ? JSON.stringify(value) : String(value);
      if (/[",\\n\\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }

    function rowsToCsv(rows) {
      if (!rows.length) return "";
      var keys = [];
      var seen = {};
      rows.forEach(function(row) {
        if (!row || typeof row !== "object") return;
        Object.keys(row).forEach(function(k) {
          if (!seen[k]) { seen[k] = true; keys.push(k); }
        });
      });
      if (!keys.length) return "";
      var lines = [keys.map(csvEscapeCell).join(",")];
      rows.forEach(function(row) {
        lines.push(keys.map(function(k) { return csvEscapeCell(row ? row[k] : ""); }).join(","));
      });
      return lines.join("\\n") + "\\n";
    }

    function downloadSampleCsv(panel) {
      if (!panel._samplePreview) return;
      var rows = sampleRows(panel._samplePreview);
      var csv = rowsToCsv(rows);
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      downloadBlob(sampleDownloadBaseName(panel) + ".csv", blob);
    }

    function setSampleActions(panel, enabled) {
      const copyBtn = panel.querySelector(".copy-sample-btn");
      const csvBtn = panel.querySelector(".download-sample-csv-btn");
      if (copyBtn) copyBtn.disabled = !enabled;
      if (csvBtn) csvBtn.disabled = !enabled;
    }

    const LOAD_SAMPLE_BTN_LABEL = "Load response";

    function formatElapsed(ms) {
      const totalSeconds = Math.max(0, Math.floor(ms / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      return minutes + ":" + seconds;
    }

    function setLoadSampleBtnRunning(panel, elapsed) {
      const loadBtn = panel.querySelector(".load-sample-btn");
      if (!loadBtn) return;
      loadBtn.disabled = false;
      loadBtn.textContent = "Cancel · " + formatElapsed(elapsed);
      loadBtn.title = "Query running. Click to cancel.";
    }

    function resetLoadSampleBtn(panel, enabled) {
      const loadBtn = panel.querySelector(".load-sample-btn");
      if (!loadBtn) return;
      loadBtn.textContent = LOAD_SAMPLE_BTN_LABEL;
      loadBtn.disabled = !enabled;
      loadBtn.title = "";
    }

    function setSampleRunning(panel, elapsed) {
      const card = panel.querySelector(".sample-card");
      if (card) card.classList.add("sample-fetching");
      setLoadSampleBtnRunning(panel, elapsed);
    }

    function stopSampleProgress(panel) {
      if (panel._progressTimer) clearInterval(panel._progressTimer);
      panel._progressTimer = null;
    }

    function startSampleProgress(panel) {
      panel._progressStart = performance.now();
      const fill = panel.querySelector(".sample-edge-progress-fill");
      if (fill) {
        fill.style.width = "";
        fill.style.animation = "";
        fill.style.transform = "";
      }
      const tick = () => {
        const elapsed = performance.now() - panel._progressStart;
        setSampleRunning(panel, elapsed);
      };
      tick();
      panel._progressTimer = setInterval(tick, 250);
    }

    function hideSampleProgress(panel) {
      const card = panel.querySelector(".sample-card");
      const fill = panel.querySelector(".sample-edge-progress-fill");
      if (card) card.classList.remove("sample-fetching");
      if (fill) {
        fill.style.width = "";
        fill.style.animation = "";
        fill.style.transform = "";
      }
      resetLoadSampleBtn(panel, true);
    }

    function finishSampleProgress(panel, ok) {
      stopSampleProgress(panel);
      if (ok) {
        const elapsed = performance.now() - panel._progressStart;
        const loadBtn = panel.querySelector(".load-sample-btn");
        const fill = panel.querySelector(".sample-edge-progress-fill");
        if (fill) {
          fill.style.animation = "none";
          fill.style.transform = "translateX(0)";
          fill.style.width = "100%";
        }
        if (loadBtn) {
          loadBtn.disabled = true;
          loadBtn.textContent = "Done · " + formatElapsed(elapsed);
          loadBtn.title = "";
        }
        return new Promise(function(resolve) {
          setTimeout(function() {
            hideSampleProgress(panel);
            resolve();
          }, 220);
        });
      }
      hideSampleProgress(panel);
      return Promise.resolve();
    }

    async function loadSample(panel) {
      if (panel._abortController) {
        panel._abortController.abort();
        return;
      }
      const body = panel.querySelector(".sample-body");
      if (!body) return;
      collapseSamplePanel(panel);
      panel._sampleJson = "";
      panel._samplePreview = null;
      const searchEl = panel.querySelector(".sample-search");
      const tabsEl = panel.querySelector(".sample-view-tabs");
      const metaEl = panel.querySelector(".sample-meta");
      if (metaEl) metaEl.hidden = true;
      if (searchEl) { searchEl.disabled = true; searchEl.value = ""; }
      if (tabsEl) tabsEl.hidden = true;
      setSampleActions(panel, false);
      body.className = "sample-body";
      body.textContent = "";
      const controller = new AbortController();
      panel._abortController = controller;
      startSampleProgress(panel);
      try {
        const res = await fetch(buildUrl(panel), { signal: controller.signal });
        const data = await res.json();
        if (!res.ok || data.success === false) throw new Error(data.error || res.statusText);
        await finishSampleProgress(panel, true);
        expandSamplePanel(panel);
        panel._samplePreview = data;
        if (!panel._sampleView) panel._sampleView = "json";
        if (searchEl) searchEl.disabled = false;
        renderSampleContent(panel);
        setSampleActions(panel, true);
      } catch (err) {
        await finishSampleProgress(panel, false);
        expandSamplePanel(panel);
        body.className = "sample-body sample-error";
        body.textContent = err.name === "AbortError"
          ? "Request cancelled after " + formatElapsed(performance.now() - panel._progressStart) + "."
          : "Request failed: " + err.message;
        setSampleActions(panel, false);
      } finally {
        if (panel._abortController === controller) panel._abortController = null;
        if (!panel.querySelector(".sample-card")?.classList.contains("sample-fetching")) {
          resetLoadSampleBtn(panel, true);
        }
      }
    }

    document.querySelectorAll(".panel[data-endpoint]").forEach((panel) => {
      const copyBtn = panel.querySelector(".copy-url-btn");
      const urlEl = panel.querySelector(".endpoint-url-text");
      const dateModeSelect = panel.querySelector(".date-mode-select");
      function syncDateMode() {
        if (!dateModeSelect) return;
        const mode = dateModeSelect.value;
        panel.querySelectorAll("[data-date-mode]").forEach((row) => {
          const active = row.dataset.dateMode === mode;
          row.hidden = !active;
          row.querySelectorAll("[data-name]").forEach((input) => {
            input.disabled = !active;
          });
        });
      }
      function syncUrl() {
        const url = buildUrl(panel);
        const data = JSON.parse(panel.dataset.endpoint);
        const display = url.startsWith(BASE) ? url.slice(BASE.length) || data.path : url;
        if (urlEl) urlEl.textContent = display;
        if (copyBtn) copyBtn.dataset.url = url;
        syncCodeSamples(panel);
      }
      panel.querySelectorAll("[data-name]").forEach((el) => {
        el.addEventListener("input", syncUrl);
        el.addEventListener("change", syncUrl);
      });
      dateModeSelect?.addEventListener("change", () => {
        syncDateMode();
        syncUrl();
      });
      syncDateMode();
      syncUrl();
      panel.querySelectorAll(".code-tab").forEach((tab) => {
        tab.addEventListener("click", () => showCodeTab(panel, tab.dataset.lang));
      });
      bindCopyButton(panel.querySelector(".copy-code-btn"), function() {
        var active = panel.querySelector(".code-tab.active");
        var lang = active ? active.dataset.lang : "shell";
        return panel._codePlain || (panel._codeSamples && panel._codeSamples[lang]) || "";
      });
      panel.querySelector(".load-sample-btn")?.addEventListener("click", () => loadSample(panel));
      panel.querySelector(".sample-search")?.addEventListener("input", () => {
        if (panel._samplePreview) renderSampleContent(panel);
      });
      panel.querySelectorAll(".sample-view-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          panel._sampleView = tab.dataset.sampleView || "json";
          setSampleViewTab(panel, panel._sampleView);
        });
      });
      bindCopyButton(copyBtn, function() {
        return copyBtn.dataset.url || buildUrl(panel);
      });
      bindCopyButton(panel.querySelector(".copy-sample-btn"), function() {
        return panel._sampleJson || "";
      });
      panel.querySelector(".download-sample-csv-btn")?.addEventListener("click", () => {
        downloadSampleCsv(panel);
      });
      syncUrl();
    });`;
}

const SAMPLE_VIEW_STYLES = `
    .panel-eyebrow { color: var(--text-muted); }
    .sidebar { background: var(--bg); }
    .nav-api.active {
      background: var(--surface); color: var(--text);
      box-shadow: inset 2px 0 0 var(--text-muted);
    }
    .nav-api:hover { background: var(--surface); }
    .sidebar-search input:focus,
    .filter-row input:focus,
    .filter-row select:focus {
      box-shadow: none; border-color: var(--border-hover);
    }
    .path-bar .p { color: var(--text-secondary); }
    .panel-row-split {
      grid-template-columns: minmax(0, 1.65fr) minmax(0, 0.85fr);
    }
    @media (max-width: 960px) {
      .panel-row-split { grid-template-columns: 1fr; }
    }
    .panel-col-main {
      display: flex; flex-direction: column; gap: 16px; min-width: 0;
    }
    .panel-col-main .sample-card {
      position: relative; overflow: hidden; min-height: 0;
    }
    .panel-col-main .sample-card.sample-expanded {
      flex: 1; display: flex; flex-direction: column; min-height: 280px;
    }
    .panel-col-main .sample-card.sample-expanded .section-card-body {
      flex: 1; display: flex; flex-direction: column; min-height: 0;
    }
    .panel-col-main .sample-card.sample-expanded .sample-body { flex: 1; min-height: 160px; }
    .sample-toolbar .load-sample-btn {
      min-width: 10.75rem;
      justify-content: center;
      font-variant-numeric: tabular-nums;
      box-sizing: border-box;
    }
    .sample-card.sample-collapsed .sample-card-head { border-bottom: none !important; }
    .sample-card.sample-expanded .sample-card-head { border-bottom: 1px solid var(--border); }
    .sample-card.sample-collapsed .sample-card-body { display: none !important; }
    .sample-edge-progress {
      position: absolute; left: 0; right: 0; bottom: 0; height: 3px;
      background: transparent; pointer-events: none; z-index: 2;
    }
    .sample-card.sample-fetching .sample-edge-progress { background: rgba(255,255,255,0.06); }
    .sample-edge-progress-fill {
      height: 100%; width: 0; border-radius: 0;
      background: var(--purple-bright);
      transition: width 0.12s linear;
    }
    .sample-card.sample-fetching .sample-edge-progress-fill {
      width: 35%;
      animation: sample-progress-running 1.2s ease-in-out infinite;
    }
    @keyframes sample-progress-running {
      from { transform: translateX(-110%); }
      to { transform: translateX(300%); }
    }
    .sample-meta[hidden] { display: none !important; }
    .sample-view-tabs { display: flex; gap: 2px; margin-bottom: 10px; border-bottom: 1px solid var(--border); }
    .sample-view-tabs[hidden] { display: none !important; }
    .sample-view-tab {
      appearance: none; border: none; background: transparent; cursor: pointer;
      padding: 8px 12px; font: inherit; font-size: 0.78rem; font-weight: 500;
      color: var(--text-muted); border-bottom: 2px solid transparent; margin-bottom: -1px;
    }
    .sample-view-tab:hover { color: var(--text-secondary); }
    .sample-view-tab.active { color: var(--text); border-bottom-color: var(--purple-bright); }
    .sample-body.sample-loaded { min-height: 160px; }
    .sample-pane { display: none; }
    .sample-pane.active { display: block; }
    .sample-table-wrap {
      overflow-x: auto; border: 1px solid var(--border);
      border-radius: 0; background: var(--surface-inset);
    }
    .sample-table {
      width: max-content; min-width: 100%; border-collapse: collapse; font-size: 0.78rem;
      table-layout: auto;
    }
    .sample-table th, .sample-table td {
      text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border);
      vertical-align: middle; white-space: nowrap;
    }
    .sample-table th {
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.01em;
      color: var(--text-secondary); position: sticky; top: 0; background: var(--surface-2); z-index: 1;
    }
    .sample-table td { font-family: var(--mono); color: var(--text-secondary); }
    .sample-table tbody tr:hover td { background: var(--surface-2); }
    .sample-table-empty { color: var(--text-muted); font-size: 0.8rem; margin: 0; padding: 14px; }
    .schema-table .schema-desc {
      color: var(--text-secondary); font-size: 0.78rem; line-height: 1.45;
      max-width: 360px; font-weight: 400; text-transform: none;
    }
    .schema-table th:nth-child(3) { min-width: 180px; text-transform: uppercase; }
    .methods-empty {
      margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;
    }
    .methods-card .section-card-body { padding: 22px 20px 26px; }
    .method-param-list { display: flex; flex-direction: column; gap: 0; }
    .method-param {
      padding: 0 0 22px; margin: 0 0 22px;
      border: none; border-radius: 0; background: transparent;
      border-bottom: 1px solid var(--border);
    }
    .method-param:last-child {
      margin-bottom: 0; padding-bottom: 0; border-bottom: none;
    }
    .method-param-head {
      display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; margin-bottom: 10px;
    }
    .method-param-name {
      font-family: var(--mono); font-size: 0.88rem; color: var(--text); font-weight: 500;
    }
    .method-param-desc {
      margin: 0 0 10px; font-size: 0.88rem; line-height: 1.65; color: var(--text-secondary);
      max-width: 52rem;
    }
    .method-param-usage {
      margin: 0; font-size: 0.82rem; line-height: 1.6; color: var(--text-muted);
    }
    .method-param-usage code {
      font-family: var(--mono); font-size: 0.78rem; color: var(--text-secondary);
    }
    .method-param-url-row {
      margin-top: 14px; padding: 10px 12px;
      background: var(--surface-inset); border: 1px solid var(--border);
    }
    .method-param-url {
      display: block; font-family: var(--mono); font-size: 0.76rem;
      line-height: 1.55; color: var(--text-secondary); word-break: break-all;
    }
    .req-pill {
      font-size: 0.72rem; font-weight: 500; letter-spacing: 0;
      text-transform: none; padding: 0; border: none; background: none; white-space: nowrap;
    }
    .req-pill.required { color: var(--text-secondary); }
    .req-pill.optional { color: var(--green); }
    .method-param-head .type-pill {
      font-family: var(--mono); font-size: 0.72rem;
      color: var(--purple-bright); background: var(--purple-soft);
      padding: 2px 8px; border-radius: 0;
    }
    .section-collapse { overflow: hidden; }
    .section-collapse-summary {
      list-style: none; cursor: pointer; user-select: none;
      display: flex; align-items: center; gap: 8px;
    }
    .section-collapse-summary::-webkit-details-marker { display: none; }
    .section-collapse-summary:hover { color: var(--text-secondary); }
    .section-collapse-chevron {
      width: 12px; height: 12px; flex-shrink: 0; color: var(--text-muted);
      transition: transform 0.15s;
    }
    .section-collapse[open] .section-collapse-chevron { transform: rotate(90deg); color: var(--purple-bright); }
`;

function buildHeliumApisCatalogHtml(options = {}) {
  const { endpoints, groups, dates } = collectEndpoints(options.baseUrl);
  if (!endpoints.length) {
    throw new Error(`No Helium query endpoints found under ${SQL_DIR}/`);
  }
  const firstId = endpoints[0].id;
  const styles = extractStyles() + SAMPLE_VIEW_STYLES;
  const panelsHtml = endpoints.map((ep, i) => renderPanel(ep, i === 0)).join('\n');
  const navHtml = renderNav(groups, firstId);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Helium APIs · Top Ledger Research</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>${styles}</style>
</head>
<body>
  <div class="shell">
    <header class="header">
      <div class="header-brand">
        <a class="logo" href="https://research.topledger.xyz/" target="_blank" rel="noopener">
          <img src="https://topledger.xyz/assets/images/logo/topledger-full.svg?imwidth=384" alt="Top Ledger Research" width="160" height="26" />
        </a>
      </div>
      <div class="header-main">
        <div class="header-meta"><span id="header-api-base"></span> · ${endpoints.length} endpoints</div>
      </div>
    </header>
    <div class="layout">
      <aside class="sidebar" id="api-sidebar">
        <div class="sidebar-search">
          <div class="sidebar-search-row">
            <label class="sidebar-search-inner" for="nav-search">
              <svg class="sidebar-search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input id="nav-search" type="search" placeholder="Search.." autocomplete="off">
            </label>
            <button type="button" class="icon-btn sidebar-toggle" id="sidebar-toggle" aria-expanded="true" aria-controls="api-sidebar" aria-label="Toggle API sidebar" title="Toggle sidebar">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
          </div>
        </div>
        <div class="sidebar-scroll">
          ${navHtml}
        </div>
      </aside>
      <main class="main">
        ${panelsHtml}
      </main>
    </div>
  </div>
  <script>
${runtimeScript(dates)}
  </script>
</body>
</html>
`;
}

function writeCatalogFiles(html) {
  const formatted = html.replace(/[ \t]+$/gm, '');
  fs.writeFileSync(OUT, formatted);
  const monorepo = process.env.HELIUM_MONOREPO_ROOT;
  if (monorepo) {
    const root = path.resolve(monorepo);
    const outPublic = path.join(root, 'public', 'queries', 'index.html');
    const outHelium = path.join(root, 'public', 'helium-apis', 'index.html');
    fs.mkdirSync(path.dirname(outPublic), { recursive: true });
    fs.writeFileSync(outPublic, formatted);
    fs.mkdirSync(path.dirname(outHelium), { recursive: true });
    fs.writeFileSync(outHelium, formatted);
  }
}

function main() {
  let html;
  try {
    html = buildHeliumApisCatalogHtml();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
  writeCatalogFiles(html);
  const count = (html.match(/class="panel(?: active)?"/g) || []).length;
  console.log('Wrote', OUT, 'with', count, 'API panels');
  if (process.env.HELIUM_MONOREPO_ROOT) {
    console.log('Also wrote public/queries and public/helium-apis under', process.env.HELIUM_MONOREPO_ROOT);
  }
}

module.exports = { buildHeliumApisCatalogHtml, writeCatalogFiles };

if (require.main === module) {
  main();
}
