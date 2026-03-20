'use client';

import type { Signal } from '../lib/types';

interface Props {
  signal: Signal | null;
}

const levelConfig = {
  GREEN: {
    color: '#22c55e',
    textClass: 'text-green-400',
    label: 'Proceed Normally.',
    bgStyle: 'rgba(34, 197, 94, 0.12)',
    borderStyle: 'rgba(34, 197, 94, 0.35)',
    shadowStyle: '0 0 30px rgba(34, 197, 94, 0.15), inset 0 0 40px rgba(34, 197, 94, 0.08)',
  },
  YELLOW: {
    color: '#eab308',
    textClass: 'text-yellow-400',
    label: 'Reduce Exposure 50%.',
    bgStyle: 'rgba(234, 179, 8, 0.12)',
    borderStyle: 'rgba(234, 179, 8, 0.35)',
    shadowStyle: '0 0 30px rgba(234, 179, 8, 0.15), inset 0 0 40px rgba(234, 179, 8, 0.08)',
  },
  RED: {
    color: '#ef4444',
    textClass: 'text-red-400',
    label: 'Abort Transactions.',
    bgStyle: 'rgba(239, 68, 68, 0.12)',
    borderStyle: 'rgba(239, 68, 68, 0.4)',
    shadowStyle: '0 0 30px rgba(239, 68, 68, 0.18), inset 0 0 40px rgba(239, 68, 68, 0.1)',
  },
};

function FearGreedGauge({ score, level }: { score: number; level: 'GREEN' | 'YELLOW' | 'RED' }) {
  const config = levelConfig[level];
  const needleAngle = -90 + score * 180;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-52 h-28 overflow-hidden">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="35%" stopColor="#22c55e" />
              <stop offset="45%" stopColor="#eab308" />
              <stop offset="55%" stopColor="#eab308" />
              <stop offset="65%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round" opacity="0.8" />
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const angle = (-180 + t * 180) * (Math.PI / 180);
            const x1 = 100 + 88 * Math.cos(angle);
            const y1 = 100 + 88 * Math.sin(angle);
            const x2 = 100 + 80 * Math.cos(angle);
            const y2 = 100 + 80 * Math.sin(angle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />;
          })}
          <g transform={`rotate(${needleAngle}, 100, 100)`}>
            <line x1="100" y1="100" x2="100" y2="30" stroke={config.color} strokeWidth="2.5" strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${config.color})` }} />
            <circle cx="100" cy="100" r="5" fill={config.color} style={{ filter: `drop-shadow(0 0 6px ${config.color})` }} />
          </g>
          <text x="18" y="108" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="start">0</text>
          <text x="182" y="108" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="end">1.0</text>
        </svg>
      </div>
      <div className="text-center -mt-4">
        <div className="text-4xl font-black" style={{ color: config.color, textShadow: `0 0 20px ${config.color}40` }}>
          {score.toFixed(2)}
        </div>
        <div className="text-[10px] text-white/90 mt-0.5">Risk Score</div>
      </div>
    </div>
  );
}

export default function RiskBanner({ signal }: Props) {
  if (!signal) {
    return (
      <div className="glass p-5">
        <h2 className="section-title mb-3">Risk Signal Banner</h2>
        <div className="glass-inner p-10 text-center">
          <div className="text-white/70 text-sm">Waiting for signal data...</div>
          <div className="mt-2 text-[10px] text-white/60">Polling Hedera Mirror Node every 3s</div>
        </div>
      </div>
    );
  }

  const config = levelConfig[signal.level];
  const age = Math.round((Date.now() - signal.timestamp) / 1000);

  return (
    <div className="glass p-5">
      <h2 className="section-title mb-3">Risk Signal Banner</h2>
      {/* Inner card with FULL signal color fill */}
      <div
        className="p-5 rounded-xl transition-all duration-700"
        style={{
          background: config.bgStyle,
          border: `1px solid ${config.borderStyle}`,
          boxShadow: config.shadowStyle,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className={`text-center text-3xl font-black mb-2 ${config.textClass} animate-pulse-glow tracking-widest`}>
          {signal.level}
        </div>
        <div className="flex justify-center mb-4">
          <FearGreedGauge score={signal.risk_score} level={signal.level} />
        </div>
        <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1.5">LLM Reasoning:</div>
        <p className="text-xs text-white/95 leading-relaxed line-clamp-3 mb-3">{signal.reasoning}</p>
        <p className="text-xs">
          <span className="text-white/90">Recommended Action: </span>
          <span className={`font-bold ${config.textClass}`}>{config.label}</span>
        </p>
        <p className="text-[10px] text-white/70 mt-1">Signal Age: {age} seconds ago</p>
      </div>
    </div>
  );
}
