'use client';

import { useState, useEffect, useCallback } from 'react';

// Default HF Space URL — updated after deployment
const DEFAULT_HF_URL = 'https://agentshield-backend.hf.space';

interface BackendStatus {
  status: 'online' | 'offline' | 'checking';
  agents?: {
    coordinator: boolean;
    observer: boolean;
    sentinels: number;
  };
  lastIntent?: string;
  uptime?: number;
}

interface DemoStatus {
  running: boolean;
  scenario: string | null;
  phase?: string;
}

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'production' | 'local'>('production');
  const [backendUrl, setBackendUrl] = useState(DEFAULT_HF_URL);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({ status: 'checking' });
  const [demoStatus, setDemoStatus] = useState<DemoStatus>({ running: false, scenario: null });
  const [triggering, setTriggering] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Load saved backend URL
  useEffect(() => {
    const saved = localStorage.getItem('agentshield_backend_url');
    if (saved) setBackendUrl(saved);
  }, []);

  // Check backend health
  const checkHealth = useCallback(async () => {
    setBackendStatus({ status: 'checking' });
    try {
      const res = await fetch(`${backendUrl}/health`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('not ok');
      const data = await res.json();
      setBackendStatus({
        status: 'online',
        agents: data.agents,
        lastIntent: data.lastIntent,
        uptime: data.uptime,
      });
      if (data.demo) {
        setDemoStatus(data.demo);
      }
    } catch {
      setBackendStatus({ status: 'offline' });
    }
  }, [backendUrl]);

  useEffect(() => {
    if (isOpen) {
      checkHealth();
      const interval = setInterval(checkHealth, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen, checkHealth]);

  // Trigger demo scenario
  async function triggerDemo(scenario: 'crash' | 'whale' | 'normal') {
    setTriggering(scenario);
    try {
      const res = await fetch(`${backendUrl}/demo/${scenario}`, {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        setDemoStatus({ running: true, scenario: data.scenario || scenario, phase: data.phase });
      }
    } catch {
      // fail silently
    }
    setTriggering(null);
  }

  // Stop demo
  async function stopDemo() {
    try {
      await fetch(`${backendUrl}/demo/stop`, { method: 'POST', signal: AbortSignal.timeout(5000) });
      setDemoStatus({ running: false, scenario: null });
    } catch {
      // fail silently
    }
  }

  // Save backend URL
  function saveUrl() {
    localStorage.setItem('agentshield_backend_url', backendUrl);
    checkHealth();
  }

  // Copy CLI command
  function copyCmd(cmd: string, id: string) {
    navigator.clipboard.writeText(cmd);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!isOpen) return null;

  const statusColor = backendStatus.status === 'online' ? '#22c55e' : backendStatus.status === 'checking' ? '#eab308' : '#ef4444';
  const statusText = backendStatus.status === 'online' ? 'Connected' : backendStatus.status === 'checking' ? 'Checking...' : 'Offline';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed inset-x-4 top-[10%] md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[61] w-auto md:w-[560px] max-h-[80vh] overflow-y-auto animate-fadeIn"
        style={{
          background: 'rgba(10, 15, 30, 0.92)',
          backdropFilter: 'blur(32px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h2 className="text-base font-bold text-white">Backend Configuration</h2>
            <p className="text-[10px] text-white/50 mt-0.5">Choose how to run AgentShield agents</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-2">
          <button
            onClick={() => setTab('production')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              tab === 'production'
                ? 'bg-cyan-500/20 border border-cyan-400/30 text-cyan-400'
                : 'bg-white/4 border border-white/8 text-white/50 hover:text-white/70'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12H2" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
              </svg>
              PRODUCTION
            </span>
          </button>
          <button
            onClick={() => setTab('local')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              tab === 'local'
                ? 'bg-purple-500/20 border border-purple-400/30 text-purple-400'
                : 'bg-white/4 border border-white/8 text-white/50 hover:text-white/70'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
              LOCAL CLI
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {tab === 'production' ? (
            <ProductionTab
              backendUrl={backendUrl}
              setBackendUrl={setBackendUrl}
              saveUrl={saveUrl}
              status={backendStatus}
              statusColor={statusColor}
              statusText={statusText}
              demoStatus={demoStatus}
              triggering={triggering}
              triggerDemo={triggerDemo}
              stopDemo={stopDemo}
              checkHealth={checkHealth}
            />
          ) : (
            <LocalTab copied={copied} copyCmd={copyCmd} />
          )}
        </div>
      </div>
    </>
  );
}

/* ============================================
   Production Tab
   ============================================ */
function ProductionTab({
  backendUrl, setBackendUrl, saveUrl, status, statusColor, statusText,
  demoStatus, triggering, triggerDemo, stopDemo, checkHealth,
}: {
  backendUrl: string;
  setBackendUrl: (v: string) => void;
  saveUrl: () => void;
  status: BackendStatus;
  statusColor: string;
  statusText: string;
  demoStatus: DemoStatus;
  triggering: string | null;
  triggerDemo: (s: 'crash' | 'whale' | 'normal') => void;
  stopDemo: () => void;
  checkHealth: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className="glass-inner rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: statusColor }} />
            <span className="text-xs font-bold text-white">{statusText}</span>
          </div>
          <button onClick={checkHealth} className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors">
            Refresh
          </button>
        </div>

        {status.status === 'online' && status.agents && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className={`text-[10px] font-bold ${status.agents.coordinator ? 'text-green-400' : 'text-red-400'}`}>
                {status.agents.coordinator ? 'ACTIVE' : 'DOWN'}
              </div>
              <div className="text-[9px] text-white/50 mt-0.5">Coordinator</div>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className={`text-[10px] font-bold ${status.agents.observer ? 'text-green-400' : 'text-red-400'}`}>
                {status.agents.observer ? 'ACTIVE' : 'DOWN'}
              </div>
              <div className="text-[9px] text-white/50 mt-0.5">Observer</div>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-[10px] font-bold text-cyan-400">{status.agents.sentinels}/3</div>
              <div className="text-[9px] text-white/50 mt-0.5">Sentinels</div>
            </div>
          </div>
        )}

        {status.status === 'offline' && (
          <p className="text-[10px] text-white/40 mt-1">
            Backend not reachable. It may be sleeping — HF Spaces free tier sleeps after 48h of inactivity. Try triggering a demo to wake it up.
          </p>
        )}
      </div>

      {/* Backend URL */}
      <div>
        <label className="text-[10px] text-white/50 font-medium uppercase tracking-wider">Backend URL</label>
        <div className="flex gap-2 mt-1.5">
          <input
            type="text"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/40 transition-colors font-mono"
          />
          <button onClick={saveUrl} className="px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/25 text-[10px] font-bold text-cyan-400 hover:bg-cyan-500/25 transition-colors">
            Save
          </button>
        </div>
      </div>

      {/* Demo Controls */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-white/50 font-medium uppercase tracking-wider">Trigger Demo Scenario</label>
          {demoStatus.running && (
            <button onClick={stopDemo} className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-bold">
              Stop Demo
            </button>
          )}
        </div>

        {demoStatus.running && (
          <div className="glass-inner rounded-xl p-3 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-[10px] text-yellow-400 font-bold uppercase">{demoStatus.scenario} running</span>
            {demoStatus.phase && <span className="text-[10px] text-white/40">— {demoStatus.phase}</span>}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          <DemoButton
            icon="flash"
            label="Flash Crash Simulation"
            description="4 phases: Normal → Tension → Cascade → Recovery. Shows GREEN → YELLOW → RED → GREEN."
            color="red"
            loading={triggering === 'crash'}
            disabled={triggering !== null}
            onClick={() => triggerDemo('crash')}
          />
          <DemoButton
            icon="whale"
            label="Whale Dump Scenario"
            description="Single large actor dumps position rapidly. Tests concentrated sell detection."
            color="amber"
            loading={triggering === 'whale'}
            disabled={triggering !== null}
            onClick={() => triggerDemo('whale')}
          />
          <DemoButton
            icon="normal"
            label="Normal Trading"
            description="Baseline normal market activity for 2 minutes. Signal stays GREEN throughout."
            color="green"
            loading={triggering === 'normal'}
            disabled={triggering !== null}
            onClick={() => triggerDemo('normal')}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================
   Demo Button
   ============================================ */
function DemoButton({ icon, label, description, color, loading, disabled, onClick }: {
  icon: 'flash' | 'whale' | 'normal';
  label: string;
  description: string;
  color: 'red' | 'amber' | 'green';
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const colorMap = {
    red: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#fca5a5', icon: '#ef4444' },
    amber: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#fcd34d', icon: '#f59e0b' },
    green: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', text: '#86efac', icon: '#22c55e' },
  };
  const c = colorMap[color];

  const icons = {
    flash: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c.icon} stroke="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    whale: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12c0 4 3.5 7 8 7s5-1.5 7-4c1.5-2 3-3 5-3" />
        <path d="M22 9c-1 0-2 .5-3 1.5" />
        <circle cx="7" cy="11" r="1" fill={c.icon} />
        <path d="M2 12c0-4 3-7 7-7 2 0 3.5.5 5 2l2-3" />
      </svg>
    ),
    normal: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-start gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <div className="mt-0.5 flex-shrink-0">{icons[icon]}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold flex items-center gap-2" style={{ color: c.text }}>
          {label}
          {loading && (
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <div className="text-[9px] text-white/40 mt-0.5 leading-relaxed">{description}</div>
      </div>
    </button>
  );
}

/* ============================================
   Local CLI Tab
   ============================================ */
function LocalTab({ copied, copyCmd }: { copied: string | null; copyCmd: (cmd: string, id: string) => void }) {
  const steps = [
    {
      id: 'clone',
      title: '1. Clone & Install',
      cmds: [
        'git clone https://github.com/yeheskieltame/AgentShield.git',
        'cd AgentShield && npm install',
      ],
    },
    {
      id: 'env',
      title: '2. Configure Environment',
      cmds: ['cp .env.example .env', '# Fill in your Hedera testnet account IDs and keys'],
    },
    {
      id: 'coordinator',
      title: '3. Start Coordinator (Terminal 1)',
      cmds: ['npm run coordinator'],
    },
    {
      id: 'sentinels',
      title: '4. Start Sentinels (Terminal 2-4)',
      cmds: ['npm run sentinel:keeper', 'npm run sentinel:arb', 'npm run sentinel:whale'],
    },
    {
      id: 'observer',
      title: '5. Start Observer (Terminal 5)',
      cmds: ['npm run observer'],
    },
    {
      id: 'demo',
      title: '6. Run Demo Scenario',
      cmds: ['npm run demo:crash    # Flash crash simulation', 'npm run demo:whale    # Whale dump scenario', 'npm run demo:normal   # Normal trading'],
    },
  ];

  return (
    <div className="space-y-3">
      <div className="glass-inner rounded-xl p-3 flex items-start gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" className="mt-0.5 flex-shrink-0">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="text-[10px] text-white/60 leading-relaxed">
          Run agents locally for full control. The dashboard automatically picks up data from Hedera Mirror Node — no extra configuration needed.
        </p>
      </div>

      {steps.map((step) => (
        <div key={step.id}>
          <div className="text-[10px] text-white/70 font-bold mb-1.5">{step.title}</div>
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {step.cmds.map((cmd, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 hover:bg-white/3 group" style={i > 0 ? { borderTop: '1px solid rgba(255,255,255,0.04)' } : {}}>
                <code className="text-[10px] text-cyan-300/80 font-mono">{cmd}</code>
                {!cmd.startsWith('#') && (
                  <button
                    onClick={() => copyCmd(cmd, `${step.id}-${i}`)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-white/40 hover:text-white/70 px-1.5 py-0.5 rounded"
                  >
                    {copied === `${step.id}-${i}` ? '✓' : 'Copy'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="glass-inner rounded-xl p-3 mt-2">
        <div className="text-[10px] text-white/50 leading-relaxed">
          <strong className="text-purple-400">Tip:</strong> You don&apos;t need to run agents to view the dashboard. Historical data from HCS topics is always available via Mirror Node. Run agents to generate new live data.
        </div>
      </div>
    </div>
  );
}
