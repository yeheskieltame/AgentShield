import {
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  PrivateKey,
} from '@hashgraph/sdk';
import { createClient } from '../lib/hedera-client.js';
import { CONFIG } from '../lib/config.js';

async function main() {
  const client = createClient(CONFIG.coordinator.accountId, CONFIG.coordinator.privateKey);
  const coordinatorKey = PrivateKey.fromStringECDSA(CONFIG.coordinator.privateKey);

  // $SHIELD fungible token
  const shieldTx = await new TokenCreateTransaction()
    .setTokenName('AgentShield Token')
    .setTokenSymbol('SHIELD')
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(8)
    .setInitialSupply(100_000_000 * 10 ** 8)
    .setTreasuryAccountId(CONFIG.coordinator.accountId)
    .setSupplyKey(coordinatorKey.publicKey)
    .setAdminKey(coordinatorKey.publicKey)
    .execute(client);
  const shieldReceipt = await shieldTx.getReceipt(client);
  console.log('SHIELD_TOKEN_ID=' + shieldReceipt.tokenId);

  // Reputation NFT collection
  const nftTx = await new TokenCreateTransaction()
    .setTokenName('AgentShield Reputation')
    .setTokenSymbol('ASREP')
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(CONFIG.coordinator.accountId)
    .setSupplyKey(coordinatorKey.publicKey)
    .setAdminKey(coordinatorKey.publicKey)
    .execute(client);
  const nftReceipt = await nftTx.getReceipt(client);
  console.log('REPUTATION_NFT_ID=' + nftReceipt.tokenId);

  console.log('\nCopy these values to your .env file.');
  client.close();
}

main().catch(console.error);
