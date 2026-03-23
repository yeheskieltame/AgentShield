'use client';

import { useState, useEffect } from 'react';

export default function WelcomeToast() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const visited = localStorage.getItem('agentshield_welcome_dismissed');
    if (!visited) {
      // Show after a short delay so the page loads first
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => dismiss(), 8000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem('agentshield_welcome_dismissed', '1');
    setTimeout(() => setVisible(false), 300);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed top-20 md:top-24 left-1/2 -translate-x-1/2 z-50 ${dismissed ? 'opacity-0 scale-95' : 'animate-slideInToast'}`}
      style={{
        transition: 'opacity 0.3s, transform 0.3s',
        maxWidth: '420px',
        width: 'calc(100% - 2rem)',
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer"
        onClick={dismiss}
        style={{
          background: 'rgba(6, 182, 212, 0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          boxShadow: '0 8px 32px rgba(6, 182, 212, 0.1), 0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {/* Animated arrow pointing to settings */}
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-bold text-cyan-300">Configure Backend</div>
          <div className="text-[10px] text-white/60 mt-0.5">
            Click the <span className="text-cyan-400 font-semibold">settings gear</span> in the top-right to connect to live agents or run locally.
          </div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>
    </div>
  );
}
