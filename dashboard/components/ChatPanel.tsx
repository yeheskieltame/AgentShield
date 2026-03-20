'use client';

import { useState, useRef, useEffect } from 'react';
import type { Signal } from '../lib/types';

interface Props {
  signal: Signal | null;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'observer';
  text: string;
  timestamp: number;
}

function generateResponse(query: string, signal: Signal | null): string {
  const q = query.toLowerCase().trim();

  if (!signal) {
    return 'System is starting up. No risk data available yet. I will have insights once the Coordinator publishes its first signal.';
  }

  const score = signal.risk_score.toFixed(2);
  const reasoning = signal.reasoning || 'No reasoning provided.';
  const assets = signal.affected_assets?.length
    ? signal.affected_assets.join(', ')
    : 'none specified';
  const metrics = signal.metrics;

  // Risk / status questions
  if (q.match(/risk|safe|status|how.*things|what.*going|level|signal|danger|threat/)) {
    if (signal.level === 'GREEN') {
      return `Current risk is LOW (score: ${score}). Safe to proceed with normal operations.\n\nReasoning: ${reasoning}`;
    }
    if (signal.level === 'YELLOW') {
      return `CAUTION — Moderate risk detected (score: ${score}). Consider reducing position sizes by 50%.\n\nReasoning: ${reasoning}`;
    }
    return `WARNING — High risk! (score: ${score}). Strongly recommend aborting all pending transactions.\n\nReasoning: ${reasoning}`;
  }

  // Asset questions
  if (q.match(/asset|token|which|affected/)) {
    return `Currently affected assets: ${assets}. The top concentrated asset is ${metrics?.topAsset ?? 'unknown'} with a concentration score of ${(metrics?.assetConcentration ?? 0).toFixed(2)}.`;
  }

  // Volume questions
  if (q.match(/volume|how much|total|size/)) {
    const vol = metrics?.totalVolumeUsd ?? 0;
    const formatted = vol >= 1_000_000
      ? `$${(vol / 1_000_000).toFixed(1)}M`
      : vol >= 1000
        ? `$${(vol / 1000).toFixed(0)}K`
        : `$${vol.toFixed(0)}`;
    return `Total intent volume in the current window: ${formatted} across ${metrics?.totalIntents ?? 0} intents. Velocity: ${(metrics?.velocityPerSecond ?? 0).toFixed(2)} intents/sec.`;
  }

  // Sell pressure questions
  if (q.match(/sell|pressure|ratio|buy/)) {
    return `Current sell pressure ratio: ${(metrics?.sellPressure ?? 0).toFixed(2)} (0 = all buys, 1 = all sells). ${(metrics?.sellPressure ?? 0) > 0.6 ? 'Elevated sell pressure detected.' : 'Sell pressure is within normal range.'}`;
  }

  // Score questions
  if (q.match(/score|number|value/)) {
    return `The current composite risk score is ${score}. Breakdown — Volume: 30% weight, Asset concentration: 25%, Sell pressure: 25%, Velocity: 20%.`;
  }

  // Delay / action questions
  if (q.match(/delay|action|recommend|what.*do|should/)) {
    const delay = signal.recommended_delay_ms;
    if (signal.level === 'GREEN') {
      return `Signal is GREEN. No delay required. Proceed with transactions normally.`;
    }
    if (signal.level === 'YELLOW') {
      return `Signal is YELLOW. Recommended: reduce position sizes by 50% and add a ${delay}ms delay between transactions.`;
    }
    return `Signal is RED. Recommended: ABORT all pending transactions and wait at least ${delay}ms before retrying.`;
  }

  // Help
  if (q.match(/help|what can|commands|how.*use/)) {
    return 'You can ask me about:\n• Current risk level and score\n• Affected assets\n• Volume and intent metrics\n• Sell pressure\n• Recommended actions\n\nTry: "What\'s the risk?" or "Which assets are affected?"';
  }

  // Fallback
  return `Current signal: ${signal.level} (score: ${score}). ${reasoning}\n\nAsk me about risk levels, affected assets, volume metrics, or recommended actions.`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function ChatPanel({ signal }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: 'observer',
      text: 'AgentShield Observer online. Ask me about current DeFi risk levels.',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    const response = generateResponse(trimmed, signal);
    const observerMsg: ChatMessage = {
      id: Date.now() + 1,
      role: 'observer',
      text: response,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, observerMsg]);
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="glass p-5">
      <h2 className="section-title mb-3">Observer Agent Chat</h2>

      {/* Message list */}
      <div className="glass-inner p-3 h-72 overflow-y-auto space-y-2 mb-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                msg.role === 'user'
                  ? 'bg-cyan-500/20 border border-cyan-500/30 text-white'
                  : 'glass-inner text-white'
              }`}
            >
              {msg.role === 'observer' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/30 border border-cyan-400/50 flex items-center justify-center">
                    <svg
                      viewBox="0 0 16 16"
                      className="w-2.5 h-2.5 text-cyan-400"
                      fill="currentColor"
                    >
                      <circle cx="8" cy="8" r="3" />
                      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
                    Observer
                  </span>
                </div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed text-white">{msg.text}</p>
              <div className="text-[9px] text-white/50 mt-1 text-right">
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about risk levels, assets, volume..."
          className="flex-1 glass-inner px-3 py-2 text-xs text-white placeholder-white/40 rounded-lg border border-white/10 focus:border-cyan-500/50 focus:outline-none transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="glass-inner px-4 py-2 text-xs text-cyan-400 font-semibold rounded-lg border border-cyan-500/30 hover:bg-cyan-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Send
        </button>
      </div>
    </div>
  );
}
