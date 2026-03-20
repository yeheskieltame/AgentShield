'use client';

import { AGENTS } from '../lib/config';
import type { Intent } from '../lib/types';

interface Props {
  intents: Intent[];
  selectedAgent: string | null;
  onSelect: (account: string) => void;
}

export default function AgentRegistry({ intents, selectedAgent, onSelect }: Props) {
  return (
    <div className="glass p-5">
      <h2 className="section-title mb-3">Agent Registry</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-white/90 border-b border-white/5">
              <th className="text-left py-1.5 font-medium">Name</th>
              <th className="text-left py-1.5 font-medium">Role</th>
              <th className="hidden md:table-cell text-left py-1.5 font-medium">Type</th>
              <th className="text-left py-1.5 font-medium">Operator Account</th>
              <th className="text-center py-1.5 font-medium">Status</th>
              <th className="text-right py-1.5 font-medium">Intents</th>
              <th className="hidden md:table-cell text-right py-1.5 font-medium">Compliance</th>
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((agent) => {
              const agentIntents = intents.filter((i) => i.agent_id === agent.operatorAccount);
              const isActive = agentIntents.some((i) => Date.now() - i.timestamp < 30000);
              const isSelected = selectedAgent === agent.operatorAccount;

              return (
                <tr
                  key={agent.operatorAccount}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/10'
                      : AGENTS.indexOf(agent) % 2 === 0
                        ? 'bg-white/[0.02] hover:bg-cyan-500/8'
                        : 'bg-transparent hover:bg-cyan-500/8'
                  }`}
                  onClick={() => onSelect(agent.operatorAccount)}
                >
                  <td className="py-2 text-white font-medium">{agent.name.replace('AgentShield ', '')}</td>
                  <td className="py-2 text-white/90">{agent.role}</td>
                  <td className="hidden md:table-cell py-2 text-white/90">{agent.type}</td>
                  <td className="py-2 text-cyan-400 font-mono text-[10px]">{agent.operatorAccount}</td>
                  <td className="py-2 text-center">
                    <span className={`badge ${isActive || agent.role === 'coordinator' ? 'badge-active' : 'bg-slate-700 text-white/90'}`}>
                      {isActive || agent.role === 'coordinator' ? 'Active' : 'Idle'}
                    </span>
                  </td>
                  <td className="py-2 text-right text-white">{agentIntents.length}</td>
                  <td className="hidden md:table-cell py-2 text-right text-green-400">100%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
