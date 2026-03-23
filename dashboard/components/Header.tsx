'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import SettingsModal from './SettingsModal';

const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/agents': 'Agents',
  '/analytics': 'Risk Analytics',
  '/explorer': 'On-Chain Explorer',
};

export default function Header() {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] || 'Dashboard';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  // Pulse animation for first-time visitors
  useEffect(() => {
    const visited = localStorage.getItem('agentshield_settings_opened');
    if (!visited) {
      setShowPulse(true);
    }
  }, []);

  function openSettings() {
    setSettingsOpen(true);
    setShowPulse(false);
    localStorage.setItem('agentshield_settings_opened', '1');
  }

  return (
    <>
      <header
        className="fixed top-4 left-4 md:left-24 right-4 md:right-6 z-40 flex items-center justify-between px-3 md:px-6 py-2 md:py-1.5"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(14px) saturate(1.1)',
          WebkitBackdropFilter: 'blur(14px) saturate(1.1)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Left: logo + brand + separator + page title */}
        <div className="flex items-center gap-3">
          {/* Logo — small on mobile, bigger on desktop */}
          <Image src="/agentshield-logo-64px.png" alt="AgentShield" width={32} height={32} className="flex-shrink-0 md:hidden" />
          <Image src="/agentshield-logo-256px.png" alt="AgentShield" width={64} height={64} className="flex-shrink-0 hidden md:block" />

          {/* Brand text — stacked on desktop */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col leading-tight">
              <span className="text-sm md:text-lg font-bold text-white tracking-wide uppercase">AGENTSHIELD</span>
              <span className="hidden sm:block text-[9px] md:text-[10px] text-cyan-400 tracking-widest uppercase">DeFi Circuit Breaker</span>
            </div>

            {/* Separator */}
            <div className="hidden sm:block h-6 md:h-8 w-px bg-white/15 mx-2" />

            {/* Page title */}
            <span className="hidden sm:inline text-sm md:text-base font-semibold text-white/80">{pageTitle}</span>
          </div>
        </div>

        {/* Center: status pill */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-white/90 font-medium">Live on Hedera Testnet</span>
        </div>

        {/* Right: network badge + settings */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-lg text-[10px] font-bold text-cyan-400 tracking-wider" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
            TESTNET
          </div>

          {/* Settings button with pulse */}
          <button
            onClick={openSettings}
            className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Pulse ring for first-time visitors */}
            {showPulse && (
              <>
                <span className="absolute inset-0 rounded-xl animate-ping" style={{ background: 'rgba(6,182,212,0.15)', animationDuration: '2s' }} />
                <span className="absolute -inset-0.5 rounded-xl" style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', animation: 'settingsGlow 2s ease-in-out infinite' }} />
              </>
            )}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showPulse ? '#06b6d4' : 'rgba(255,255,255,0.7)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
