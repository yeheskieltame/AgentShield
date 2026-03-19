import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';
import { CONFIG } from './config.js';

export function createClient(accountId: string, privateKey: string): Client {
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(accountId),
    PrivateKey.fromStringECDSA(privateKey)
  );
  return client;
}
