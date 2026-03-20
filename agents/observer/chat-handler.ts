import { Signal } from '../../lib/types.js';

/**
 * Generates a natural-language risk status response for the AgentShield Observer.
 * Called whenever a human (or another agent) sends a chat message via HCS-10.
 */
export function getObserverResponse(
  userMessage: string,
  latestSignal: Signal | null,
): string {
  if (!latestSignal) {
    return 'AgentShield is active. No risk signals detected yet. All systems nominal.';
  }

  const s = latestSignal;
  const ago = Math.round((Date.now() - s.timestamp) / 1000);

  const advice =
    s.level === 'RED'
      ? 'STRONGLY RECOMMEND delaying large transactions.'
      : s.level === 'YELLOW'
        ? 'Consider reducing position sizes.'
        : 'Safe to proceed normally.';

  return (
    `Current status: ${s.level}. ` +
    `Risk score: ${s.risk_score.toFixed(2)}/1.00. ` +
    `${s.reasoning} ` +
    `Affected assets: ${s.affected_assets.join(', ')}. ` +
    `Signal was ${ago}s ago. ` +
    advice
  );
}
