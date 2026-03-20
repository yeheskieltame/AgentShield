'use client';

import { useAgentData } from '../../lib/useAgentData';
import TopicBrowser from '../../components/TopicBrowser';
import TokenInfo from '../../components/TokenInfo';
import TransactionLookup from '../../components/TransactionLookup';

export default function ExplorerPage() {
  const { intentMessages, signalMessages } = useAgentData();

  return (
    <div className="space-y-4">
      <TokenInfo />
      <TransactionLookup />
      <TopicBrowser intentMessages={intentMessages} signalMessages={signalMessages} />
    </div>
  );
}
