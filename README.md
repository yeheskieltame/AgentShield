# AgentShield

**Decentralized DeFi Circuit Breaker Protocol via AI Agent Consensus on Hedera**

AgentShield prevents cascading liquidation events in DeFi by coordinating AI agents through Hedera Consensus Service (HCS). Agents broadcast transaction intents before execution, a Coordinator calculates systemic risk in real-time, and broadcasts safety signals (GREEN/YELLOW/RED) that agents autonomously comply with.

Built for the **Hedera Hello Future Apex Hackathon 2026** (AI & Agents track + Hashgraph Online bounty).

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Running the Protocol](#running-the-protocol)
- [Flash Crash Demo](#flash-crash-demo)
- [Hedera Testnet Addresses](#hedera-testnet-addresses)
- [HOL Registry (HCS-10) Agent Registration](#hol-registry-hcs-10-agent-registration)
- [HCS Topics](#hcs-topics)
- [HTS Tokens](#hts-tokens)
- [Risk Scoring Engine](#risk-scoring-engine)
- [Signal Compliance Behavior](#signal-compliance-behavior)
- [HCS Message Protocol](#hcs-message-protocol)
- [License](#license)

---

## Problem Statement

In DeFi, cascading liquidations can wipe out millions in value within seconds. When multiple AI agents (keepers, arbitrage bots, whale movers) simultaneously execute large transactions, they can trigger a chain reaction of liquidations, price crashes, and protocol insolvency. There is no coordination layer between these agents to prevent systemic risk.

## Solution

AgentShield introduces a **pre-execution coordination layer** where:

1. AI agents **broadcast their intent** (what they plan to do) to a shared Hedera Consensus Service topic *before* executing
2. A **Coordinator agent** aggregates all intents in a sliding 60-second window, calculates a composite risk score using 4 weighted metrics, and uses an LLM (Groq/Llama-3.3-70b) for natural language reasoning
3. The Coordinator broadcasts a **safety signal** (GREEN / YELLOW / RED) to all agents
4. Agents **autonomously comply** — reducing trade sizes, adding delays, or aborting entirely based on the signal
5. All activity is logged on-chain for transparency and reputation tracking

This is a **voluntary, decentralized circuit breaker** — no smart contract pauses, no centralized kill switches.

---

## Architecture

```
+------------------------------------------------------------------+
|                        AI AGENTS (TypeScript)                     |
|                                                                   |
|  Sentinel-Keeper  Sentinel-Arb  Sentinel-Whale     Observer      |
|  (liquidations)   (swaps)       (large transfers)  (human chat)  |
|       |               |              |                  |         |
|       +-------+-------+------+-------+                  |         |
|               |              |                          |         |
|          [Intent Topic]  [Signal Topic]            [HCS-10]      |
|               |              ^                          |         |
|               v              |                          |         |
|          COORDINATOR                                    |         |
|          - Risk Engine (60s sliding window)              |         |
|          - LLM Reasoning (Groq/Llama-3.3-70b)           |         |
|          - Signal Broadcast                              |         |
+------------------------------------------------------------------+
|                    HEDERA NATIVE SERVICES                         |
|                                                                   |
|  HCS Topics          HTS Tokens           HBAR Transfers         |
|  - Intent (public)   - $SHIELD (fungible)  - Agent funding       |
|  - Signal (coord)    - Reputation NFT       - Treasury ops       |
|  - Reputation (coord)                                            |
+------------------------------------------------------------------+
|                   HOL INTEGRATION (HCS-10)                        |
|                                                                   |
|  All 5 agents registered in Hashgraph Online Registry            |
|  Agent-to-agent discovery and communication                      |
+------------------------------------------------------------------+
```

**Data Flow:**

```
Sentinel detects opportunity
  -> publishes intent to HCS Intent Topic
    -> Coordinator reads via Mirror Node (3s polling)
      -> calculates risk score (4-factor weighted model)
        -> LLM generates natural language reasoning
          -> broadcasts GREEN/YELLOW/RED to Signal Topic
            -> Sentinels read signal and adjust behavior
              -> Observer reports status to humans
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | TypeScript (Node.js, ES Modules) |
| Blockchain | Hedera Testnet (HCS, HTS, Account Service) |
| Runtime LLM | Groq free tier — `llama-3.3-70b-versatile` |
| Agent Framework | LangChain + LangGraph |
| Hedera SDK | `@hashgraph/sdk` v2.81+ |
| HOL Standards | `@hashgraphonline/standards-sdk` v0.1.168+ |
| Agent Toolkit | `hedera-agent-kit` v3.8+ |
| Runner | `tsx` (TypeScript Execute) |

---

## Project Structure

```
AgentShield/
├── agents/
│   ├── coordinator/
│   │   ├── index.ts            # Main coordinator loop
│   │   ├── risk-engine.ts      # 4-factor risk scoring engine
│   │   └── llm-reasoning.ts    # Groq LLM integration
│   ├── sentinel/
│   │   ├── index.ts            # Sentinel agent (keeper/arb/whale)
│   │   └── scenarios/
│   │       └── flash-crash.ts  # Flash crash demo simulation
│   └── observer/
│       └── index.ts            # Human-facing status agent
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   ├── config.ts               # Environment config loader
│   ├── hedera-client.ts        # Hedera SDK client factory
│   └── hcs-subscriber.ts       # Mirror Node HCS polling
├── scripts/
│   ├── setup-topics.ts         # Create HCS topics
│   ├── create-tokens.ts        # Create $SHIELD + Reputation NFT
│   ├── register-agents.ts      # Register agents in HOL Registry
│   └── fund-agents.ts          # Fund agent accounts with HBAR
├── dashboard/                  # Next.js dashboard (planned)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- 6 Hedera Testnet accounts (create free at [portal.hedera.com](https://portal.hedera.com/dashboard))
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone & Install

```bash
git clone https://github.com/YourUsername/AgentShield.git
cd AgentShield
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your 6 Hedera testnet account IDs + private keys, plus your Groq API key:

```bash
cp .env.example .env
```

### 3. Run Setup Scripts (in order)

```bash
# Step 1: Create HCS topics (Intent, Signal, Reputation)
npx tsx scripts/setup-topics.ts
# -> Copy the 3 topic IDs to .env

# Step 2: Create HTS tokens ($SHIELD fungible + Reputation NFT)
npx tsx scripts/create-tokens.ts
# -> Copy token IDs to .env

# Step 3: Register all agents in HOL Registry
npx tsx scripts/register-agents.ts

# Step 4: Fund agent accounts with test HBAR
npx tsx scripts/fund-agents.ts
```

---

## Running the Protocol

Start each agent in a separate terminal:

```bash
# Terminal 1: Coordinator (must start first)
npm run coordinator

# Terminal 2: Sentinel Keeper
npm run sentinel:keeper

# Terminal 3: Sentinel Arb
npm run sentinel:arb

# Terminal 4: Sentinel Whale
npm run sentinel:whale

# Terminal 5: Observer
npm run observer
```

Once running, you will see:
- Sentinels publishing intents to the Intent Topic
- Coordinator calculating risk scores and broadcasting signals
- Sentinels adjusting their behavior based on signals
- Observer reporting current risk status

---

## Flash Crash Demo

Run the built-in flash crash simulation to demonstrate the circuit breaker in action:

```bash
npm run demo:crash
```

This runs a 4-phase scenario:

| Phase | Duration | Description |
|-------|----------|-------------|
| 1. Normal | 30s | 3 normal trades at regular intervals |
| 2. Tension | 20s | 6 trades at higher volume, building pressure |
| 3. Cascade | 15s | 15 high-urgency liquidations from 3 sentinels simultaneously |
| 4. Recovery | 15s | Waits for risk to subside as the window clears |

Expected signal progression: GREEN -> YELLOW -> RED -> (cooldown) -> GREEN

---

## Hedera Testnet Addresses

### Agent Operator Accounts

These are the primary accounts used by each agent to submit HCS messages and interact with Hedera:

| Agent | Role | Account ID | Network |
|-------|------|-----------|---------|
| Coordinator | Risk aggregation & signal broadcast | `0.0.7275085` | Testnet |
| Sentinel Keeper | Liquidation bot | `0.0.8268231` | Testnet |
| Sentinel Arb | Arbitrage bot | `0.0.8291404` | Testnet |
| Sentinel Whale | Large position mover | `0.0.8291411` | Testnet |
| Observer | Human-facing chat agent | `0.0.8291431` | Testnet |
| Treasury | Fund distribution | `0.0.8291460` | Testnet |

---

## HOL Registry (HCS-10) Agent Registration

All 5 agents are registered in the [Hashgraph Online Registry](https://moonscape.tech) via the HCS-10 standard. Each registration creates a dedicated account, inbound/outbound topics, and an on-chain profile.

### Coordinator

| Field | Value |
|-------|-------|
| Display Name | `AgentShield Coordinator` |
| Alias | `agentshield_coordinator` |
| HOL Account | `0.0.8299709` |
| Inbound Topic | `0.0.8299711` |
| Outbound Topic | `0.0.8299710` |
| Profile Topic | `0.0.8299713` |
| Registration TX | `0.0.2659396@1773992772.031475119` |
| Type | Autonomous |

### Sentinel Keeper

| Field | Value |
|-------|-------|
| Display Name | `AgentShield Sentinel Keeper` |
| Alias | `agentshield_sentinel_keeper` |
| HOL Account | `0.0.8299715` |
| Inbound Topic | `0.0.8299717` |
| Outbound Topic | `0.0.8299716` |
| Profile Topic | `0.0.8299719` |
| Registration TX | `0.0.2659396@1773992873.484429300` |
| Type | Autonomous |

### Sentinel Arb

| Field | Value |
|-------|-------|
| Display Name | `AgentShield Sentinel Arb` |
| Alias | `agentshield_sentinel_arb` |
| HOL Account | `0.0.8299726` |
| Inbound Topic | `0.0.8299730` |
| Outbound Topic | `0.0.8299729` |
| Profile Topic | `0.0.8299732` |
| Registration TX | `0.0.2659396@1773992942.594361605` |
| Type | Autonomous |

### Sentinel Whale

| Field | Value |
|-------|-------|
| Display Name | `AgentShield Sentinel Whale` |
| Alias | `agentshield_sentinel_whale` |
| HOL Account | `0.0.8299734` |
| Inbound Topic | `0.0.8299736` |
| Outbound Topic | `0.0.8299735` |
| Profile Topic | `0.0.8299740` |
| Registration TX | `0.0.2659396@1773993057.429652056` |
| Type | Autonomous |

### Observer

| Field | Value |
|-------|-------|
| Display Name | `AgentShield Observer` |
| Alias | `agentshield_observer` |
| HOL Account | `0.0.8299742` |
| Inbound Topic | `0.0.8299746` |
| Outbound Topic | `0.0.8299745` |
| Profile Topic | `0.0.8299748` |
| Registration TX | `0.0.2659396@1773993122.791638818` |
| Type | Manual |

---

## HCS Topics

| Topic | ID | Purpose | Submit Key |
|-------|----|---------|------------|
| Intent Topic | `0.0.8291524` | Agents broadcast transaction intents before execution | Public (any agent) |
| Signal Topic | `0.0.8291525` | Coordinator broadcasts GREEN/YELLOW/RED safety signals | Coordinator only |
| Reputation Topic | `0.0.8291526` | Coordinator logs agent compliance and reputation events | Coordinator only |

---

## HTS Tokens

| Token | ID | Type | Supply | Decimals | Purpose |
|-------|----|------|--------|----------|---------|
| $SHIELD | `0.0.8291529` | Fungible | 100,000,000 | 8 | Protocol governance and reward token |
| Reputation NFT | `0.0.8291530` | Non-Fungible (Infinite) | Unlimited | 0 | On-chain reputation badges for compliant agents |

---

## Risk Scoring Engine

The Coordinator calculates a composite risk score (0.0 — 1.0) using a **sliding 60-second window** of all received intents.

### Scoring Weights

| Metric | Weight | Description |
|--------|--------|-------------|
| Volume | 30% | Total USD volume in window, normalized to $1M threshold |
| Asset Concentration | 25% | Largest single asset as fraction of total volume |
| Sell Pressure | 25% | Ratio of sell/liquidate intents to total intent count |
| Velocity | 20% | Intents per second, normalized to 5/sec threshold |

### Score Formula

```
score = (0.30 * volumeNorm) + (0.25 * concentration) + (0.25 * sellPressure) + (0.20 * velocityNorm)
```

Where each component is clamped to `[0, 1]`.

### Signal Thresholds

| Score Range | Signal | Meaning |
|-------------|--------|---------|
| 0.00 — 0.39 | GREEN | Safe to proceed normally |
| 0.40 — 0.69 | YELLOW | Elevated risk — reduce exposure |
| 0.70 — 1.00 | RED | High risk — abort or wait |

### LLM Reasoning

After computing the score, the Coordinator sends the metrics to **Groq (llama-3.3-70b-versatile)** to generate a human-readable explanation of the current risk state. This reasoning is included in every signal broadcast.

---

## Signal Compliance Behavior

When a Sentinel agent receives a signal from the Coordinator, it adjusts its behavior automatically:

| Signal | Size Adjustment | Delay Added | Action |
|--------|----------------|-------------|--------|
| GREEN | 100% (no change) | 0s | Proceed normally |
| YELLOW | 50% (halved) | +5s | Reduce position size, wait before executing |
| RED | 0% (abort) | +15s | Cancel transaction entirely, wait before retrying |

---

## HCS Message Protocol

All HCS messages use a standardized JSON format with the `agentshield` protocol identifier.

### Intent Message

```json
{
  "p": "agentshield",
  "op": "intent",
  "agent": "0.0.8268231",
  "action": "liquidate",
  "asset": "HBAR/USDT",
  "size_usd": 31688.37,
  "direction": "sell",
  "urgency": "medium",
  "ts": 1773992700000
}
```

### Signal Message

```json
{
  "p": "agentshield",
  "op": "signal",
  "level": "YELLOW",
  "score": 0.55,
  "reasoning": "Risk is moderate due to high sell pressure...",
  "intents_in_window": 3,
  "volume_usd": 449171.25,
  "top_asset": "HBAR/USDC",
  "recommended_delay_s": 5,
  "ts": 1773992703000
}
```

### Reputation Message

```json
{
  "p": "agentshield",
  "op": "reputation",
  "agent": "0.0.8268231",
  "signal_level": "YELLOW",
  "compliant": true,
  "ts": 1773992710000
}
```

---

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `HEDERA_NETWORK` | `testnet` or `mainnet` |
| `COORDINATOR_ACCOUNT_ID` | Coordinator's Hedera account |
| `COORDINATOR_PRIVATE_KEY` | Coordinator's ED25519 private key |
| `SENTINEL_KEEPER_ACCOUNT_ID` | Keeper sentinel's Hedera account |
| `SENTINEL_ARB_ACCOUNT_ID` | Arb sentinel's Hedera account |
| `SENTINEL_WHALE_ACCOUNT_ID` | Whale sentinel's Hedera account |
| `OBSERVER_ACCOUNT_ID` | Observer agent's Hedera account |
| `TREASURY_ACCOUNT_ID` | Treasury for fund distribution |
| `INTENT_TOPIC_ID` | HCS topic for intent broadcasts |
| `SIGNAL_TOPIC_ID` | HCS topic for signal broadcasts |
| `REPUTATION_TOPIC_ID` | HCS topic for reputation events |
| `SHIELD_TOKEN_ID` | $SHIELD fungible token |
| `REPUTATION_NFT_ID` | Reputation NFT collection |
| `GROQ_API_KEY` | Groq API key for LLM reasoning |
| `REGISTRY_URL` | HOL guarded registry URL |

---

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

**Built with Hedera, Hashgraph Online, Groq, and LangChain for the Hello Future Apex Hackathon 2026.**
