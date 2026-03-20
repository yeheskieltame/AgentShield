# Demo Video Script

Target length: 5 minutes. Format: screen recording with voiceover.

## 0:00 to 0:45 | Problem Statement

Show on screen: News articles and data about the October 2025 crash.

Script:

"On October 10, 2025, the crypto market experienced its largest liquidation cascade in history. 19 billion dollars in leveraged positions were wiped out in hours. 1.7 million traders were affected. Bitcoin dropped 14 percent. Solana fell over 40 percent.

The root cause was not fundamental collapse. It was structural failure. Thousands of AI agents, liquidation bots, and keepers all tried to deleverage simultaneously, creating a self-reinforcing doom loop. Unlike traditional markets, crypto has no coordinated circuit breaker.

AgentShield solves this."

## 0:45 to 1:30 | Solution and Architecture

Show on screen: Architecture diagram from README.

Script:

"AgentShield is a pre-execution coordination layer. Before any AI agent executes a transaction, it broadcasts its intent to a shared Hedera Consensus Service topic. A Coordinator agent aggregates all intents in a 60-second sliding window, calculates a composite risk score using four weighted metrics, and uses an LLM to generate reasoning.

When risk is low, the Coordinator broadcasts GREEN. Agents proceed normally. When risk escalates, YELLOW signals agents to reduce position sizes by 50 percent. At critical levels, RED signals agents to abort entirely.

This is voluntary, decentralized, and requires no smart contract pauses."

## 1:30 to 3:30 | Live Demo

### Setup (pre-recorded)

Start the Coordinator in one terminal. Open the dashboard.

### Phase 1: Normal Operation (30 seconds)

Show on screen: Dashboard with GREEN signal, low risk score, normal intent feed.

"The system is live on Hedera Testnet. The Coordinator is monitoring. Risk score is low. Signal is GREEN. All agents are operating normally."

### Phase 2: Run Flash Crash Scenario

Run `npm run demo:crash` in a new terminal.

Show on screen: Dashboard updating in real-time.

"Now we simulate a flash crash. Multiple agents start publishing high-volume liquidation intents simultaneously."

### Phase 3: Circuit Breaker Activates

Show on screen: Risk gauge moving, signal changing to YELLOW then RED, intent feed showing activity.

"Watch the risk score climb. The Coordinator detects the cascade pattern. Signal transitions from GREEN to YELLOW. Agents automatically reduce their position sizes by 50 percent.

As pressure continues, the signal goes RED. All agents abort their transactions. The circuit breaker has activated. No central authority made this decision. The agents collectively recognized the risk and stopped."

### Phase 4: Recovery

Show on screen: Risk subsiding, signal returning to GREEN.

"As the 60-second window clears, intents drop off. The Coordinator recalculates. Risk score falls below threshold. Signal returns to GREEN. Agents resume normal operation. The cascade was prevented."

## 3:30 to 4:15 | HOL Integration and Chat

Show on screen: moonscape.tech showing registered agents.

"All five agents are registered in the Hashgraph Online Registry via HCS-10. They are discoverable, chattable, and composable."

Show on screen: Chat bubble on dashboard.

"Users can chat with the Observer agent in natural language. It provides real-time risk assessments powered by Groq LLM."

Type: "What is the current risk level?"

Show the AI response.

## 4:15 to 5:00 | Hedera Integration and Roadmap

Show on screen: Explorer page showing HCS topics, tokens, transaction hashes.

"AgentShield uses five Hedera native services. HCS for intent and signal broadcast. HTS for the SHIELD token and Reputation NFTs. Account Service for agent management. Mirror Node for real-time data. HCS-10 for agent registration and communication.

Next steps: integration with Bonzo Finance and SaucerSwap on testnet, mainnet deployment in Q3 2026, and multi-chain expansion for cross-chain intent aggregation.

AgentShield. Preventing the next 19 billion dollar cascade."
