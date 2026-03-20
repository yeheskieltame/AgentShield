'use client';

import { TOPICS } from '../lib/config';
import type { HCSMessage } from '../lib/types';
import { decodeMessage } from '../lib/mirror-node';

interface Props {
  intentMessages: HCSMessage[];
  signalMessages: HCSMessage[];
}

function formatTs(ts: string): string {
  const epoch = parseFloat(ts) * 1000;
  return new Date(epoch).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function preview(base64: string): string {
  const data = decodeMessage(base64) as Record<string, unknown>;
  if (!data) return '(decode error)';
  return JSON.stringify(data).slice(0, 60) + '...';
}

function sender(base64: string): string {
  const data = decodeMessage(base64) as Record<string, unknown>;
  if (!data) return '?';
  return (data.agent_id as string) || 'Coordinator';
}

export default function TopicBrowser({ intentMessages, signalMessages }: Props) {
  const topics = [
    { name: 'Intent', id: TOPICS.intent, messages: intentMessages },
    { name: 'Signal', id: TOPICS.signal, messages: signalMessages },
    { name: 'Reputation', id: TOPICS.reputation, messages: [] },
  ];

  return (
    <div className="glass p-5">
      <h2 className="section-title mb-3">HCS Topics Browser</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-white/90 border-b border-white/5">
              <th className="text-left py-1.5 font-medium">Topic</th>
              <th className="text-left py-1.5 font-medium">ID</th>
              <th className="text-left py-1.5 font-medium">Message</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <tr key={topic.name} className="border-b border-white/5 align-top">
                <td className="py-2 text-white font-medium">{topic.name}</td>
                <td className="py-2 text-cyan-400 font-mono text-[10px]">{topic.id}</td>
                <td className="py-2">
                  {topic.messages.length === 0 ? (
                    <span className="text-white/70">No messages</span>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {topic.messages.slice(-5).reverse().map((msg, i) => (
                        <div key={i} className="text-[10px] text-white/90">
                          <span className="text-white/70">{formatTs(msg.consensus_timestamp)}</span>{' '}
                          <span className="text-white">{sender(msg.message)}</span>{' '}
                          <span className="text-white/70">{preview(msg.message)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
