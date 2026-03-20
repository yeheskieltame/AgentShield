'use client';

import type { RiskMetrics } from '../lib/types';

interface Props {
  metrics: RiskMetrics | null;
  metricsHistory: RiskMetrics[];
}

/** Area sparkline chart like in the mockup — fills bottom half of card */
function AreaSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    // Show placeholder wave when no data
    return (
      <svg width="100%" height="50" viewBox="0 0 120 50" preserveAspectRatio="none" className="opacity-30">
        <path d="M0 40 Q20 30 40 35 Q60 25 80 30 Q100 20 120 25 L120 50 L0 50 Z" fill={color} fillOpacity="0.15" />
        <path d="M0 40 Q20 30 40 35 Q60 25 80 30 Q100 20 120 25" fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }

  const h = 50;
  const w = 120;
  const max = Math.max(...data, 0.01);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg width="100%" height="50" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}60)` }} />
    </svg>
  );
}

export default function MetricCards({ metrics, metricsHistory }: Props) {
  const volHistory = metricsHistory.map((m) => m.totalVolumeUsd);
  const concHistory = metricsHistory.map((m) => m.assetConcentration);
  const sellHistory = metricsHistory.map((m) => m.sellPressure);
  const velHistory = metricsHistory.map((m) => m.velocityPerSecond);

  const cards = [
    {
      label: 'Volume',
      weight: '30%',
      value: metrics ? `$${(metrics.totalVolumeUsd / 1000).toFixed(0)}K` : '--',
      color: '#22c55e',
      sparkData: volHistory,
    },
    {
      label: 'Asset Concentration',
      weight: '25%',
      value: metrics ? `${(metrics.assetConcentration * 100).toFixed(0)}%` : '--',
      color: '#22c55e',
      sparkData: concHistory,
    },
    {
      label: 'Sell Pressure',
      weight: '25%',
      value: metrics ? `${(metrics.sellPressure * 100).toFixed(0)}%` : '--',
      color: '#eab308',
      sparkData: sellHistory,
    },
    {
      label: 'Velocity',
      weight: '25%',
      value: metrics ? `${metrics.velocityPerSecond.toFixed(1)}/s` : '--',
      color: '#22c55e',
      sparkData: velHistory,
    },
  ];

  return (
    <div className="glass p-5">
      <h2 className="section-title mb-3">Risk Metrics</h2>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="glass-inner overflow-hidden">
            {/* Text content */}
            <div className="p-3.5 pb-0">
              <div className="text-[11px] text-white/90 font-medium">{c.label}</div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xs font-bold" style={{ color: c.color }}>{c.weight}</span>
                <span className="text-[11px] text-white/90">|</span>
                <span className="text-sm font-bold text-white">{c.value}</span>
              </div>
            </div>
            {/* Area chart at bottom */}
            <div className="mt-1">
              <AreaSparkline data={c.sparkData} color={c.color} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
