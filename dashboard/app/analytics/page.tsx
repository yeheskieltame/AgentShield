'use client';

import { useState } from 'react';
import { useAgentData } from '../../lib/useAgentData';
import { RiskScoreChart, VolumeChart, SignalDistribution, ActivityHeatmap } from '../../components/Charts';

const tabs = ['CHARTS', 'AGENTS', 'ANALYTICS'] as const;

export default function AnalyticsPage() {
  const { intents, signals } = useAgentData();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('CHARTS');

  return (
    <div className="space-y-4">
      <div className="flex gap-4 border-b border-white/10 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-cyan-400 border-cyan-400'
                : 'text-white/70 border-transparent hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <RiskScoreChart signals={signals} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VolumeChart intents={intents} />
        <SignalDistribution signals={signals} />
      </div>

      <ActivityHeatmap intents={intents} />
    </div>
  );
}
