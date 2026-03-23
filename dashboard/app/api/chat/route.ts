import { NextRequest, NextResponse } from 'next/server';

const MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com/api/v1';
const OBSERVER_OUTBOUND_TOPIC = '0.0.8299745';
const OBSERVER_ACCOUNT = '0.0.8299742';

interface Signal {
  level: 'GREEN' | 'YELLOW' | 'RED';
  risk_score: number;
  reasoning?: string;
  affected_assets?: string[];
  recommended_delay_ms?: number;
  metrics?: {
    totalVolumeUsd?: number;
    totalIntents?: number;
    velocityPerSecond?: number;
    sellPressure?: number;
    assetConcentration?: number;
    topAsset?: string;
  };
}

interface ChatRequest {
  message: string;
  signal: Signal | null;
}

interface ObserverMessage {
  content: string;
  timestamp: string;
}

/**
 * Fetch latest messages from the Observer agent's HCS-10 outbound topic via Mirror Node.
 * These are real on-chain messages published by the Observer agent.
 */
async function fetchObserverMessages(limit: number = 5): Promise<ObserverMessage[]> {
  try {
    const url = `${MIRROR_NODE_URL}/topics/${OBSERVER_OUTBOUND_TOPIC}/messages?limit=${limit}&order=desc`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const data = await res.json();
    const messages: ObserverMessage[] = [];
    for (const msg of data.messages || []) {
      try {
        const decoded = Buffer.from(msg.message, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        // HCS-10 messages may have different structures; extract meaningful content
        const content = parsed.data || parsed.content || parsed.message || parsed.memo || decoded;
        messages.push({
          content: typeof content === 'string' ? content : JSON.stringify(content),
          timestamp: msg.consensus_timestamp,
        });
      } catch {
        // If not JSON, use raw decoded content
        try {
          const decoded = Buffer.from(msg.message, 'base64').toString('utf-8');
          messages.push({ content: decoded, timestamp: msg.consensus_timestamp });
        } catch {
          // skip unparseable messages
        }
      }
    }
    return messages.reverse(); // chronological order
  } catch (err) {
    console.warn('Failed to fetch Observer outbound messages:', err);
    return [];
  }
}

function buildObserverContext(observerMsgs: ObserverMessage[]): string {
  if (observerMsgs.length === 0) return '';
  const lines = observerMsgs.map((m, i) => {
    const ts = new Date(parseFloat(m.timestamp) * 1000).toISOString();
    return `[${i + 1}] (${ts}) ${m.content}`;
  });
  return `\n\nRecent on-chain Observer messages (from HCS topic ${OBSERVER_OUTBOUND_TOPIC}):\n${lines.join('\n')}`;
}

function buildSignalContext(signal: Signal | null): string {
  if (!signal) return 'No signal data available yet — the system is starting up.';

  const lines = [
    `Current signal: ${signal.level}`,
    `Risk score: ${signal.risk_score.toFixed(2)}`,
  ];
  if (signal.reasoning) lines.push(`Reasoning: ${signal.reasoning}`);
  if (signal.affected_assets?.length) lines.push(`Affected assets: ${signal.affected_assets.join(', ')}`);
  if (signal.recommended_delay_ms !== undefined) lines.push(`Recommended delay: ${signal.recommended_delay_ms}ms`);
  if (signal.metrics) {
    const m = signal.metrics;
    if (m.totalVolumeUsd !== undefined) lines.push(`Total volume: $${m.totalVolumeUsd.toLocaleString()}`);
    if (m.totalIntents !== undefined) lines.push(`Total intents: ${m.totalIntents}`);
    if (m.velocityPerSecond !== undefined) lines.push(`Velocity: ${m.velocityPerSecond.toFixed(2)}/sec`);
    if (m.sellPressure !== undefined) lines.push(`Sell pressure: ${(m.sellPressure * 100).toFixed(0)}%`);
    if (m.assetConcentration !== undefined) lines.push(`Asset concentration: ${(m.assetConcentration * 100).toFixed(0)}% (${m.topAsset ?? 'unknown'})`);
  }
  return lines.join('\n');
}

function fallbackResponse(signal: Signal | null): string {
  if (!signal) return 'System is starting up. No risk data available yet.';
  const score = signal.risk_score.toFixed(2);
  return `Signal: ${signal.level} (${score}). ${signal.reasoning || 'No additional details.'}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, signal } = body;

    // Fetch on-chain Observer messages from HCS-10 outbound topic
    const observerMessages = await fetchObserverMessages(5);
    const observerContext = buildObserverContext(observerMessages);
    const hasOnChainData = observerMessages.length > 0;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('GROQ_API_KEY not set, using fallback response');
      return NextResponse.json({
        response: fallbackResponse(signal),
        source: hasOnChainData ? 'hcs10_observer' : 'fallback',
        observerAccount: OBSERVER_ACCOUNT,
        observerTopic: OBSERVER_OUTBOUND_TOPIC,
        onChainMessages: observerMessages.length,
      });
    }

    const signalContext = buildSignalContext(signal);

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              `You are AgentShield Observer, a DeFi circuit breaker AI agent on Hedera (account ${OBSERVER_ACCOUNT}). You monitor risk levels and answer questions about current market conditions. Be concise (2-3 sentences max). Use the provided signal data and on-chain Observer messages for context. You read on-chain data from HCS-10 topic ${OBSERVER_OUTBOUND_TOPIC}.`,
          },
          {
            role: 'user',
            content: `Current signal data:\n${signalContext}${observerContext}\n\nUser question: ${message}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 256,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errText);
      return NextResponse.json({
        response: fallbackResponse(signal),
        source: hasOnChainData ? 'hcs10_observer' : 'fallback',
        observerAccount: OBSERVER_ACCOUNT,
        observerTopic: OBSERVER_OUTBOUND_TOPIC,
        onChainMessages: observerMessages.length,
      });
    }

    const data = await groqResponse.json();
    const aiMessage = data.choices?.[0]?.message?.content?.trim();

    if (!aiMessage) {
      return NextResponse.json({
        response: fallbackResponse(signal),
        source: hasOnChainData ? 'hcs10_observer' : 'fallback',
        observerAccount: OBSERVER_ACCOUNT,
        observerTopic: OBSERVER_OUTBOUND_TOPIC,
        onChainMessages: observerMessages.length,
      });
    }

    return NextResponse.json({
      response: aiMessage,
      source: hasOnChainData ? 'hcs10_observer' : 'groq_only',
      observerAccount: OBSERVER_ACCOUNT,
      observerTopic: OBSERVER_OUTBOUND_TOPIC,
      onChainMessages: observerMessages.length,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ response: 'Sorry, I encountered an error. Please try again.', source: 'error' }, { status: 500 });
  }
}
