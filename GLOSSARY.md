Topledger parameterized SQL queries for the Helium Oracle Data Table API.

SQL lives in topic folders under `helium_oracle_api/queries/`:

    delegation/   HNT stake and vote-proxy queries
    gateway/      per-gateway IoT, mobile, and radio queries
    hotspot/      hotspot search and lookup
    network/      network-wide IoT and mobile rollups
    oui/          OUI packet and DC usage
    relay/        L2 reward-share and totals
    meta/         table freshness

These are *Topledger saved-query* templates: parameters are written in the
Topledger / Redash `{{param}}` syntax so they can be pasted directly into the
analytics.topledger.xyz editor and exposed as URL-based query APIs. Field
names mirror the reference endpoints.

Numeric handling matches the rest of this codebase
(see solana_stellar/solana_depin_reciver_rewards.py):

    cast(varchar_amount as bigint)        per-field cast
    coalesce(cast(... as bigint), 0)      for fields that can be NULL
    sum( ... ) / 1e6 as total_reward      divide once to convert bones -> token

All Helium reward amounts (IOT, MOBILE, DC-transfer reward, subscriber reward)
are denominated in `bones` with 6 decimals, hence the constant 1e6 divisor.

Every query that returns a `hotspotKey` is enriched via a LEFT JOIN against
`helium.hotspot_keys` so each record also carries the on-chain identity:

    assetId         (helium.hotspot_keys.asset_id)
    entityKey       (helium.hotspot_keys.entity_key)
    entityKeyB64    (helium.hotspot_keys.entity_key_b64)
    keyToAssetKey   (helium.hotspot_keys.key_to_asset_key)
    dao             (helium.hotspot_keys.dao)

Parameters used across the queries (declare these in the Topledger UI):

    start_date    date       inclusive lower bound on partition_0
    end_date      date       inclusive upper bound on partition_0
    entity_key    text       optional; leave empty to match all entities
                             (looked up against helium.hotspot_keys.entity_key)
    address       text       required for single-gateway endpoints
    bucket        text       'hour' | 'day' | 'week' | 'total' for /sum endpoints

Tables targeted:

    helium_oracle_iot.iotrewardshare
    helium_oracle_iot.packetreport
    helium_oracle_mobile.mobilerewardshare
    helium_oracle_mobile.datatransfersessioningestreport
    helium_oracle_mobile.speedtestavg
    helium_oracle_mobile.validatedheartbeat
    helium.hotspot_keys
    iotex.helium_devices   (empty — name/location metadata unavailable)

Single-hotspot name comes from the Helium entities API, not Hive:

    https://entities.nft.helium.io/{entity_key}


-------------------------------------------------------------------------------
GLOSSARY - the Helium identity and reward vocabulary used in these queries.
-------------------------------------------------------------------------------

A single Helium hotspot is referred to by FOUR different identifiers across
Helium's Solana programs, oracle pipelines, and reward share files. They all
point to the same physical device, but live at different layers:

  hotspot_key       The hotspot's signing pubkey. This is the ECC chain-style
                    public key that the gateway uses to SIGN beacon and witness
                    reports (and historically the only ID on Helium L1). On
                    Solana it stays as a base58 string like '112foo...'.
                    Source: helium.hotspot_keys.hotspot_key
                            (= helium_oracle_iot.iotrewardshare.gatewayreward.hotspotkey
                             = helium_oracle_mobile.mobilerewardshare.radioreward.hotspotkey)

  entity_key        The canonical "entity" identifier used by the Helium Entity
                    Manager (HEM) Solana program. For an IoT hotspot the
                    entity_key bytes ARE the hotspot pubkey bytes - we just
                    store/serialize them differently (raw bytes, base58, or
                    base64 depending on the table). HEM uses this value as the
                    seed for deriving the on-chain PDAs below.
                    Source: helium.hotspot_keys.entity_key

  entity_key_b64    Same value as entity_key, base64-encoded for transport /
                    storage. Handy for matching against off-chain oracle JSON
                    blobs that quote the entity key in base64.
                    Source: helium.hotspot_keys.entity_key_b64

  key_to_asset_key  A Solana PDA on the Helium Entity Manager program. Derived
                    as `find_program_address(["key_to_asset", dao, entity_key],
                    HEM_PROGRAM_ID)`. The account at this PDA stores the link
                    between (entity_key, dao) and the on-chain `asset_id`.
                    Think of it as the on-chain row-id that says "this entity,
                    inside this DAO, is represented by this cNFT".
                    Source: helium.hotspot_keys.key_to_asset_key

  asset_id          The compressed-NFT (cNFT) asset address. This is what a
                    wallet actually "owns" - transferring or burning a hotspot
                    means transferring/burning this cNFT inside the Bubblegum
                    merkle tree. Resolves via DAS / Helius / Metaplex.
                    Source: helium.hotspot_keys.asset_id

  dao               The DAO PDA the entity lives under. There are two:
                      - IOT  DAO  -> IoT hotspots, IOT-token rewards
                      - MOBILE DAO -> Mobile hotspots, MOBILE-token rewards
                    The DAO is part of the seeds for key_to_asset_key, which
                    is why one entity_key can have ONE row per DAO.
                    Source: helium.hotspot_keys.dao

  key_serialization How the entity_key bytes are encoded for hashing. Usually:
                      - 'b58'  for hotspots (ECC chain pubkeys are base58)
                      - 'utf8' for subscribers / non-hotspot entities
                    Source: helium.hotspot_keys.key_serialization


