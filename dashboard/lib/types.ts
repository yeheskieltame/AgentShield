export interface Intent {
  p: string;
  op: 'intent';
  agent_id: string;
  action: string;
  asset: string;
  size_usd: number;
  direction: string;
  urgency: string;
  timestamp: number;
}

export interface RiskMetrics {
  totalIntents: number;
  totalVolumeUsd: number;
  sellPressure: number;
  assetConcentration: number;
  topAsset: string;
  velocityPerSecond: number;
  riskScore: number;
}

export interface Signal {
  p: string;
  op: 'signal';
  level: 'GREEN' | 'YELLOW' | 'RED';
  risk_score: number;
  reasoning: string;
  affected_assets: string[];
  recommended_delay_ms: number;
  metrics: RiskMetrics;
  timestamp: number;
}

export interface HCSMessage {
  consensus_timestamp: string;
  message: string;
  sequence_number: number;
}
