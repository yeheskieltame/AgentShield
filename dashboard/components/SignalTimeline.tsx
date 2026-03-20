'use client';

import type { Signal } from '../lib/types';

interface Props {
  signals: Signal[];
}

const dotColor: Record<string, string> = {
  GREEN: 'bg-green-400 shadow-green-400/50',
  YELLOW: 'bg-yellow-400 shadow-yellow-400/50',
  RED: 'bg-red-400 shadow-red-400/50',
};

export default function SignalTimeline({ signals }: Props) {
  const recent = signals.slice(-12);

  return (
    <div className="glass p-5">
      <h2 className="section-title mb-3">Signal History (Mini Timeline)</h2>
      {recent.length === 0 ? (
        <div className="text-center py-4 text-white/70 text-xs">No signals yet...</div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {recent.map((sig, i) => {
            const time = new Date(sig.timestamp).toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[40px]">
                <div className={`w-3 h-3 rounded-full shadow-lg ${dotColor[sig.level]}`} />
                <span className="text-[9px] text-white/70">{time}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