Mobile-specific identifiers (Helium Mobile / CBRS):

  cbsd_id           CBRS (Citizens Broadband Radio Service) device ID. A
                    radio/sector identifier under a single Mobile hotspot.
                    One hotspot can run multiple radios (multiple cbsd_ids).
                    Source: helium_oracle_mobile.mobilerewardshare
                              .radioreward.cbsdid

  coverage_object   UUID for a snapshot of a hotspot's coverage hex map at a
                    point in time. Used by the HEX boosting (HIP-103) and
                    reward attribution pipelines.
                    Source: helium_oracle_mobile.mobilerewardshare
                              .radioreward.coverageobject

  subscriber_id     entity_key of a Mobile subscriber (the phone/user, NOT
                    the hotspot). Subscribers earn `discoveryLocationAmount`
                    rewards for their first time onboarding to coverage.
                    Source: helium_oracle_mobile.mobilerewardshare
                              .subscriberreward.subscriberid


Reward fields - all amounts are in "bones" (atomic units, 1 token = 1e6 bones).
Divide by 1e6 to get whole IOT / MOBILE tokens.

  beaconamount      IoT reward earned by the gateway for transmitting beacons
                    that were accepted as valid PoC.

  witnessamount     IoT reward earned by the gateway for witnessing other
                    gateways' beacons (cryptographically attesting it received
                    a beacon at a certain RSSI / SNR / timestamp).

  dctransferamount  IoT reward for DC (Data Credit) transfer activity carried
                    over the gateway in the period. (`dctransferreward` is the
                    Mobile-flavored name of the same concept.)

  pocreward         Mobile PoC reward for a radio. Function of the radio's
                    coverage points, multipliers (boost / location), and the
                    network's PoC reward share for the period.

  discoverylocationamount
                    One-time Mobile reward paid to a subscriber for onboarding
                    in a covered hex.

  amount / total_reward
                    Convenience sum of the above per row, returned divided by
                    1e6 so the output is in whole-token units (DOUBLE).


Protocol / system terms used in these queries (not columns, but context):

  PoC               Proof of Coverage. The protocol that rewards hotspots for
                    cryptographically provable wireless coverage:
                      - IoT:    beacon / witness exchange between gateways
                      - Mobile: validated heartbeats + speedtests + coverage hexes

  HEM               Helium Entity Manager - the Solana program that creates
                    and indexes all hotspot / subscriber entities and their
                    cNFT representations. Owner of the key_to_asset_key PDA
                    described above.

  DC                Data Credits. Non-transferrable unit burned by Helium
                    routers to pay for packet transfer; the gateway/radio
                    that delivered the packet gets a DC-transfer reward.

  bones             Atomic reward unit for both IOT and MOBILE tokens
                    (1 token = 1,000,000 bones). Analogous to lamports for SOL.

  partition_0       Hive-style date partition column on every Topledger oracle
                    table. Always filtered with BETWEEN '{start_date}' AND
                    '{end_date}' to keep query scans cheap.
-------------------------------------------------------------------------------
