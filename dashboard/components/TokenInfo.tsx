'use client';

import { useEffect, useState } from 'react';
import { TOKENS } from '../lib/config';
import { fetchTokenInfo } from '../lib/mirror-node';

interface TokenData {
  name: string;
  symbol: string;
  total_supply: string;
  decimals: string;
  type: string;
}

function formatNumber(value: string | number): string {
  return Number(value).toLocaleString();
}

export default function TokenInfo() {
  const [shieldData, setShieldData] = useState<TokenData | null>(null);
  const [nftData, setNftData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [shield, nft] = await Promise.all([
        fetchTokenInfo(TOKENS.shield),
        fetchTokenInfo(TOKENS.reputationNft),
      ]);
      if (shield) setShieldData(shield);
      if (nft) setNftData(nft);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="glass p-5">
        <h2 className="section-title mb-3">Token Info</h2>
        <div className="text-xs text-white/70 animate-pulse">Loading token data...</div>
      </div>
    );
  }

  return (
    <div className="glass p-5">
      <h2 className="section-title mb-3">Token Info</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-inner p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-sm font-semibold">{shieldData?.symbol || '$SHIELD'}</span>
          </div>
          <div className="text-[10px] text-white/90 space-y-0.5">
            <div>ID: <span className="text-cyan-400 font-mono">{TOKENS.shield}</span></div>
            <div>Name: {shieldData?.name || 'N/A'}</div>
            <div>Supply: {shieldData ? formatNumber(shieldData.total_supply) : 'N/A'}</div>
            <div>Decimals: {shieldData?.decimals ?? 'N/A'}</div>
            <div>Type: {shieldData?.type || 'N/A'}</div>
          </div>
        </div>
        <div className="glass-inner p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-purple-400" />
            <span className="text-sm font-semibold">{nftData?.symbol || 'Reputation NFT'}</span>
          </div>
          <div className="text-[10px] text-white/90 space-y-0.5">
            <div>ID: <span className="text-cyan-400 font-mono">{TOKENS.reputationNft}</span></div>
            <div>Name: {nftData?.name || 'N/A'}</div>
            <div>Supply: {nftData ? formatNumber(nftData.total_supply) : 'N/A'}</div>
            <div>Type: {nftData?.type || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
