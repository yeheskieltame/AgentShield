'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TOPICS } from './config';
import { fetchTopicMessages, parseIntent, parseSignal } from './mirror-node';
import type { Intent, Signal, HCSMessage } from './types';

export function useAgentData() {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [intentMessages, setIntentMessages] = useState<HCSMessage[]>([]);
  const [signalMessages, setSignalMessages] = useState<HCSMessage[]>([]);
  const lastIntentTs = useRef('0.0');
  const lastSignalTs = useRef('0.0');

  const poll = useCallback(async () => {
    // Poll intents
    const intentMsgs = await fetchTopicMessages(TOPICS.intent, lastIntentTs.current);
    if (intentMsgs.length > 0) {
      lastIntentTs.current = intentMsgs[intentMsgs.length - 1].consensus_timestamp;
      setIntentMessages((prev) => [...prev, ...intentMsgs].slice(-200));
      const newIntents = intentMsgs.map(parseIntent).filter(Boolean) as Intent[];
      if (newIntents.length > 0) {
        setIntents((prev) => [...prev, ...newIntents].slice(-500));
      }
    }

    // Poll signals
    const sigMsgs = await fetchTopicMessages(TOPICS.signal, lastSignalTs.current);
    if (sigMsgs.length > 0) {
      lastSignalTs.current = sigMsgs[sigMsgs.length - 1].consensus_timestamp;
      setSignalMessages((prev) => [...prev, ...sigMsgs].slice(-200));
      const newSignals = sigMsgs.map(parseSignal).filter(Boolean) as Signal[];
      if (newSignals.length > 0) {
        setSignals((prev) => [...prev, ...newSignals].slice(-200));
      }
    }
  }, []);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [poll]);

  const latestSignal = signals.length > 0 ? signals[signals.length - 1] : null;
  const metricsHistory = signals.filter((s) => s.metrics).map((s) => s.metrics).slice(-20);

  return { intents, signals, latestSignal, metricsHistory, intentMessages, signalMessages };
}
