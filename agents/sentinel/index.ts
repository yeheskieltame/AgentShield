import { TopicMessageSubmitTransaction } from '@hashgraph/sdk';
import { createClient } from '../../lib/hedera-client.js';
import { subscribeToTopic } from '../../lib/hcs-subscriber.js';
import { CONFIG } from '../../lib/config.js';
import { Intent, Signal } from '../../lib/types.js';

const role = process.argv.find(a => a.startsWith('--role='))?.split('=')[1] || 'keeper';

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
  private currentSignal: Signal | null = null;

  constructor(role: string) {
    const agentConfig = getAgentConfig(role);
    this.client = createClient(agentConfig.accountId, agentConfig.privateKey);
    this.accountId = agentConfig.accountId;
  }

  async start() {
    console.log(`[Sentinel:${role}] Starting, account: ${this.accountId}`);

    // Listen for signals
    await subscribeToTopic(CONFIG.topics.signal, (signal: Signal) => {
      if (signal.p === 'agentshield' && signal.op === 'signal') {
        this.currentSignal = signal;
        console.log(`[Sentinel:${role}] Received signal: ${signal.level} (score: ${signal.risk_score})`);
      }
    });

    // Main loop: generate intents periodically
    this.runScenario();
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

const agent = new SentinelAgent(role);
agent.start().catch(console.error);
