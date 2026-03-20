import { MIRROR_NODE_URL } from './config';
import type { HCSMessage, Intent, Signal } from './types';

export async function fetchTopicMessages(
  topicId: string,
  afterTimestamp: string = '0.0',
  limit: number = 25
): Promise<HCSMessage[]> {
  const url = `${MIRROR_NODE_URL}/topics/${topicId}/messages?timestamp=gt:${afterTimestamp}&limit=${limit}&order=asc`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  } catch {
    return [];
  }
}

export function decodeMessage(base64: string): unknown {
  try {
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function parseIntent(msg: HCSMessage): Intent | null {
  const data = decodeMessage(msg.message) as Record<string, unknown>;
  if (!data || data.op !== 'intent') return null;
  return { ...data, timestamp: Number(data.timestamp) || parseFloat(msg.consensus_timestamp) * 1000 } as Intent;
}

export function parseSignal(msg: HCSMessage): Signal | null {
  const data = decodeMessage(msg.message) as Record<string, unknown>;
  if (!data || data.op !== 'signal') return null;

  // Normalize timestamp (same as parseIntent)
  const timestamp = Number(data.timestamp) || parseFloat(msg.consensus_timestamp) * 1000;

  // Ensure metrics object exists with safe defaults
  const rawMetrics = (data.metrics as Record<string, unknown>) || {};
  const metrics = {
    totalIntents: Number(rawMetrics.totalIntents) || 0,
    totalVolumeUsd: Number(rawMetrics.totalVolumeUsd) || 0,
    sellPressure: Number(rawMetrics.sellPressure) || 0,
    assetConcentration: Number(rawMetrics.assetConcentration) || 0,
    topAsset: String(rawMetrics.topAsset || 'unknown'),
    velocityPerSecond: Number(rawMetrics.velocityPerSecond) || 0,
    riskScore: Number(rawMetrics.riskScore) || Number(data.risk_score) || 0,
  };

  return {
    ...data,
    timestamp,
    metrics,
    risk_score: Number(data.risk_score) || 0,
    level: String(data.level || 'GREEN') as Signal['level'],
    reasoning: String(data.reasoning || ''),
    affected_assets: Array.isArray(data.affected_assets) ? data.affected_assets as string[] : [],
    recommended_delay_ms: Number(data.recommended_delay_ms) || 0,
  } as Signal;
}

export async function fetchTokenInfo(tokenId: string) {
  try {
    const res = await fetch(`${MIRROR_NODE_URL}/tokens/${tokenId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAccountInfo(accountId: string) {
  try {
    const res = await fetch(`${MIRROR_NODE_URL}/accounts/${accountId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
