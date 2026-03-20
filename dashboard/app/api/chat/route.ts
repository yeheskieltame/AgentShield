import { NextRequest, NextResponse } from 'next/server';

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

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('GROQ_API_KEY not set, using fallback response');
      return NextResponse.json({ response: fallbackResponse(signal) });
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
              'You are AgentShield Observer, a DeFi circuit breaker AI agent on Hedera. You monitor risk levels and answer questions about current market conditions. Be concise (2-3 sentences max). Use the provided signal data for context.',
          },
          {
            role: 'user',
            content: `Current signal data:\n${signalContext}\n\nUser question: ${message}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 256,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errText);
      return NextResponse.json({ response: fallbackResponse(signal) });
    }

    const data = await groqResponse.json();
    const aiMessage = data.choices?.[0]?.message?.content?.trim();

    if (!aiMessage) {
      return NextResponse.json({ response: fallbackResponse(signal) });
    }

    return NextResponse.json({ response: aiMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ response: 'Sorry, I encountered an error. Please try again.' }, { status: 500 });
  }
}
