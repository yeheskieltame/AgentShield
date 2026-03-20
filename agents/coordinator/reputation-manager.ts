import {
  TopicMessageSubmitTransaction,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  PrivateKey,
  AccountId,
  TokenId,
} from '@hashgraph/sdk';
import { Client } from '@hashgraph/sdk';
import { CONFIG } from '../../lib/config.js';
import { ReputationEvent } from '../../lib/types.js';

interface AgentRecord {
  compliant: number;
  total: number;
  lastMilestone: number;       // last compliant count at which NFT was minted
  associated: boolean;          // whether NFT token is already associated
  shieldAssociated: boolean;   // whether $SHIELD token is already associated
}

export class ReputationManager {
  private records: Map<string, AgentRecord> = new Map();
  private client: Client;
  private coordinatorKey: PrivateKey;

  constructor(client: Client) {
    this.client = client;
    this.coordinatorKey = PrivateKey.fromStringECDSA(CONFIG.coordinator.privateKey);
  }

  async recordCompliance(agentId: string, signalLevel: string, complied: boolean): Promise<void> {
    // Update local tracking
    let record = this.records.get(agentId);
    if (!record) {
      record = { compliant: 0, total: 0, lastMilestone: 0, associated: false, shieldAssociated: false };
      this.records.set(agentId, record);
    }

    record.total++;
    if (complied) {
      record.compliant++;
    }

    const trustScore = record.compliant / record.total;

    // Publish ReputationEvent to HCS
    const event: ReputationEvent = {
      p: 'agentshield',
      op: 'reputation',
      agent_id: agentId,
      event: complied ? 'compliance' : 'violation',
      signal_level: signalLevel,
      complied,
      trust_score: trustScore,
      timestamp: Date.now(),
    };

    try {
      await new TopicMessageSubmitTransaction()
        .setTopicId(CONFIG.topics.reputation)
        .setMessage(JSON.stringify(event))
        .execute(this.client);

      console.log(`[Reputation] ${complied ? 'Compliance' : 'Violation'} recorded for ${agentId} | trust=${trustScore.toFixed(2)}`);
    } catch (err) {
      console.error(`[Reputation] Failed to publish event for ${agentId}:`, err);
    }

    // Check milestone: every 10 compliant actions, mint NFT and distribute $SHIELD reward
    if (complied && record.compliant > 0 && record.compliant % 10 === 0 && record.compliant !== record.lastMilestone) {
      record.lastMilestone = record.compliant;
      await this.mintReputationNft(agentId, record.compliant);
      await this.distributeReward(agentId, 1000);
    }
  }

  getTrustScore(agentId: string): number {
    const record = this.records.get(agentId);
    if (!record || record.total === 0) return 1.0; // default trust for new agents
    return record.compliant / record.total;
  }

  private async mintReputationNft(agentId: string, milestoneCount: number): Promise<void> {
    const tokenId = TokenId.fromString(CONFIG.tokens.reputationNft);

    // Associate NFT with agent account (may already be associated)
    const record = this.records.get(agentId)!;
    if (!record.associated) {
      try {
        const agentAccountId = AccountId.fromString(agentId);
        // Agent must sign the associate transaction, but for hackathon we use
        // coordinator key as treasury/supply key. If this fails, that's fine.
        await new TokenAssociateTransaction()
          .setAccountId(agentAccountId)
          .setTokenIds([tokenId])
          .freezeWith(this.client)
          .sign(this.coordinatorKey);

        console.log(`[Reputation] Token association attempted for ${agentId}`);
        record.associated = true;
      } catch (err) {
        // Already associated or agent must sign — continue anyway
        console.log(`[Reputation] Token association skipped for ${agentId} (may already be associated)`);
        record.associated = true;
      }
    }

    // Mint NFT
    try {
      const metadata = Buffer.from(JSON.stringify({
        agent: agentId,
        milestone: milestoneCount,
        trust_score: this.getTrustScore(agentId),
        timestamp: Date.now(),
      }));

      const mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .addMetadata(metadata)
        .freezeWith(this.client)
        .sign(this.coordinatorKey);

      const mintReceipt = await (await mintTx.execute(this.client)).getReceipt(this.client);
      const serial = mintReceipt.serials[0];

      console.log(`[Reputation] NFT minted for ${agentId} | serial=${serial} | milestone=${milestoneCount}`);

      // Transfer NFT to agent
      try {
        const transferTx = await new TransferTransaction()
          .addNftTransfer(tokenId, serial, AccountId.fromString(CONFIG.coordinator.accountId), AccountId.fromString(agentId))
          .freezeWith(this.client)
          .sign(this.coordinatorKey);

        await (await transferTx.execute(this.client)).getReceipt(this.client);
        console.log(`[Reputation] NFT serial ${serial} transferred to ${agentId}`);
      } catch (err) {
        console.error(`[Reputation] Failed to transfer NFT to ${agentId}:`, err);
      }
    } catch (err) {
      console.error(`[Reputation] Failed to mint NFT for ${agentId}:`, err);
    }
  }

  async distributeReward(agentAccountId: string, amount: number): Promise<void> {
    const shieldTokenId = TokenId.fromString(CONFIG.tokens.shield);
    const agentAccount = AccountId.fromString(agentAccountId);
    const coordinatorAccount = AccountId.fromString(CONFIG.coordinator.accountId);
    // $SHIELD has 8 decimals, so 1000 tokens = 1000 * 10^8 smallest units
    const adjustedAmount = amount * Math.pow(10, 8);

    // Associate $SHIELD token with agent (may already be associated)
    const record = this.records.get(agentAccountId);
    if (record && !record.shieldAssociated) {
      try {
        const associateTx = await new TokenAssociateTransaction()
          .setAccountId(agentAccount)
          .setTokenIds([shieldTokenId])
          .freezeWith(this.client)
          .sign(this.coordinatorKey);

        await (await associateTx.execute(this.client)).getReceipt(this.client);
        console.log(`[Reputation] $SHIELD token associated for ${agentAccountId}`);
        record.shieldAssociated = true;
      } catch (err) {
        // Already associated or agent must sign — continue anyway
        console.log(`[Reputation] $SHIELD association skipped for ${agentAccountId} (may already be associated)`);
        if (record) record.shieldAssociated = true;
      }
    }

    // Transfer $SHIELD tokens from coordinator to agent
    try {
      const transferTx = await new TransferTransaction()
        .addTokenTransfer(shieldTokenId, coordinatorAccount, -adjustedAmount)
        .addTokenTransfer(shieldTokenId, agentAccount, adjustedAmount)
        .freezeWith(this.client)
        .sign(this.coordinatorKey);

      await (await transferTx.execute(this.client)).getReceipt(this.client);
      console.log(`[Reputation] Distributed ${amount} $SHIELD tokens to ${agentAccountId}`);
    } catch (err) {
      console.error(`[Reputation] Failed to distribute $SHIELD to ${agentAccountId}:`, err);
    }
  }
}
