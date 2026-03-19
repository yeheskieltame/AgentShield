export interface Intent {
  p: 'agentshield';
  op: 'intent';
  agent_id: string;
  action: 'liquidate' | 'swap' | 'withdraw' | 'large_transfer';
  asset: string;
  size_usd: number;
  direction: 'sell' | 'buy';
  urgency: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface Signal {
  p: 'agentshield';
  op: 'signal';
  level: 'GREEN' | 'YELLOW' | 'RED';
  risk_score: number;
  reasoning: string;
  affected_assets: string[];
  recommended_delay_ms: number;
  metrics: RiskMetrics;
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

export interface ReputationEvent {
  p: 'agentshield';
  op: 'reputation';
  agent_id: string;
  event: 'compliance' | 'violation' | 'stake' | 'slash';
  signal_level: string;
  complied: boolean;
  trust_score: number;
  timestamp: number;
}
