'use client';

import { useState } from 'react';

export default function TransactionLookup() {
  const [query, setQuery] = useState('');

  function openHashScan() {
    const q = query.trim() || '0.0.8291524';
    window.open(`https://hashscan.io/testnet/transaction/${q}`, '_blank');
  }

  return (
    <div className="glass p-5">
      <h2 className="section-title mb-3">Transaction Lookup</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search HashScan..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40 focus:bg-white/8 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && openHashScan()}
        />
        <button
          onClick={openHashScan}
          className="px-5 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold rounded-xl border border-cyan-400/30 hover:border-cyan-400/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
        >
          Check HashScan
        </button>
      </div>
    </div>
  );
}
