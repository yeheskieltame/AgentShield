'use client';

import { AGENTS } from '../lib/config';
import type { Intent, Signal } from '../lib/types';

interface Props {
  accountId: string;
  intents: Intent[];
  signals: Signal[];
}

function agentShortName(id: string): string {
  const agent = AGENTS.find((a) => a.operatorAccount === id);
  return agent ? agent.name.replace('AgentShield ', '') : id;
}

export default function AgentDetail({ accountId, intents, signals }: Props) {
  const agent = AGENTS.find((a) => a.operatorAccount === accountId);
  if (!agent) return null;

  const agentIntents = intents.filter((i) => i.agent_id === accountId).slice(-5).reverse();

  const greenCount = signals.filter((s) => s.level === 'GREEN').length;
  const yellowCount = signals.filter((s) => s.level === 'YELLOW').length;
  const redCount = signals.filter((s) => s.level === 'RED').length;
  const totalSig = greenCount + yellowCount + redCount || 1;

  return (
    <div className="glass p-5">
      <h2 className="text-sm font-semibold text-white/90 mb-3">AGENT DETAIL ({agent.name.replace('AgentShield ', '')})</h2>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* Profile */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold">
              {agent.name.charAt(12)}
            </div>
            <div>
              <div className="font-semibold text-sm">{agent.name.replace('AgentShield ', '')}</div>
              <div className="text-[10px] text-white/90">
                Role: {agent.role}<br />
                HOL: {agent.holAccount}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-white/70">
            <div>Profile Info</div>
            <div className="flex gap-2 mt-1">
              <span className="w-5 h-5 rounded-full bg-blue-600/30 flex items-center justify-center text-[8px]">H</span>
              <span className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center text-[8px]">10</span>
              <span className="w-5 h-5 rounded-full bg-cyan-600/30 flex items-center justify-center text-[8px]">AI</span>
            </div>
          </div>
        </div>

        {/* Compliance Log */}
        <div className="flex-1">
          <div className="text-xs text-white/90 mb-2">COMPLIANCE LOG</div>
          <div className="flex items-end gap-1 h-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex-1 bg-green-500/60 rounded-sm" style={{ height: `${60 + Math.random() * 40}%` }} />
            ))}
          </div>
          <div className="text-[10px] text-white/70 mt-2">
            <div>Balances</div>
            <div className="flex justify-between mt-0.5">
              <span>HBAR</span>
              <span>$SHIELD</span>
            </div>
            <div className="flex justify-between text-white">
              <span>? HBAR</span>
              <span>? SHIELD</span>
            </div>
            <div className="text-white/70 mt-0.5">Reputation NFTs</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Recent Intents */}
        <div>
          <div className="text-xs text-white/90 mb-2">RECENT INTENTS</div>
          <div className="space-y-1.5">
            {agentIntents.length === 0 && (
              <div className="text-[10px] text-white/70">No intents from this agent</div>
            )}
            {agentIntents.map((intent, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className="w-4 h-4 rounded-full bg-cyan-600/30 flex items-center justify-center text-[8px]">
                  {intent.action.charAt(0).toUpperCase()}
                </span>
                <span className="text-white">{agentShortName(intent.agent_id)}</span>
                <span className="text-white/70">{intent.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signal Distribution */}
        <div>
          <div className="text-xs text-white/90 mb-2">SIGNAL DISTRIBUTION</div>
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="4"
                  strokeDasharray={`${(greenCount / totalSig) * 88} 88`} strokeDashoffset="0" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(234,179,8,0.4)" strokeWidth="4"
                  strokeDasharray={`${(yellowCount / totalSig) * 88} 88`} strokeDashoffset={`-${(greenCount / totalSig) * 88}`} />
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="4"
                  strokeDasharray={`${(redCount / totalSig) * 88} 88`} strokeDashoffset={`-${((greenCount + yellowCount) / totalSig) * 88}`} />
              </svg>
            </div>
            <div className="text-[10px] space-y-1">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" /> GREEN {Math.round((greenCount / totalSig) * 100)}%</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /> YELLOW {Math.round((yellowCount / totalSig) * 100)}%</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> RED {Math.round((redCount / totalSig) * 100)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
