import { TopicCreateTransaction, PrivateKey } from '@hashgraph/sdk';
import { createClient } from '../lib/hedera-client.js';
import { CONFIG } from '../lib/config.js';

async function main() {
  const client = createClient(CONFIG.coordinator.accountId, CONFIG.coordinator.privateKey);
  const coordinatorKey = PrivateKey.fromStringECDSA(CONFIG.coordinator.privateKey);

  // Intent Topic — public, any agent can submit
  const intentTx = await new TopicCreateTransaction()
    .setTopicMemo('AgentShield Intent Broadcast v1')
    .execute(client);
  const intentReceipt = await intentTx.getReceipt(client);
  console.log('INTENT_TOPIC_ID=' + intentReceipt.topicId);

  // Signal Topic — only coordinator can submit
  const signalTx = await new TopicCreateTransaction()
    .setTopicMemo('AgentShield Signal Broadcast v1')
    .setSubmitKey(coordinatorKey.publicKey)
    .execute(client);
  const signalReceipt = await signalTx.getReceipt(client);
  console.log('SIGNAL_TOPIC_ID=' + signalReceipt.topicId);

  // Reputation Topic — only coordinator can submit
  const repTx = await new TopicCreateTransaction()
    .setTopicMemo('AgentShield Reputation Log v1')
    .setSubmitKey(coordinatorKey.publicKey)
    .execute(client);
  const repReceipt = await repTx.getReceipt(client);
  console.log('REPUTATION_TOPIC_ID=' + repReceipt.topicId);

  console.log('\nCopy these values to your .env file.');
  client.close();
}

main().catch(console.error);
