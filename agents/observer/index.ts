import { HCS10Client } from '@hashgraphonline/standards-sdk';
import { subscribeToTopic } from '../../lib/hcs-subscriber.js';
import { CONFIG } from '../../lib/config.js';
import { Signal } from '../../lib/types.js';

let latestSignal: Signal | null = null;

export function getObserverResponse(userMessage: string): string {
  if (!latestSignal) {
    return 'AgentShield is active. No risk signals detected. All systems nominal.';
  }

  const s = latestSignal;
  const ago = Math.round((Date.now() - s.timestamp) / 1000);

  return `Current status: ${s.level}. Risk score: ${s.risk_score.toFixed(2)}/1.00. ${s.reasoning} Affected assets: ${s.affected_assets.join(', ')}. Signal was ${ago} seconds ago. ${s.level === 'RED' ? 'STRONGLY RECOMMEND delaying large transactions.' : s.level === 'YELLOW' ? 'Consider reducing position sizes.' : 'Safe to proceed normally.'}`;
}

async function main() {
  // Track latest signal
  await subscribeToTopic(CONFIG.topics.signal, (signal: Signal) => {
    if (signal.p === 'agentshield' && signal.op === 'signal') {
      latestSignal = signal;
    }
  });

  // Setup HCS-10 client for incoming chat
  const hcs10 = new HCS10Client({
    network: 'testnet',
    operatorId: CONFIG.observer.accountId,
    operatorPrivateKey: CONFIG.observer.privateKey,
    guardedRegistryBaseUrl: CONFIG.hol.registryUrl,
  });

  console.log('[Observer] Listening for HCS-10 messages...');
  console.log('[Observer] Latest signal will be served to any connected agent or human.');

  setInterval(() => {
    if (latestSignal) {
      console.log(`[Observer] Current: ${latestSignal.level} | Score: ${latestSignal.risk_score.toFixed(2)} | ${latestSignal.reasoning}`);
    } else {
      console.log('[Observer] No signals received yet. System nominal.');
    }
  }, 10000);
}

main().catch(console.error);
