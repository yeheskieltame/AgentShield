import {
  TransferTransaction,
  TopicMessageSubmitTransaction,
  Hbar,
  AccountId,
} from '@hashgraph/sdk';
import { createClient } from './hedera-client.js';
import { CONFIG } from './config.js';
import { ReputationEvent } from './types.js';

const STAKE_AMOUNT_HBAR = 1; // 1 HBAR stake per agent

export class StakingManager {
  /**
   * Stake HBAR from an agent account to the treasury.
   * Uses the agent's own client to authorize the transfer.
   */
  async stake(agentAccountId: string, agentPrivateKey: string): Promise<boolean> {
    try {
      const client = createClient(agentAccountId, agentPrivateKey);
      const treasuryId = AccountId.fromString(CONFIG.treasury.accountId);

      const tx = await new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(agentAccountId), new Hbar(-STAKE_AMOUNT_HBAR))
        .addHbarTransfer(treasuryId, new Hbar(STAKE_AMOUNT_HBAR))
        .execute(client);

      await tx.getReceipt(client);

      await this.logStakeEvent(agentAccountId, 'stake', STAKE_AMOUNT_HBAR);
      return true;
    } catch (err) {
      console.error(`[Staking] Failed to stake for ${agentAccountId}:`, err);
      return false;
    }
  }

  /**
   * Unstake HBAR by transferring from treasury back to the agent.
   * Requires the treasury's client/key to authorize.
   */
  async unstake(agentAccountId: string): Promise<boolean> {
    try {
      const client = createClient(CONFIG.treasury.accountId, CONFIG.treasury.privateKey);
      const agentId = AccountId.fromString(agentAccountId);
      const treasuryId = AccountId.fromString(CONFIG.treasury.accountId);

      const tx = await new TransferTransaction()
        .addHbarTransfer(treasuryId, new Hbar(-STAKE_AMOUNT_HBAR))
        .addHbarTransfer(agentId, new Hbar(STAKE_AMOUNT_HBAR))
        .execute(client);

      await tx.getReceipt(client);

      console.log(`[Staking] Unstaked ${STAKE_AMOUNT_HBAR} HBAR back to ${agentAccountId}`);
      return true;
    } catch (err) {
      console.error(`[Staking] Failed to unstake for ${agentAccountId}:`, err);
      return false;
    }
  }

  /**
   * Slash a staked agent on violation. The treasury keeps the HBAR;
   * this method only logs the slash event to the Reputation Topic.
   */
  async slash(agentAccountId: string, reason: string): Promise<void> {
    try {
      await this.logStakeEvent(agentAccountId, 'slash', STAKE_AMOUNT_HBAR);
      console.log(`[Staking] Slashed stake from ${agentAccountId}: ${reason}`);
    } catch (err) {
      console.error(`[Staking] Failed to log slash for ${agentAccountId}:`, err);
    }
  }

  /**
   * Publish a stake or slash event to the Reputation Topic.
   */
  private async logStakeEvent(
    agentId: string,
    event: 'stake' | 'slash',
    amount: number,
  ): Promise<void> {
    const client = createClient(CONFIG.coordinator.accountId, CONFIG.coordinator.privateKey);

    const reputationEvent: ReputationEvent = {
      p: 'agentshield',
      op: 'reputation',
      agent_id: agentId,
      event,
      signal_level: '',
      complied: event === 'stake',
      trust_score: event === 'stake' ? 1.0 : 0.0,
      timestamp: Date.now(),
    };

    await new TopicMessageSubmitTransaction()
      .setTopicId(CONFIG.topics.reputation)
      .setMessage(JSON.stringify(reputationEvent))
      .execute(client);

    console.log(`[Staking] Logged ${event} event for ${agentId} (${amount} HBAR)`);
  }
}
