# Setup Guide

## Prerequisites

- Node.js 18 or higher with npm
- 6 Hedera Testnet accounts (free at portal.hedera.com)
- Groq API key (free at console.groq.com)

## 1. Install Dependencies

```bash
git clone https://github.com/yeheskieltame/AgentShield.git
cd AgentShield
npm install
cd dashboard && npm install && cd ..
```

## 2. Create Testnet Accounts

Create 6 accounts at portal.hedera.com/dashboard. Each receives 10,000 test HBAR. Assign them as:

| Account | Role |
|---------|------|
| Account 1 | Coordinator |
| Account 2 | Sentinel Keeper |
| Account 3 | Sentinel Arb |
| Account 4 | Sentinel Whale |
| Account 5 | Observer |
| Account 6 | Treasury |

## 3. Configure Environment

```bash
cp .env.example .env
```

Fill in all account IDs and private keys. Add your Groq API key. Leave topic and token IDs empty for now.

## 4. Run Setup Scripts

Execute in order. Each script outputs IDs to copy back into `.env`.

```bash
npx tsx scripts/setup-topics.ts
# Output: INTENT_TOPIC_ID, SIGNAL_TOPIC_ID, REPUTATION_TOPIC_ID
# Copy these to .env

npx tsx scripts/create-tokens.ts
# Output: SHIELD_TOKEN_ID, REPUTATION_NFT_ID
# Copy these to .env

npx tsx scripts/register-agents.ts
# Registers all 5 agents in HOL Registry
# Takes 5-10 minutes (creates accounts, inscribes profiles)

npx tsx scripts/fund-agents.ts
# Sends 10 HBAR to each agent account from treasury
```

## 5. Run Agents

Start each in a separate terminal. Coordinator must start first.

```bash
# Terminal 1
npm run coordinator

# Terminal 2
npm run sentinel:keeper

# Terminal 3
npm run sentinel:arb

# Terminal 4
npm run sentinel:whale

# Terminal 5 (optional)
npm run observer
```

## 6. Run Dashboard

```bash
cd dashboard
cp ../.env .env.local   # Or manually set GROQ_API_KEY in .env.local
npm run dev
```

Open http://localhost:3000.

## 7. Run Demo

With the Coordinator running in Terminal 1, open a new terminal:

```bash
npm run demo:crash      # Flash crash simulation
npm run demo:whale      # Whale dump simulation
npm run demo:normal     # Normal trading baseline
```

Watch the dashboard update in real-time as risk signals change.
