'use client';

import type { Intent } from '../lib/types';
import { AGENTS } from '../lib/config';

interface Props {
  intents: Intent[];
}

function agentName(id: string): string {
  const agent = AGENTS.find((a) => a.operatorAccount === id);
  if (agent) return agent.name.replace('AgentShield ', '');
  return id.slice(-8);
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatSize(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1000) return `$${(usd / 1000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

export default function IntentFeed({ intents }: Props) {
  const recent = intents.slice(-8).reverse();

  return (
    <div className="glass p-5">
      <h2 className="section-title mb-3">Intent Feed (Live Stream)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-white/90 border-b border-white/5">
              <th className="text-left py-1.5 font-medium">Timestamp</th>
              <th className="text-left py-1.5 font-medium">Agent</th>
              <th className="hidden md:table-cell text-left py-1.5 font-medium">Action</th>
              <th className="text-left py-1.5 font-medium">Asset</th>
              <th className="text-right py-1.5 font-medium">Size</th>
              <th className="text-center py-1.5 font-medium">Direction</th>
              <th className="hidden md:table-cell text-center py-1.5 font-medium">Urgency</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-white/70">
                  Waiting for intents...
                </td>
              </tr>
            )}
            {recent.map((intent, i) => (
              <tr key={`${intent.timestamp}-${i}`} className={`animate-fadeIn hover:bg-cyan-500/8 transition-colors ${i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'}`}>
                <td className="py-1.5 text-white/90">{formatTime(intent.timestamp)}</td>
                <td className="py-1.5 text-white">{agentName(intent.agent_id)}</td>
                <td className="hidden md:table-cell py-1.5 text-white">{intent.action}</td>
                <td className="py-1.5 text-cyan-400">{intent.asset}</td>
                <td className="py-1.5 text-right text-white">{formatSize(intent.size_usd)}</td>
                <td className="py-1.5 text-center">
                  <span className={`badge ${intent.direction === 'sell' ? 'badge-sell' : 'badge-buy'}`}>
                    {intent.direction}
                  </span>
                </td>
                <td className="hidden md:table-cell py-1.5 text-center">
                  <span className={`badge badge-${intent.urgency}`}>
                    {intent.urgency}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
