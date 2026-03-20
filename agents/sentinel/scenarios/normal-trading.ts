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
    direction: 'buy',
    urgency: 'low',
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

  const agents = [
    { client: keeperClient, id: CONFIG.sentinels.keeper.accountId, name: 'Keeper' },
    { client: arbClient, id: CONFIG.sentinels.arb.accountId, name: 'Arb' },
    { client: whaleClient, id: CONFIG.sentinels.whale.accountId, name: 'Whale' },
  ];

  const assets = ['HBAR/USDC', 'HBAR/USDC', 'HBARX/HBAR', 'SAUCE/USDC'];
  const actions: Intent['action'][] = ['swap', 'swap', 'swap', 'withdraw'];

  console.log('=== NORMAL TRADING SIMULATION ===\n');
  console.log('Duration: ~2 minutes');
  console.log('Expected signal: GREEN throughout\n');

  console.log('--- Normal Market Conditions ---');
  console.log('3 agents trading at relaxed intervals (8-20s each)\n');

  // Run 3 agents in parallel, each trading independently for ~2 minutes
  const startTime = Date.now();
  const durationMs = 120_000; // 2 minutes

  const agentTasks = agents.map(async (agent, agentIdx) => {
    let tradeNum = 0;
    while (Date.now() - startTime < durationMs) {
      tradeNum++;
      const size = 5000 + Math.random() * 45000; // $5K-$50K
      const direction: Intent['direction'] = Math.random() > 0.45 ? 'buy' : 'sell';
      const urgency: Intent['urgency'] = Math.random() > 0.7 ? 'medium' : 'low';
      const asset = assets[Math.floor(Math.random() * assets.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];

      await publishIntent(agent.client, makeIntent(agent.id, {
        action,
        asset,
        size_usd: Math.round(size),
        direction,
        urgency,
      }));

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`  [${elapsed}s] ${agent.name} #${tradeNum}: ${direction.toUpperCase()} ${action} $${Math.round(size).toLocaleString()} ${asset} (${urgency})`);

      // Relaxed interval: 8-20 seconds
      const delay = 8000 + Math.random() * 12000;
      await sleep(delay);
    }
  });

  await Promise.all(agentTasks);

  console.log('\n=== SIMULATION COMPLETE ===');
  console.log('Coordinator should have stayed GREEN the entire time.');
  console.log('Check Dashboard to confirm no signal escalation occurred.');

  keeperClient.close();
  arbClient.close();
  whaleClient.close();
}

main().catch(console.error);
