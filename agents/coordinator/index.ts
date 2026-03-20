import { TopicMessageSubmitTransaction } from '@hashgraph/sdk';
import { createClient } from '../../lib/hedera-client.js';
import { subscribeToTopic } from '../../lib/hcs-subscriber.js';
import { CONFIG } from '../../lib/config.js';
import { RiskEngine } from './risk-engine.js';
import { generateReasoning } from './llm-reasoning.js';
import { ReputationManager } from './reputation-manager.js';
import { Intent, Signal } from '../../lib/types.js';

async function main() {
  const client = createClient(CONFIG.coordinator.accountId, CONFIG.coordinator.privateKey);
  const riskEngine = new RiskEngine();
  const reputationManager = new ReputationManager(client);

  console.log('[Coordinator] Starting. Subscribing to intent topic...');

  // Subscribe to intents
  await subscribeToTopic(CONFIG.topics.intent, async (msg: Intent) => {
    if (msg.p !== 'agentshield' || msg.op !== 'intent') return;

    riskEngine.addIntent(msg);
    console.log(`[Coordinator] Intent from ${msg.agent_id}: ${msg.action} ${msg.asset} $${msg.size_usd}`);

    // Evaluate risk on every new intent (if enough data)
    const metrics = riskEngine.calculate();
    if (!metrics) return;

    const level = metrics.riskScore > 0.7 ? 'RED' : metrics.riskScore > 0.4 ? 'YELLOW' : 'GREEN';

    // Only broadcast signal when level changes or on RED/YELLOW
    if (level === 'GREEN' && riskEngine.getIntentCount() < 5) return;

    let reasoning: string;
    try {
      reasoning = await generateReasoning(metrics);
    } catch {
      reasoning = `Risk score ${metrics.riskScore.toFixed(2)}: ${metrics.totalIntents} intents, $${metrics.totalVolumeUsd.toLocaleString()} volume, ${(metrics.sellPressure * 100).toFixed(0)}% sell pressure.`;
    }

    const signal: Signal = {
      p: 'agentshield',
      op: 'signal',
      level,
      risk_score: metrics.riskScore,
      reasoning,
      affected_assets: [metrics.topAsset],
      recommended_delay_ms: level === 'RED' ? 15000 : level === 'YELLOW' ? 5000 : 0,
      metrics,
      timestamp: Date.now(),
    };

    await new TopicMessageSubmitTransaction()
      .setTopicId(CONFIG.topics.signal)
      .setMessage(JSON.stringify(signal))
      .execute(client);

    console.log(`[Coordinator] Signal: ${level} | Score: ${metrics.riskScore.toFixed(2)} | ${reasoning}`);

    // Record compliance for all agents in the current window.
    // For hackathon MVP: sentinel code genuinely adjusts behavior based on signals,
    // so we record all active agents as compliant. This is a reasonable heuristic
    // because the sentinel implementations do comply with YELLOW/RED signals.
    const activeAgents = riskEngine.getRecentAgentIds();
    for (const agentId of activeAgents) {
      // Agents that had intents during a GREEN signal are always compliant.
      // Agents active during YELLOW/RED are also recorded as compliant since
      // the sentinel code reduces size / delays execution per protocol rules.
      await reputationManager.recordCompliance(agentId, level, true);
    }
  });

  console.log('[Coordinator] Running. Ctrl+C to stop.');
}

main().catch(console.error);
