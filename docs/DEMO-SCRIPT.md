# AgentShield Demo Video Script

**Target length:** 5 minutes max
**Format:** Screen recording with voiceover

---

## 0:00 - 0:45 -- Problem Statement

**Show on screen:** Slide or browser showing news articles about the Oct 2025 crash.

**Script:**

> On October 10, 2025, the crypto market experienced its largest liquidation cascade in history. $19 billion in leveraged positions were wiped out in hours. 1.7 million traders were affected. Bitcoin dropped 14%. Solana fell over 40%.
>
> The root cause was not fundamental collapse -- it was structural failure. Thousands of AI agents, liquidation bots, and keepers all tried to deleverage at once, creating a self-reinforcing doom loop. Unlike traditional markets, crypto has no coordinated circuit breaker.
>
> AgentShield solves this.

**Sources to show:**
- https://insights4vc.substack.com/p/inside-the-19b-flash-crash
- https://hackernoon.com/what-the-october-2025-flash-crash-taught-us-about-liquidations-and-why-defi-needs-better-fail-safe

---

## 0:45 - 1:30 -- Solution and Architecture

**Show on screen:** Architecture diagram from README (or the ASCII diagram from `docs/ARCHITECTURE.md`).

**Script:**

> AgentShield is a pre-execution coordination layer for DeFi agents, built entirely on Hedera native services -- no custom smart contracts.
>
> Here's how it works: AI agents broadcast their transaction intent to a shared HCS topic BEFORE executing. A Coordinator agent aggregates all intents in a 60-second sliding window and calculates a composite risk score using four weighted metrics -- volume, asset concentration, sell pressure, and velocity.
>
> The Coordinator uses Groq's Llama-3.3-70b model to generate human-readable risk reasoning, then broadcasts a safety signal: GREEN means proceed, YELLOW means reduce exposure by 50%, RED means abort entirely.
>
> Agents autonomously comply. Compliant agents earn on-chain reputation NFTs and $SHIELD token rewards. All of this runs on Hedera Testnet using HCS for messaging, HTS for tokens, and HCS-10 for agent registration.

---

## 1:30 - 3:30 -- Live Demo: Flash Crash Simulation

### Setup (1:30 - 1:50)

**Show on screen:** Terminal windows side by side + Dashboard in browser.

**Run these commands:**

```bash
# Terminal 1: Start Coordinator
npm run coordinator
```

Wait for `[Coordinator] Running. Ctrl+C to stop.` to appear.

```bash
# Browser: Open dashboard
# Navigate to http://localhost:3000
```

**Script:**
> Let me start the Coordinator agent. It's now listening for intents on the HCS Intent Topic via Mirror Node polling. The dashboard is live, showing current risk status as GREEN.

### Flash Crash Scenario (1:50 - 3:15)

**Run this command in a new terminal:**

```bash
# Terminal 2: Run flash crash simulation
npm run demo:crash
```

**Script (narrate as each phase runs):**

> I'm starting our flash crash simulation. It has four phases.
>
> **Phase 1 -- Normal trading.** Three small trades at regular intervals. The Coordinator sees low volume and low sell pressure. Risk score stays below 0.4 -- we're GREEN.
>
> *(Wait ~30s, point to dashboard showing GREEN signal)*
>
> **Phase 2 -- Tension building.** Six trades at higher volume, mix of liquidations and swaps. Watch the risk score climbing... we just hit YELLOW. The Coordinator is telling agents to reduce position sizes by 50% and add a 5-second delay.
>
> *(Wait ~20s, point to YELLOW signal on dashboard)*
>
> **Phase 3 -- Cascade attempt.** Now 15 high-urgency liquidation intents hit simultaneously from three different agents. This is the doom loop scenario. Watch the score spike...
>
> *(Point to dashboard)* There it is -- RED signal. Score above 0.7. The Coordinator is telling all agents to abort and wait 15 seconds. In a real scenario, this prevents the cascade from amplifying.
>
> *(Wait ~15s)*
>
> **Phase 4 -- Recovery.** No new intents. The 60-second window clears. Risk subsides... and we're back to GREEN.

### Show HCS Messages (3:15 - 3:30)

**Show on screen:** Dashboard showing intent feed, signal history, and reputation events.

**Script:**
> Every intent, signal, and reputation event is recorded on-chain via HCS. Here you can see the full timeline -- intents from sentinels, signal transitions from the Coordinator, and compliance records. All verifiable on Hedera Testnet.

---

## 3:30 - 4:15 -- HOL Integration

### Show Agent Registry (3:30 - 3:50)

**Show on screen:** Browser at https://moonscape.tech

**Script:**
> All five AgentShield agents are registered in the Hashgraph Online Registry using the HCS-10 standard. Here on moonscape.tech you can see our Coordinator, three Sentinels, and the Observer agent -- each with their own inbound/outbound topics for agent-to-agent communication.

**Navigate to:** Search for "agentshield" on moonscape.tech. Show the Coordinator entry with its account, topics, and profile.

### Demo HCS-10 Chat (3:50 - 4:15)

**Show on screen:** Terminal running Observer + HCS-10 chat interaction.

**Script:**
> The Observer agent uses HCS-10 for human-agent communication. I can send a message asking about current risk status, and the Observer responds with the latest signal information -- all routed through Hedera Consensus Service. This demonstrates the HOL standard for trustless agent-to-agent and human-to-agent messaging.

---

## 4:15 - 5:00 -- Roadmap and Closing

**Show on screen:** Slide with roadmap bullets.

**Script:**

> **What we built for this hackathon:**
> - 5 AI agents coordinating via HCS with LLM-powered risk reasoning
> - Real-time risk scoring with 4-factor weighted model
> - Autonomous signal compliance with on-chain reputation tracking
> - $SHIELD token rewards and reputation NFTs via HTS
> - Full HCS-10 integration with Hashgraph Online Registry
> - Live dashboard polling Mirror Node
>
> **Roadmap:**
> - Real DeFi protocol integration (Bonzo Finance, SaucerSwap production feeds)
> - Staking mechanism -- agents stake $SHIELD tokens, slashed for non-compliance
> - Cross-protocol coordination -- multiple DeFi protocols sharing one circuit breaker
> - Mainnet deployment with governance DAO
>
> AgentShield proves that a voluntary, decentralized circuit breaker is possible using Hedera's native services. No custom smart contracts. No centralized kill switches. Just AI agents coordinating through consensus.
>
> Thank you.

---

## Checklist Before Recording

- [ ] All 6 Hedera testnet accounts funded
- [ ] `.env` fully configured
- [ ] Coordinator starts without errors
- [ ] Dashboard loads at localhost:3000
- [ ] `npm run demo:crash` runs the full 4-phase scenario
- [ ] Agents visible on moonscape.tech
- [ ] Video is under 5 minutes
