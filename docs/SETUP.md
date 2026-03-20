# AgentShield Quick Setup Guide

## Prerequisites

- **Node.js 18+** (with npm)
- **6 Hedera Testnet accounts** -- create free at [portal.hedera.com](https://portal.hedera.com/dashboard)
  - Coordinator, Sentinel Keeper, Sentinel Arb, Sentinel Whale, Observer, Treasury
- **Groq API key** -- free at [console.groq.com](https://console.groq.com)

## 1. Clone and Install

```bash
git clone https://github.com/YourUsername/AgentShield.git
cd AgentShield
npm install
cd dashboard && npm install && cd ..
```

## 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your `.env` with:
- All 6 Hedera account IDs and their ED25519 private keys
- Your Groq API key
- Leave topic IDs and token IDs blank for now (setup scripts will generate them)

## 3. Run Setup Scripts (in order)

Each script outputs IDs that you must copy back into `.env` before running the next one.

```bash
# Step 1: Create HCS topics (Intent, Signal, Reputation)
npx tsx scripts/setup-topics.ts
# --> Copy INTENT_TOPIC_ID, SIGNAL_TOPIC_ID, REPUTATION_TOPIC_ID to .env

# Step 2: Create HTS tokens ($SHIELD fungible + Reputation NFT)
npx tsx scripts/create-tokens.ts
# --> Copy SHIELD_TOKEN_ID, REPUTATION_NFT_ID to .env

# Step 3: Register all 5 agents in HOL Registry (HCS-10)
npx tsx scripts/register-agents.ts

# Step 4: Fund agent accounts with test HBAR
npx tsx scripts/fund-agents.ts
```

## 4. Run Agents

Start the Coordinator first, then Sentinels, then Observer. Each runs in its own terminal.

```bash
# Terminal 1 -- Coordinator (must start first)
npm run coordinator

# Terminal 2 -- Sentinel Keeper
npm run sentinel:keeper

# Terminal 3 -- Sentinel Arb
npm run sentinel:arb

# Terminal 4 -- Sentinel Whale
npm run sentinel:whale

# Terminal 5 -- Observer
npm run observer
```

You should see:
- Sentinels publishing intents every few seconds
- Coordinator calculating risk and broadcasting GREEN/YELLOW signals
- Observer reporting status

## 5. Run Dashboard

```bash
cd dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see live signal and intent data.

## 6. Run Demo Scenarios

### Flash Crash Simulation

With the Coordinator already running in Terminal 1:

```bash
npm run demo:crash
```

This runs a 4-phase scenario (~80 seconds total):

| Phase | Duration | What Happens |
|-------|----------|--------------|
| Normal | 30s | 3 small trades at regular intervals |
| Tension | 20s | 6 trades at higher volume |
| Cascade | 15s | 15 high-urgency liquidations from 3 agents |
| Recovery | 15s | Wait for risk to subside |

Expected signal progression: **GREEN --> YELLOW --> RED --> GREEN**

Watch the Coordinator terminal and Dashboard for real-time signal transitions.

## Troubleshooting

- **"INVALID_SIGNATURE"** -- Make sure the private key matches the account ID in `.env`.
- **"INSUFFICIENT_PAYER_BALANCE"** -- Fund your accounts at [portal.hedera.com](https://portal.hedera.com/dashboard) (free testnet HBAR).
- **Token association errors** -- Normal on first run; the code handles these with try/catch.
- **Mirror Node lag** -- HCS messages take 3-7 seconds to appear via Mirror Node polling. Be patient.
