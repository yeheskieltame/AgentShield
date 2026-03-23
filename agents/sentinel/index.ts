import { TopicMessageSubmitTransaction } from '@hashgraph/sdk';
import { createClient } from '../../lib/hedera-client.js';
import { subscribeToTopic } from '../../lib/hcs-subscriber.js';
import { CONFIG } from '../../lib/config.js';
import { Intent, Signal } from '../../lib/types.js';
import { StakingManager } from '../../lib/staking.js';

const role = process.argv.find(a => a.startsWith('--role='))?.split('=')[1] || 'keeper';

/* HCS-10 outbound topics for inter-sentinel compliance broadcasting */
const HOL_OUTBOUND_TOPICS: Record<string, string> = {
  keeper: '0.0.8299716',
  arb: '0.0.8299729',
  whale: '0.0.8299735',
};

const ROLE_LABELS: Record<string, string> = {
  keeper: 'Keeper',
  arb: 'Arb',
  whale: 'Whale',
};

function getAgentConfig(role: string) {
  const map: Record<string, { accountId: string; privateKey: string }> = {
    keeper: CONFIG.sentinels.keeper,
    arb: CONFIG.sentinels.arb,
    whale: CONFIG.sentinels.whale,
  };
  return map[role];
}

class SentinelAgent {
  private client;
  private accountId: string;
  private privateKey: string;
  private currentSignal: Signal | null = null;
  private stakingManager = new StakingManager();

  constructor(role: string) {
    const agentConfig = getAgentConfig(role);
    this.client = createClient(agentConfig.accountId, agentConfig.privateKey);
    this.accountId = agentConfig.accountId;
    this.privateKey = agentConfig.privateKey;
  }

  async start() {
    console.log(`[Sentinel:${role}] Starting, account: ${this.accountId}`);

    // Stake HBAR to treasury as skin-in-the-game
    const staked = await this.stakingManager.stake(this.accountId, this.privateKey);
    if (staked) {
      console.log(`[Sentinel:${role}] Staked 1 HBAR to treasury`);
    } else {
      console.warn(`[Sentinel:${role}] Failed to stake — continuing without stake`);
    }

    // Listen for signals
    await subscribeToTopic(CONFIG.topics.signal, (signal: Signal) => {
      if (signal.p === 'agentshield' && signal.op === 'signal') {
        this.currentSignal = signal;
        console.log(`[Sentinel:${role}] Received signal: ${signal.level} (score: ${signal.risk_score})`);
      }
    });

    // Subscribe to peer sentinels' HCS-10 outbound topics for compliance updates
    this.subscribeToPeers();

    // Main loop: generate intents periodically
    this.runScenario();
  }

  /**
   * Subscribe to other sentinels' HCS-10 outbound topics to receive
   * their compliance status updates.
   */
  private subscribeToPeers() {
    for (const [peerRole, outboundTopic] of Object.entries(HOL_OUTBOUND_TOPICS)) {
      if (peerRole === role) continue; // skip own topic

      subscribeToTopic(outboundTopic, (msg: any) => {
        try {
          if (msg.p !== 'hcs-10' || msg.op !== 'message') return;
          const data = msg.data;
          if (!data || data.type !== 'compliance_update') return;

          const peerLabel = ROLE_LABELS[data.role] || data.role;
          const action = data.action_taken?.replace(/_/g, ' ') || 'unknown action';
          console.log(
            `[Sentinel:${role}] Peer update: Sentinel ${peerLabel} ${action} (${data.signal_level})`
          );
        } catch {
          // Non-critical: ignore malformed peer messages
        }
      }).catch((err) => {
        console.error(`[Sentinel:${role}] Failed to subscribe to ${peerRole} outbound topic:`, err);
      });
    }
  }

  /**
   * Broadcast a compliance update via HCS-10 to this sentinel's outbound topic
   * so peer sentinels can see how we adjusted.
   */
  private async broadcastComplianceUpdate(
    signalLevel: string,
    actionTaken: string,
    originalSizeUsd: number,
    adjustedSizeUsd: number
  ): Promise<void> {
    try {
      const outboundTopic = HOL_OUTBOUND_TOPICS[role];
      if (!outboundTopic) return;

      const message = {
        p: 'hcs-10' as const,
        op: 'message' as const,
        data: {
          type: 'compliance_update',
          agent_id: this.accountId,
          role,
          signal_level: signalLevel,
          action_taken: actionTaken,
          original_size_usd: originalSizeUsd,
          adjusted_size_usd: adjustedSizeUsd,
          timestamp: Date.now(),
        },
      };

      await new TopicMessageSubmitTransaction()
        .setTopicId(outboundTopic)
        .setMessage(JSON.stringify(message))
        .execute(this.client);

      console.log(`[Sentinel:${role}] Broadcast compliance update: ${actionTaken} (${signalLevel})`);
    } catch (err) {
      console.error(`[Sentinel:${role}] Failed to broadcast compliance update:`, err);
    }
  }

