'use client';

import { TOKENS } from '../lib/config';

export default function TokenInfo() {
  return (
    <div className="glass p-5">
      <h2 className="section-title mb-3">Token Info</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-inner p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-sm font-semibold">$SHIELD</span>
          </div>
          <div className="text-[10px] text-white/90 space-y-0.5">
            <div>ID: <span className="text-cyan-400 font-mono">{TOKENS.shield}</span></div>
            <div>Supply: 100,000,000</div>
            <div>Decimals: 8</div>
          </div>
        </div>
        <div className="glass-inner p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-purple-400" />
            <span className="text-sm font-semibold">Reputation NFT</span>
          </div>
          <div className="text-[10px] text-white/90 space-y-0.5">
            <div>ID: <span className="text-cyan-400 font-mono">{TOKENS.reputationNft}</span></div>
            <div>Type: Non-Fungible</div>
            <div>Supply: Unlimited</div>
          </div>
        </div>
      </div>
    </div>
  );
}
