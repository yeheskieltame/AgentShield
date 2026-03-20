'use client';

import { useState } from 'react';
import { useAgentData } from '../../lib/useAgentData';
import AgentRegistry from '../../components/AgentRegistry';
import AgentDetail from '../../components/AgentDetail';

export default function AgentsPage() {
  const { intents, signals } = useAgentData();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <AgentRegistry intents={intents} selectedAgent={selectedAgent} onSelect={setSelectedAgent} />
      {selectedAgent && (
        <AgentDetail accountId={selectedAgent} intents={intents} signals={signals} />
      )}
    </div>
  );
}