  async broadcastIntent(intent: Omit<Intent, 'p' | 'op' | 'agent_id' | 'timestamp'>) {
    const fullIntent: Intent = {
      p: 'agentshield',
      op: 'intent',
      agent_id: this.accountId,
      timestamp: Date.now(),
      ...intent,
    };

    await new TopicMessageSubmitTransaction()
      .setTopicId(CONFIG.topics.intent)
      .setMessage(JSON.stringify(fullIntent))
      .execute(this.client);

    console.log(`[Sentinel:${role}] Published intent: ${intent.action} ${intent.asset} $${intent.size_usd}`);
  }

  adjustForSignal(sizeUsd: number): { adjustedSize: number; shouldProceed: boolean; delayMs: number } {
    if (!this.currentSignal) return { adjustedSize: sizeUsd, shouldProceed: true, delayMs: 0 };

    switch (this.currentSignal.level) {
      case 'GREEN':
        return { adjustedSize: sizeUsd, shouldProceed: true, delayMs: 0 };
      case 'YELLOW':
        console.log(`[Sentinel:${role}] YELLOW signal — reducing size 50%, adding delay`);
        return { adjustedSize: sizeUsd * 0.5, shouldProceed: true, delayMs: this.currentSignal.recommended_delay_ms };
      case 'RED':
        console.log(`[Sentinel:${role}] RED signal — aborting action`);
        return { adjustedSize: 0, shouldProceed: false, delayMs: this.currentSignal.recommended_delay_ms };
      default:
        return { adjustedSize: sizeUsd, shouldProceed: true, delayMs: 0 };
    }
  }

  async runScenario() {
    const scenarios: Record<string, () => Promise<void>> = {
      keeper: async () => {
        while (true) {
          const baseSize = 10000 + Math.random() * 90000;
          const { adjustedSize, shouldProceed, delayMs } = this.adjustForSignal(baseSize);
          if (shouldProceed) {
            await this.broadcastIntent({
              action: 'liquidate',
              asset: Math.random() > 0.5 ? 'HBAR/USDC' : 'HBAR/USDT',
              size_usd: adjustedSize,
              direction: 'sell',
              urgency: 'high',
            });
          }
          // Broadcast compliance update when signal caused an adjustment
          if (this.currentSignal && this.currentSignal.level !== 'GREEN') {
            const action = shouldProceed ? 'reduced_size_50pct' : 'aborted';
            await this.broadcastComplianceUpdate(this.currentSignal.level, action, baseSize, adjustedSize);
          }
          await sleep(delayMs + 5000 + Math.random() * 10000);
        }
      },
      arb: async () => {
        while (true) {
          const baseSize = 5000 + Math.random() * 50000;
          const { adjustedSize, shouldProceed, delayMs } = this.adjustForSignal(baseSize);
          if (shouldProceed) {
            await this.broadcastIntent({
              action: 'swap',
              asset: 'HBAR/USDC',
              size_usd: adjustedSize,
              direction: Math.random() > 0.3 ? 'sell' : 'buy',
              urgency: 'medium',
            });
          }
          // Broadcast compliance update when signal caused an adjustment
          if (this.currentSignal && this.currentSignal.level !== 'GREEN') {
            const action = shouldProceed ? 'reduced_size_50pct' : 'aborted';
            await this.broadcastComplianceUpdate(this.currentSignal.level, action, baseSize, adjustedSize);
          }
          await sleep(delayMs + 3000 + Math.random() * 8000);
        }
      },
      whale: async () => {
        while (true) {
          const baseSize = 100000 + Math.random() * 500000;
          const { adjustedSize, shouldProceed, delayMs } = this.adjustForSignal(baseSize);
          if (shouldProceed) {
            await this.broadcastIntent({
              action: 'large_transfer',
              asset: 'HBAR/USDC',
              size_usd: adjustedSize,
              direction: 'sell',
              urgency: 'low',
            });
          }
          // Broadcast compliance update when signal caused an adjustment
          if (this.currentSignal && this.currentSignal.level !== 'GREEN') {
            const action = shouldProceed ? 'reduced_size_50pct' : 'aborted';
            await this.broadcastComplianceUpdate(this.currentSignal.level, action, baseSize, adjustedSize);
          }
          await sleep(delayMs + 15000 + Math.random() * 30000);
        }
      },
    };

    await scenarios[role]();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const stakingManager = new StakingManager();
const agentConfig = getAgentConfig(role);

const agent = new SentinelAgent(role);
agent.start().catch(console.error);

// Attempt to unstake on graceful shutdown
const handleShutdown = async () => {
  console.log(`[Sentinel:${role}] Shutting down, attempting to unstake...`);
  try {
    await stakingManager.unstake(agentConfig.accountId);
    console.log(`[Sentinel:${role}] Unstaked successfully`);
  } catch (err) {
    console.error(`[Sentinel:${role}] Failed to unstake on shutdown:`, err);
  }
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
