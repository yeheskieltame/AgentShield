import { TransferTransaction, Hbar } from '@hashgraph/sdk';
import { createClient } from '../lib/hedera-client.js';
import { CONFIG } from '../lib/config.js';

async function main() {
  const client = createClient(CONFIG.treasury.accountId, CONFIG.treasury.privateKey);

  const agents = [
    { name: 'Coordinator', accountId: CONFIG.coordinator.accountId },
    { name: 'Sentinel Keeper', accountId: CONFIG.sentinels.keeper.accountId },
    { name: 'Sentinel Arb', accountId: CONFIG.sentinels.arb.accountId },
    { name: 'Sentinel Whale', accountId: CONFIG.sentinels.whale.accountId },
    { name: 'Observer', accountId: CONFIG.observer.accountId },
  ];

  for (const agent of agents) {
    const tx = await new TransferTransaction()
      .addHbarTransfer(CONFIG.treasury.accountId, new Hbar(-10))
      .addHbarTransfer(agent.accountId, new Hbar(10))
      .execute(client);

    const receipt = await tx.getReceipt(client);
    console.log(`Funded ${agent.name} (${agent.accountId}): ${receipt.status}`);
  }

  console.log('\nAll agents funded with 10 HBAR each.');
  client.close();
}

main().catch(console.error);
