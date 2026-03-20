'use client';

import { useAgentData } from '../lib/useAgentData';
import RiskBanner from '../components/RiskBanner';
import MetricCards from '../components/MetricCards';
import IntentFeed from '../components/IntentFeed';
import SignalTimeline from '../components/SignalTimeline';

export default function HomePage() {
  const { intents, signals, latestSignal, metricsHistory } = useAgentData();

  return (
    <div className="space-y-4">
      {/* Top row: Risk Signal + Risk Metrics side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RiskBanner signal={latestSignal} />
        <MetricCards metrics={latestSignal?.metrics ?? null} metricsHistory={metricsHistory} />
      </div>

      <IntentFeed intents={intents} />
      <SignalTimeline signals={signals} />
    </div>
  );
}
