import {
  HCS10Client,
  AgentBuilder,
  AIAgentCapability,
} from '@hashgraphonline/standards-sdk';
import { CONFIG } from '../lib/config.js';

async function registerAgent(
  name: string,
  description: string,
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
    .setDescription(description)
    .setAgentType(agentType)
    .setCapabilities([
      AIAgentCapability.TEXT_GENERATION,
      AIAgentCapability.KNOWLEDGE_RETRIEVAL,
      AIAgentCapability.DATA_ANALYSIS,
    ])
    .setNetwork('testnet')
    .setMetadata({
      creator: 'AgentShield Protocol',
      version: '1.0',
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
    'DeFi circuit breaker coordinator. Aggregates agent intents, calculates cascade risk, broadcasts safety signals.',
    'autonomous',
    CONFIG.coordinator.accountId,
    CONFIG.coordinator.privateKey,
    'coordinator',
  );

  await registerAgent(
    'AgentShield Sentinel Keeper',
    'DeFi keeper bot sentinel. Monitors liquidation opportunities and broadcasts intents before execution.',
    'autonomous',
    CONFIG.sentinels.keeper.accountId,
    CONFIG.sentinels.keeper.privateKey,
    'sentinel-keeper',
  );

  await registerAgent(
    'AgentShield Sentinel Arb',
    'Arbitrage bot sentinel. Detects cross-venue price discrepancies and broadcasts swap intents.',
    'autonomous',
    CONFIG.sentinels.arb.accountId,
    CONFIG.sentinels.arb.privateKey,
    'sentinel-arbitrage',
  );

  await registerAgent(
    'AgentShield Sentinel Whale',
    'Whale movement sentinel. Simulates large position changes and broadcasts movement intents.',
    'autonomous',
    CONFIG.sentinels.whale.accountId,
    CONFIG.sentinels.whale.privateKey,
    'sentinel-whale',
  );

  await registerAgent(
    'AgentShield Observer',
    'Human-facing chat agent. Answers questions about current DeFi risk levels in natural language.',
    'manual',
    CONFIG.observer.accountId,
    CONFIG.observer.privateKey,
    'observer',
  );

  console.log('\nAll agents registered in HOL Registry.');
  console.log('Verify at: https://moonscape.tech');
}

main().catch(console.error);
