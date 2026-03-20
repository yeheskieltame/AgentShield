'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/agents', label: 'Agents', icon: AgentsIcon },
  { href: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
  { href: '/explorer', label: 'Explorer', icon: ExplorerIcon },
];

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'rgba(255,255,255,0.9)' : 'none'} stroke={active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function AgentsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AnalyticsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ExplorerIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

export default function Navigation() {
  const pathname = usePathname();

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(14px) saturate(1.1)',
    WebkitBackdropFilter: 'blur(14px) saturate(1.1)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
  };

  return (
    <>
      {/* Desktop: floating left sidebar */}
      <nav
        className="hidden md:block fixed left-4 top-1/2 z-50 -translate-y-1/2"
        style={{
          ...glassStyle,
          borderRadius: '28px',
          padding: '10px 0',
        }}
      >
        <div className="flex flex-col items-center gap-1 px-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className="relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200"
                style={active ? {
                  background: 'rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 12px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12)',
                } : {}}
              >
                <item.icon active={active} />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile: bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          ...glassStyle,
          borderRadius: '0',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          padding: '6px 0',
        }}
      >
        <div className="flex items-center justify-around px-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all duration-200"
                style={active ? {
                  background: 'rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 12px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12)',
                } : {}}
              >
                <item.icon active={active} />
                <span className={`text-[9px] mt-0.5 ${active ? 'text-white/90' : 'text-white/45'}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
