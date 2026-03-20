'use client';

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import type { Signal, Intent } from '../lib/types';
import { AGENTS } from '../lib/config';

const tooltipStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.95)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(100, 180, 255, 0.15)',
  borderRadius: 10,
  fontSize: 12,
  color: '#e2e8f0',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  padding: '10px 14px',
};

// --- Risk Score Chart ---
export function RiskScoreChart({ signals }: { signals: Signal[] }) {
  const data = signals.map((s) => ({
    time: new Date(s.timestamp).toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' }),
    score: s.risk_score,
  }));

  return (
    <div className="glass p-5">
      <h3 className="section-title mb-4">Risk Score Chart (Time Series)</h3>
      {data.length === 0 ? (
        <div className="text-center py-12 text-white/70 text-sm">Collecting signal data...</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5} />
                <stop offset="35%" stopColor="#eab308" stopOpacity={0.3} />
                <stop offset="70%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,180,255,0.06)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#cbd5e1' }} axisLine={{ stroke: 'rgba(100,180,255,0.1)' }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: '#cbd5e1' }} axisLine={{ stroke: 'rgba(100,180,255,0.1)' }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e2e8f0' }} />
            <Area type="monotone" dataKey="score" stroke="url(#strokeGrad)" fill="url(#riskGrad)" strokeWidth={2.5}
              dot={{ fill: '#06b6d4', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#06b6d4', stroke: '#fff', strokeWidth: 1 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// --- Volume Chart ---
export function VolumeChart({ intents }: { intents: Intent[] }) {
  const buckets: Record<string, { time: string; liquidate: number; swap: number; large_transfer: number }> = {};

  intents.forEach((intent) => {
    const t = new Date(intent.timestamp);
    const key = `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`;
    if (!buckets[key]) buckets[key] = { time: key, liquidate: 0, swap: 0, large_transfer: 0 };
    const action = intent.action as 'liquidate' | 'swap' | 'large_transfer';
    if (buckets[key][action] !== undefined) {
      buckets[key][action] += intent.size_usd;
    }
  });

  const data = Object.values(buckets).slice(-10);

  return (
    <div className="glass p-5">
      <h3 className="section-title mb-2">Volume Chart</h3>
      <div className="flex gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-[10px] text-white"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#06b6d4' }} /> liquidate</span>
        <span className="flex items-center gap-1.5 text-[10px] text-white"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#818cf8' }} /> swap</span>
        <span className="flex items-center gap-1.5 text-[10px] text-white"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#a855f7' }} /> large_transfer</span>
      </div>
      {data.length === 0 ? (
        <div className="text-center py-10 text-white/70 text-sm">Collecting intent data...</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,180,255,0.06)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#cbd5e1' }} axisLine={{ stroke: 'rgba(100,180,255,0.1)' }} />
            <YAxis tick={{ fontSize: 10, fill: '#cbd5e1' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} axisLine={{ stroke: 'rgba(100,180,255,0.1)' }} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 4 }}
              itemStyle={{ color: '#f1f5f9', padding: '2px 0' }}
              formatter={(val: number, name: string) => [`$${(val / 1000).toFixed(0)}K`, name]}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar dataKey="liquidate" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} fillOpacity={0.9} />
            <Bar dataKey="swap" stackId="a" fill="#818cf8" fillOpacity={0.9} />
            <Bar dataKey="large_transfer" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} fillOpacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// --- Signal Distribution Pie ---
export function SignalDistribution({ signals }: { signals: Signal[] }) {
  const green = signals.filter((s) => s.level === 'GREEN').length;
  const yellow = signals.filter((s) => s.level === 'YELLOW').length;
  const red = signals.filter((s) => s.level === 'RED').length;
  const total = green + yellow + red || 1;

  const data = [
    { name: 'GREEN', value: green, pct: Math.round((green / total) * 100) },
    { name: 'YELLOW', value: yellow, pct: Math.round((yellow / total) * 100) },
    { name: 'RED', value: red, pct: Math.round((red / total) * 100) },
  ];
  const colors = ['#22c55e', '#eab308', '#ef4444'];
  const glowColors = ['rgba(34,197,94,0.3)', 'rgba(234,179,8,0.3)', 'rgba(239,68,68,0.3)'];

  return (
    <div className="glass p-5">
      <h3 className="section-title mb-4">Signal Distribution</h3>
      {total <= 1 && green + yellow + red === 0 ? (
        <div className="text-center py-10 text-white/70 text-sm">No signals yet...</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" strokeWidth={0}>
              {data.map((entry, i) => (
                <Cell key={i} fill={colors[i]} fillOpacity={0.9} style={{ filter: `drop-shadow(0 0 8px ${glowColors[i]})` }} />
              ))}
            </Pie>
            <Legend
              iconType="circle"
              iconSize={8}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: string, entry: any) => (
                <span style={{ color: '#f1f5f9', fontSize: 11, fontWeight: 500 }}>{value} {entry?.payload?.pct ?? 0}%</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// --- Activity Heatmap ---
export function ActivityHeatmap({ intents }: { intents: Intent[] }) {
  const agentNames = AGENTS.filter((a) => a.role !== 'coordinator').map((a) => ({
    id: a.operatorAccount,
    label: a.name.replace('AgentShield ', ''),
  }));

  const timeBuckets: string[] = [];
  const now = Date.now();
  for (let i = 9; i >= 0; i--) {
    const t = new Date(now - i * 60000);
    timeBuckets.push(t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
  }

  const heatData: Record<string, Record<string, number>> = {};
  agentNames.forEach((a) => {
    heatData[a.id] = {};
    timeBuckets.forEach((t) => (heatData[a.id][t] = 0));
  });

  intents.forEach((intent) => {
    const t = new Date(intent.timestamp);
    const key = t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    if (heatData[intent.agent_id] && heatData[intent.agent_id][key] !== undefined) {
      heatData[intent.agent_id][key]++;
    }
  });

  function cellColor(count: number): string {
    if (count === 0) return 'rgba(255, 255, 255, 0.04)';
    if (count === 1) return 'rgba(6, 182, 212, 0.2)';
    if (count === 2) return 'rgba(6, 182, 212, 0.4)';
    if (count <= 4) return 'rgba(59, 130, 246, 0.5)';
    return 'rgba(168, 85, 247, 0.6)';
  }

  return (
    <div className="glass p-5">
      <h3 className="section-title mb-4">Agent Activity Heatmap</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              <th className="text-left text-white/70 py-1.5 pr-3 font-medium" />
              {timeBuckets.map((t) => (
                <th key={t} className="text-center text-white/70 py-1.5 px-0.5 font-normal">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agentNames.map((agent) => (
              <tr key={agent.id}>
                <td className="text-white py-1.5 pr-3 whitespace-nowrap font-medium">{agent.label}</td>
                {timeBuckets.map((t) => {
                  const count = heatData[agent.id][t] || 0;
                  return (
                    <td key={t} className="py-1 px-0.5">
                      <div
                        className="w-full h-6 rounded transition-colors"
                        style={{
                          background: cellColor(count),
                          border: '1px solid rgba(255,255,255,0.08)',
                          boxShadow: count > 0 ? `inset 0 0 8px ${cellColor(count)}` : 'none',
                        }}
                        title={`${agent.label}: ${count} intents`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
