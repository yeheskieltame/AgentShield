import { ChatGroq } from '@langchain/groq';
import { CONFIG } from '../../lib/config.js';
import { RiskMetrics } from '../../lib/types.js';

const llm = new ChatGroq({
  apiKey: CONFIG.groq.apiKey,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.3,
  maxTokens: 200,
});

export async function generateReasoning(metrics: RiskMetrics): Promise<string> {
  const level = metrics.riskScore > 0.7 ? 'RED' : metrics.riskScore > 0.4 ? 'YELLOW' : 'GREEN';

  const response = await llm.invoke([
    {
      role: 'system',
      content: 'You are AgentShield Coordinator, a DeFi circuit breaker AI. Analyze metrics and explain the risk level in exactly 2 sentences. Be specific about numbers.',
    },
    {
      role: 'user',
      content: `Window: 60 seconds. Intents: ${metrics.totalIntents}. Volume: $${metrics.totalVolumeUsd.toLocaleString()}. Sell pressure: ${(metrics.sellPressure * 100).toFixed(0)}%. Top asset: ${metrics.topAsset} (${(metrics.assetConcentration * 100).toFixed(0)}% concentrated). Velocity: ${metrics.velocityPerSecond.toFixed(1)}/sec. Score: ${metrics.riskScore.toFixed(2)}. Level: ${level}.`,
    },
  ]);

  return response.content as string;
}
