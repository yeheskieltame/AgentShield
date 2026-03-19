import { RiskMetrics, Intent } from '../../lib/types.js';

const WINDOW_SIZE_MS = 60000; // 60 seconds

export class RiskEngine {
  private intents: Intent[] = [];

  addIntent(intent: Intent) {
    this.intents.push(intent);
    this.prune();
  }

  getIntentCount(): number {
    return this.intents.length;
  }

  private prune() {
    const cutoff = Date.now() - WINDOW_SIZE_MS;
    this.intents = this.intents.filter(i => i.timestamp > cutoff);
  }

  calculate(): RiskMetrics | null {
    this.prune();
    if (this.intents.length < 2) return null;

    const totalVolumeUsd = this.intents.reduce((sum, i) => sum + i.size_usd, 0);
    const sellCount = this.intents.filter(i => i.direction === 'sell').length;
    const sellPressure = sellCount / this.intents.length;

    // Asset concentration: what fraction of intents target the most common asset
    const assetCounts: Record<string, number> = {};
    for (const i of this.intents) {
      assetCounts[i.asset] = (assetCounts[i.asset] || 0) + 1;
    }
    const topAssetEntry = Object.entries(assetCounts).sort((a, b) => b[1] - a[1])[0];
    const topAsset = topAssetEntry[0];
    const assetConcentration = topAssetEntry[1] / this.intents.length;

    const elapsedSeconds = WINDOW_SIZE_MS / 1000;
    const velocityPerSecond = this.intents.length / elapsedSeconds;

    // Weighted risk score (0-1)
    const volumeScore = Math.min(totalVolumeUsd / 1_000_000, 1);
    const riskScore =
      0.30 * volumeScore +
      0.25 * assetConcentration +
      0.25 * sellPressure +
      0.20 * Math.min(velocityPerSecond / 5, 1);

    return {
      totalIntents: this.intents.length,
      totalVolumeUsd,
      sellPressure,
      assetConcentration,
      topAsset,
      velocityPerSecond,
      riskScore,
    };
  }
}
