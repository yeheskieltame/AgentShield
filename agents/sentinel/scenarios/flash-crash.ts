import { TopicMessageSubmitTransaction } from '@hashgraph/sdk';
import { createClient } from '../../../lib/hedera-client.js';
import { CONFIG } from '../../../lib/config.js';
import { Intent } from '../../../lib/types.js';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeIntent(agentId: string, overrides: Partial<Intent>): Intent {
  return {
    p: 'agentshield',
    op: 'intent',
    agent_id: agentId,
    action: 'liquidate',
    asset: 'HBAR/USDC',
    size_usd: 10000,
    direction: 'sell',
    urgency: 'medium',
    timestamp: Date.now(),
    ...overrides,
  };
}

async function publishIntent(client: any, intent: Intent) {
  await new TopicMessageSubmitTransaction()
    .setTopicId(CONFIG.topics.intent)
    .setMessage(JSON.stringify(intent))
    .execute(client);
}

async function main() {
  const keeperClient = createClient(CONFIG.sentinels.keeper.accountId, CONFIG.sentinels.keeper.privateKey);
  const arbClient = createClient(CONFIG.sentinels.arb.accountId, CONFIG.sentinels.arb.privateKey);
  const whaleClient = createClient(CONFIG.sentinels.whale.accountId, CONFIG.sentinels.whale.privateKey);

  console.log('=== FLASH CRASH SIMULATION ===\n');

  // Phase 1: Normal trading (30 seconds)
  console.log('--- Phase 1: Normal Trading (30s) ---');
  for (let i = 0; i < 3; i++) {
    await publishIntent(keeperClient, makeIntent(CONFIG.sentinels.keeper.accountId, {
      action: 'swap',
      size_usd: 5000 + Math.random() * 15000,
      direction: Math.random() > 0.5 ? 'sell' : 'buy',
      urgency: 'low',
    }));
    console.log(`  Normal trade ${i + 1}/3`);
    await sleep(10000);
  }

  // Phase 2: Tension building (20 seconds)
  console.log('\n--- Phase 2: Tension Building (20s) ---');
  for (let i = 0; i < 6; i++) {
    const client = i % 2 === 0 ? keeperClient : arbClient;
    const agentId = i % 2 === 0 ? CONFIG.sentinels.keeper.accountId : CONFIG.sentinels.arb.accountId;
    await publishIntent(client, makeIntent(agentId, {
      action: i % 3 === 0 ? 'liquidate' : 'swap',
      size_usd: 20000 + Math.random() * 80000,
      direction: Math.random() > 0.3 ? 'sell' : 'buy',
      urgency: 'medium',
    }));
    console.log(`  Tension trade ${i + 1}/6`);
    await sleep(3300);
  }

  // Phase 3: Cascade attempt (15 seconds)
  console.log('\n--- Phase 3: CASCADE ATTEMPT (15s) ---');
  const cascadePromises = [];
  for (let i = 0; i < 15; i++) {
    const clients = [keeperClient, arbClient, whaleClient];
    const agentIds = [CONFIG.sentinels.keeper.accountId, CONFIG.sentinels.arb.accountId, CONFIG.sentinels.whale.accountId];
    const idx = i % 3;

    cascadePromises.push(
      (async () => {
        await sleep(i * 1000);
        await publishIntent(clients[idx], makeIntent(agentIds[idx], {
          action: 'liquidate',
          asset: 'HBAR/USDC',
          size_usd: 50000 + Math.random() * 200000,
          direction: 'sell',
          urgency: 'high',
        }));
        console.log(`  CASCADE intent ${i + 1}/15 — SELL $${(50000 + Math.random() * 200000).toFixed(0)}`);
      })()
    );
  }
  await Promise.all(cascadePromises);

  // Phase 4: Recovery (15 seconds)
  console.log('\n--- Phase 4: Recovery (15s) ---');
  console.log('  Sentinels should be respecting RED signal...');
  console.log('  Waiting for risk to subside...');
  await sleep(15000);

  console.log('\n=== SIMULATION COMPLETE ===');
  console.log('Check Coordinator logs and Dashboard for signal transitions:');
  console.log('  GREEN -> YELLOW -> RED -> GREEN');

  keeperClient.close();
  arbClient.close();
  whaleClient.close();
}

main().catch(console.error);
