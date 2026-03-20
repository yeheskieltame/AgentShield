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
    action: 'swap',
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

  console.log('=== WHALE DUMP SIMULATION ===\n');
  console.log('Shows how a single large actor triggers the circuit breaker.\n');

  // Phase 1: Normal trading (30 seconds)
  console.log('--- Phase 1: Normal Trading (30s) ---');
  for (let i = 0; i < 3; i++) {
    const isKeeper = i % 2 === 0;
    const client = isKeeper ? keeperClient : arbClient;
    const agentId = isKeeper ? CONFIG.sentinels.keeper.accountId : CONFIG.sentinels.arb.accountId;
    const size = 5000 + Math.random() * 20000;
    const direction: Intent['direction'] = Math.random() > 0.5 ? 'buy' : 'sell';

    await publishIntent(client, makeIntent(agentId, {
      action: 'swap',
      size_usd: Math.round(size),
      direction,
      urgency: 'low',
    }));
    console.log(`  Normal trade ${i + 1}/3: ${direction.toUpperCase()} $${Math.round(size).toLocaleString()}`);
    await sleep(10000);
  }

  // Phase 2: Whale starts dumping (20 seconds)
  console.log('\n--- Phase 2: WHALE DUMPING (20s) ---');
  console.log('  Whale begins rapid large sell-offs...\n');
  for (let i = 0; i < 5; i++) {
    const size = 200000 + Math.random() * 600000; // $200K-$800K each
    await publishIntent(whaleClient, makeIntent(CONFIG.sentinels.whale.accountId, {
      action: 'large_transfer',
      asset: 'HBAR/USDC',
      size_usd: Math.round(size),
      direction: 'sell',
      urgency: 'high',
    }));
    console.log(`  WHALE DUMP ${i + 1}/5: SELL $${Math.round(size).toLocaleString()} HBAR/USDC (high urgency)`);

    // 3-5 seconds between dumps
    const delay = 3000 + Math.random() * 2000;
    await sleep(delay);
  }

  // Phase 3: System reacts (15 seconds)
  console.log('\n--- Phase 3: System Reaction (15s) ---');
  console.log('  Coordinator should escalate: GREEN -> YELLOW -> RED');
  console.log('  Sentinels should reduce or halt activity...\n');

  // Keeper and arb attempt a couple more trades during the reaction window
  for (let i = 0; i < 2; i++) {
    const isKeeper = i === 0;
    const client = isKeeper ? keeperClient : arbClient;
    const agentId = isKeeper ? CONFIG.sentinels.keeper.accountId : CONFIG.sentinels.arb.accountId;
    const name = isKeeper ? 'Keeper' : 'Arb';

    await publishIntent(client, makeIntent(agentId, {
      action: 'swap',
      size_usd: 10000 + Math.random() * 20000,
      direction: 'sell',
      urgency: 'medium',
    }));
    console.log(`  ${name} attempts trade during reaction — should be throttled/blocked`);
    await sleep(7000);
  }

  // Phase 4: Recovery (15 seconds)
  console.log('\n--- Phase 4: Recovery (15s) ---');
  console.log('  Whale has stopped dumping.');
  console.log('  Waiting for risk window to clear and signal to return to GREEN...');
  await sleep(15000);

  console.log('\n=== SIMULATION COMPLETE ===');
  console.log('Check Coordinator logs and Dashboard for signal transitions:');
  console.log('  GREEN -> YELLOW -> RED -> (recovery) -> GREEN');

  keeperClient.close();
  arbClient.close();
  whaleClient.close();
}

main().catch(console.error);
