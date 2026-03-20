'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useAgentData } from '../lib/useAgentData';
import type { Signal } from '../lib/types';

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
  const assets = signal.affected_assets?.length ? signal.affected_assets.join(', ') : 'none specified';
  const metrics = signal.metrics;

  if (q.match(/risk|safe|status|how.*things|what.*going|level|signal|danger|threat/)) {
    if (signal.level === 'GREEN') return `Current risk is LOW (score: ${score}). Safe to proceed.\n\n${reasoning}`;
    if (signal.level === 'YELLOW') return `CAUTION — Moderate risk (score: ${score}). Reduce positions by 50%.\n\n${reasoning}`;
    return `WARNING — High risk! (score: ${score}). Abort all transactions.\n\n${reasoning}`;
  }
  if (q.match(/asset|token|which|affected/)) {
    return `Affected assets: ${assets}. Top concentrated: ${metrics?.topAsset ?? 'unknown'} (${((metrics?.assetConcentration ?? 0) * 100).toFixed(0)}%).`;
  }
  if (q.match(/volume|how much|total|size/)) {
    const vol = metrics?.totalVolumeUsd ?? 0;
    const fmt = vol >= 1e6 ? `$${(vol / 1e6).toFixed(1)}M` : `$${(vol / 1000).toFixed(0)}K`;
    return `Volume: ${fmt} across ${metrics?.totalIntents ?? 0} intents. Velocity: ${(metrics?.velocityPerSecond ?? 0).toFixed(2)}/sec.`;
  }
  if (q.match(/sell|pressure|buy/)) {
    return `Sell pressure: ${((metrics?.sellPressure ?? 0) * 100).toFixed(0)}%. ${(metrics?.sellPressure ?? 0) > 0.6 ? 'Elevated.' : 'Normal range.'}`;
  }
  if (q.match(/score|number|value/)) {
    return `Risk score: ${score}. Weights — Volume 30%, Concentration 25%, Sell pressure 25%, Velocity 20%.`;
  }
  if (q.match(/delay|action|recommend|what.*do|should/)) {
    if (signal.level === 'GREEN') return 'GREEN — No delay. Proceed normally.';
    if (signal.level === 'YELLOW') return `YELLOW — Reduce sizes 50%, add ${signal.recommended_delay_ms}ms delay.`;
    return `RED — ABORT all transactions. Wait ${signal.recommended_delay_ms}ms.`;
  }
  if (q.match(/help|what can|commands/)) {
    return 'Ask me about:\n• Risk level & score\n• Affected assets\n• Volume metrics\n• Sell pressure\n• Recommended actions\n\nTry: "What\'s the risk?"';
  }
  return `Signal: ${signal.level} (${score}). ${reasoning}`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: 'observer', text: 'AgentShield Observer online. Ask me about current DeFi risk levels.', timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { latestSignal } = useAgentData();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = { id: Date.now(), role: 'user', text: trimmed, timestamp: Date.now() };
    const response = generateResponse(trimmed, latestSignal);
    const obsMsg: ChatMessage = { id: Date.now() + 1, role: 'observer', text: response, timestamp: Date.now() };

    setMessages((prev) => [...prev, userMsg, obsMsg]);
    setInput('');
  }

  function toggleOpen() {
    setIsOpen(!isOpen);
    if (!isOpen) setUnread(0);
  }

  // Notify on new signal
  useEffect(() => {
    if (latestSignal && !isOpen) {
      setUnread((prev) => prev + 1);
    }
  }, [latestSignal, isOpen]);

  return (
    <>
      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-[340px] md:w-[380px] flex flex-col"
          style={{
            background: 'rgba(10, 15, 30, 0.85)',
            backdropFilter: 'blur(24px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            maxHeight: '480px',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-2.5">
              <Image src="/agentshield-icon-filled-32px.png" alt="Observer" width={24} height={24} />
              <div>
                <div className="text-xs font-bold text-white">Observer Agent</div>
                <div className="text-[9px] text-cyan-400">AgentShield Protocol</div>
              </div>
            </div>
            <button
              onClick={toggleOpen}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5" style={{ maxHeight: '340px' }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[11px] ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/20 border border-cyan-400/25 text-white rounded-br-md'
                      : 'bg-white/5 border border-white/8 text-white rounded-bl-md'
                  }`}
                >
                  {msg.role === 'observer' && (
                    <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider mb-1">Observer</div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  <div className="text-[8px] text-white/40 mt-1 text-right">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Ask about risk levels..."
                className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/40 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center hover:bg-cyan-500/30 disabled:opacity-25 transition-all flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating bubble button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group"
        style={{
          background: isOpen ? 'transparent' : 'rgba(6, 182, 212, 0.15)',
          backdropFilter: isOpen ? 'none' : 'blur(14px)',
          WebkitBackdropFilter: isOpen ? 'none' : 'blur(14px)',
          border: isOpen ? 'none' : '1px solid rgba(6, 182, 212, 0.3)',
          boxShadow: isOpen ? 'none' : '0 4px 24px rgba(6, 182, 212, 0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
          pointerEvents: isOpen ? 'none' : 'auto',
          opacity: isOpen ? 0 : 1,
        }}
      >
        {/* Unread badge */}
        {unread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        <Image src="/agentshield-icon-filled-32px.png" alt="Chat" width={28} height={28} className="group-hover:scale-110 transition-transform" />
      </button>
    </>
  );
}
