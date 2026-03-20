import {
  HCS10Client,
  AgentBuilder,
  AIAgentCapability,
} from '@hashgraphonline/standards-sdk';
import { CONFIG } from '../lib/config.js';

async function registerAgent(
  name: string,
  bio: string,
  agentType: 'autonomous' | 'manual',
  accountId: string,
  privateKey: string,
  role: string,
) {
  const client = new HCS10Client({
    network: 'testnet',
    operatorId: accountId,
    operatorPrivateKey: privateKey,
    guardedRegistryBaseUrl: CONFIG.hol.registryUrl,
  });

  const builder = new AgentBuilder()
    .setName(name)
    .setBio(bio)
    .setType(agentType)
    .setModel('llama-3.3-70b-versatile')
    .setCreator('AgentShield Protocol')
    .setCapabilities([
      AIAgentCapability.TEXT_GENERATION,
      AIAgentCapability.KNOWLEDGE_RETRIEVAL,
      AIAgentCapability.DATA_INTEGRATION,
      AIAgentCapability.MULTI_AGENT_COORDINATION,
      AIAgentCapability.TRANSACTION_ANALYTICS,
    ])
    .setNetwork('testnet')
    .setMetadata({
      type: agentType,
      creator: 'AgentShield Protocol',
      properties: {
        role,
        protocol: 'agentshield',
        category: 'defi-infrastructure',
      },
    });

  const result = await client.createAndRegisterAgent(builder);
  console.log(`Registered ${name}: ${JSON.stringify(result)}`);
  return result;
}

async function main() {
  await registerAgent(
    'AgentShield Coordinator',
    'DeFi circuit breaker coordinator. Aggregates agent intents, calculates cascade risk scores using a sliding window, and broadcasts GREEN/YELLOW/RED safety signals to prevent cascading liquidations.',
    'autonomous',
    CONFIG.coordinator.accountId,
    CONFIG.coordinator.privateKey,
    'coordinator',
  );

  await registerAgent(
    'AgentShield Sentinel Keeper',
    'DeFi keeper bot sentinel. Monitors liquidation opportunities on Hedera DeFi protocols and broadcasts intents before execution for collective risk assessment.',
    'autonomous',
    CONFIG.sentinels.keeper.accountId,
    CONFIG.sentinels.keeper.privateKey,
    'sentinel-keeper',
  );

  await registerAgent(
    'AgentShield Sentinel Arb',
    'Arbitrage bot sentinel. Detects cross-venue price discrepancies on Hedera DEXes and broadcasts swap intents for coordinated risk management.',
    'autonomous',
    CONFIG.sentinels.arb.accountId,
    CONFIG.sentinels.arb.privateKey,
    'sentinel-arbitrage',
  );

  await registerAgent(
    'AgentShield Sentinel Whale',
    'Whale movement sentinel. Simulates large position changes and broadcasts movement intents to enable collective awareness of systemic risk.',
    'autonomous',
    CONFIG.sentinels.whale.accountId,
    CONFIG.sentinels.whale.privateKey,
    'sentinel-whale',
  );

  await registerAgent(
    'AgentShield Observer',
    'Human-facing chat agent for AgentShield protocol. Answers questions about current DeFi risk levels, signal history, and agent activity in natural language.',
    'manual',
    CONFIG.observer.accountId,
    CONFIG.observer.privateKey,
    'observer',
  );

  console.log('\nAll agents registered in HOL Registry.');
  console.log('Verify at: https://moonscape.tech');
}

main().catch(console.error);
