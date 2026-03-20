# Architecture

## System Overview

AgentShield operates as a five-layer stack. No custom smart contracts are deployed. All on-chain logic uses Hedera native services.

```mermaid
graph TB
    subgraph L1["Layer 1: AI Agents"]
        direction LR
        SK[Sentinel Keeper]
        SA[Sentinel Arb]
        SW[Sentinel Whale]
        CO[Coordinator]
        OB[Observer]
    end

    subgraph L2["Layer 2: Hedera Native Services"]
        direction LR
        HCS[HCS Topics x3]
        HTS[HTS Tokens x2]
        ACC[Account Service]
        MN[Mirror Node API]
    end

    subgraph L3["Layer 3: HOL Integration"]
        direction LR
        REG[HCS-10 Registry]
        COM[Agent Communication]
    end

    subgraph L4["Layer 4: DeFi Protocol Interaction"]
        direction LR
        BF[Bonzo Finance<br/>Read-only]
        SS[SaucerSwap<br/>Read-only]
    end

    subgraph L5["Layer 5: Dashboard"]
        direction LR
        UI[Next.js App]
        RT[Real-time Polling]
        CHAT[AI Chat via Groq]
    end

    L1 --> L2
    L1 --> L3
    L1 -.-> L4
    L2 --> L5
```

## Agent Types

| Agent | Count | Purpose | Autonomy |
|-------|-------|---------|----------|
| Coordinator | 1 | Aggregates intents, calculates risk, broadcasts signals, mints reputation NFTs | Autonomous |
| Sentinel Keeper | 1 | Simulates liquidation bot. Publishes intent before executing. Complies with signals. | Autonomous |
| Sentinel Arb | 1 | Simulates arbitrage bot. Publishes swap intents. Adjusts size based on signals. | Autonomous |
| Sentinel Whale | 1 | Simulates large position mover. Publishes large transfer intents. | Autonomous |
| Observer | 1 | Accepts natural language queries via HCS-10. Returns current risk status. | Manual |

## Risk Engine

The Coordinator maintains a sliding 60-second window of all received intents. On each new intent, it recalculates four metrics:

```mermaid
graph LR
    I[New Intent] --> W[60s Window]
    W --> V[Volume<br/>30% weight]
    W --> C[Concentration<br/>25% weight]
    W --> S[Sell Pressure<br/>25% weight]
    W --> VE[Velocity<br/>20% weight]
    V --> SC[Composite Score<br/>0.0 to 1.0]
    C --> SC
    S --> SC
    VE --> SC
    SC -->|0.0-0.39| G[GREEN]
    SC -->|0.40-0.69| Y[YELLOW]
    SC -->|0.70-1.00| R[RED]
```

The score is passed to Groq LLM (llama-3.3-70b-versatile) for natural language reasoning, then broadcast as a signal.

## Signal Compliance

```mermaid
sequenceDiagram
    participant C as Coordinator
    participant S as Sentinel

    C->>S: Signal GREEN
    Note right of S: Proceed normally<br/>100% size, 0s delay

    C->>S: Signal YELLOW
    Note right of S: Reduce exposure<br/>50% size, 5s delay

    C->>S: Signal RED
    Note right of S: Abort transaction<br/>0% size, 15s wait
```

Compliance is tracked per agent. Every 10 compliant actions triggers a Reputation NFT mint and 1000 SHIELD token reward.

## Reputation System

```mermaid
graph LR
    S[Signal Broadcast] --> T[Track Compliance]
    T -->|Compliant| C[Increment Counter]
    T -->|Violation| V[Log Violation]
    C -->|Every 10| M[Mint Reputation NFT]
    M --> D[Distribute 1000 SHIELD]
    C --> P[Publish ReputationEvent to HCS]
    V --> P
```

## HCS Topic Architecture

| Topic | Submit Key | Content | Frequency |
|-------|-----------|---------|-----------|
| Intent | Public (any agent) | Transaction intents with action, asset, size, direction, urgency | Every 3-45 seconds per agent |
| Signal | Coordinator private key | Risk level, score, reasoning, metrics, recommended delay | On risk level change or threshold |
| Reputation | Coordinator private key | Compliance events, trust scores | After each signal broadcast |

## Dashboard Architecture

The dashboard is a Next.js application that reads exclusively from Hedera Mirror Node REST API. No backend database.

```mermaid
graph LR
    MN[Hedera Mirror Node] -->|GET /topics/ID/messages| P[Polling Hook<br/>3s interval]
    P --> H[Home Page<br/>Risk gauge, intents, signals]
    P --> A[Agents Page<br/>Registry, compliance, balances]
    P --> AN[Analytics Page<br/>Charts, heatmap]
    P --> E[Explorer Page<br/>Raw HCS messages, tokens]
    G[Groq API] -->|POST /api/chat| C[Chat Bubble<br/>AI responses]
```
