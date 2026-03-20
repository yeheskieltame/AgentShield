# AgentShield Architecture

For full details, see [README.md](../README.md).

## System Overview

```
+------------------------------------------------------------------+
|  LAYER 1: AI AGENTS (TypeScript / Node.js)                       |
|                                                                   |
|  Sentinel-Keeper  Sentinel-Arb  Sentinel-Whale     Observer      |
|  (liquidations)   (swaps)       (large xfers)      (human chat)  |
|       |               |              |                  |         |
|       +-------+-------+------+-------+                  |         |
|               |              |                          |         |
|          Intent Topic    Signal Topic              HCS-10 Chat   |
|               |              ^                          |         |
|               v              |                          |         |
|          COORDINATOR AGENT                              |         |
|          - Risk Engine (60s sliding window)              |         |
|          - LLM Reasoning (Groq / Llama-3.3-70b)         |         |
|          - Signal + Reputation Broadcast                 |         |
+------------------------------------------------------------------+
|  LAYER 2: HEDERA NATIVE SERVICES                                 |
|                                                                   |
|  HCS Topics            HTS Tokens            HBAR Transfers      |
|  - Intent (public)     - $SHIELD (fungible)  - Agent funding     |
|  - Signal (coord key)  - Reputation NFT      - Reward payouts    |
|  - Reputation (coord)                                            |
+------------------------------------------------------------------+
|  LAYER 3: HOL INTEGRATION (HCS-10)                               |
|  All 5 agents registered in Hashgraph Online Registry            |
|  Discoverable at moonscape.tech, agent-to-agent messaging        |
+------------------------------------------------------------------+
|  LAYER 4: DeFi PROTOCOL INTERACTION                              |
|  Read-only feeds from Bonzo Finance and SaucerSwap (testnet)     |
+------------------------------------------------------------------+
|  LAYER 5: DASHBOARD (Next.js + Tailwind)                         |
|  Polls Hedera Mirror Node REST API for live signal/intent data   |
+------------------------------------------------------------------+
```

## 5 Layers

1. **AI Agents** -- TypeScript processes that publish intents, evaluate risk, broadcast signals, and chat with humans. Each runs in its own terminal.
2. **Hedera Native Services** -- HCS for ordered messaging, HTS for $SHIELD tokens and reputation NFTs, HBAR for funding.
3. **HOL Integration** -- HCS-10 agent registration gives each agent an account, inbound/outbound topics, and a public profile.
4. **DeFi Protocol Interaction** -- Read-only price/position data from testnet protocols (no custom smart contracts).
5. **Dashboard** -- Next.js app that visualizes signals, intents, and agent reputation in real time.

## Data Flow

```
Sentinel detects opportunity
  --> publishes Intent to HCS Intent Topic
    --> Coordinator polls via Mirror Node (every 3s)
      --> Risk Engine calculates composite score (60s window)
        --> Groq LLM generates human-readable reasoning
          --> Coordinator broadcasts Signal to Signal Topic
            --> Sentinels read signal, adjust behavior
              --> Coordinator records compliance to Reputation Topic
                --> On milestone: mint Reputation NFT + distribute $SHIELD reward
```

## Risk Scoring

Composite score in range [0.0, 1.0], computed over a **sliding 60-second window** of all intents.

### Formula

```
score = 0.30 * volumeNorm
      + 0.25 * assetConcentration
      + 0.25 * sellPressure
      + 0.20 * velocityNorm
```

| Metric | Weight | Description |
|--------|--------|-------------|
| Volume | 30% | Total USD volume, normalized to $1M threshold |
| Asset Concentration | 25% | Largest single asset as fraction of total volume |
| Sell Pressure | 25% | Ratio of sell/liquidate intents to total count |
| Velocity | 20% | Intents per second, normalized to 5/sec threshold |

Each component is clamped to [0, 1].

### Signal Thresholds

| Score | Signal | Agent Behavior |
|-------|--------|----------------|
| 0.00 - 0.39 | GREEN | Proceed normally (100% size, no delay) |
| 0.40 - 0.69 | YELLOW | Reduce to 50% size, +5s delay |
| 0.70 - 1.00 | RED | Abort transaction, +15s wait |

## Agent Types

| Agent | Instances | Role |
|-------|-----------|------|
| **Coordinator** | 1 | Aggregates intents, scores risk, broadcasts signals, manages reputation |
| **Sentinel Keeper** | 1 | Simulates liquidation bot |
| **Sentinel Arb** | 1 | Simulates arbitrage bot |
| **Sentinel Whale** | 1 | Simulates large position mover |
| **Observer** | 1 | Human-facing chat agent via HCS-10 |

## HCS Message Protocol

All messages use `"p": "agentshield"` and an `"op"` field.

### Intent (`op: "intent"`)

```json
{
  "p": "agentshield",
  "op": "intent",
  "agent_id": "0.0.8268231",
  "action": "liquidate",
  "asset": "HBAR/USDC",
  "size_usd": 31688.37,
  "direction": "sell",
  "urgency": "high",
  "timestamp": 1773992700000
}
```

### Signal (`op: "signal"`)

```json
{
  "p": "agentshield",
  "op": "signal",
  "level": "YELLOW",
  "risk_score": 0.55,
  "reasoning": "Risk is moderate due to high sell pressure...",
  "affected_assets": ["HBAR/USDC"],
  "recommended_delay_ms": 5000,
  "metrics": { "totalIntents": 8, "totalVolumeUsd": 449171, "..." : "..." },
  "timestamp": 1773992703000
}
```

### Reputation (`op: "reputation"`)

```json
{
  "p": "agentshield",
  "op": "reputation",
  "agent_id": "0.0.8268231",
  "event": "compliance",
  "signal_level": "YELLOW",
  "complied": true,
  "trust_score": 0.95,
  "timestamp": 1773992710000
}
```
