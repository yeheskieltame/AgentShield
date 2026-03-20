import { HCS10Client } from '@hashgraphonline/standards-sdk';
import { subscribeToTopic } from '../../lib/hcs-subscriber.js';
import { CONFIG } from '../../lib/config.js';
import { Signal } from '../../lib/types.js';
import { getObserverResponse } from './chat-handler.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let latestSignal: Signal | null = null;

/** Observer's HOL inbound topic — other agents/humans send connection requests here. */
const INBOUND_TOPIC = '0.0.8299746';

/** Track the last sequence number we processed on the inbound topic so we don't replay. */
let lastInboundSeq = 0;

/** Track connection topics we've already seen to avoid duplicate handling. */
const activeConnections = new Set<string>();

/** Track last sequence number per connection topic so we only process new messages. */
const connectionSeqs = new Map<string, number>();

// ---------------------------------------------------------------------------
// HCS-10 Client
// ---------------------------------------------------------------------------

let hcs10: HCS10Client;

function initHcs10(): HCS10Client {
  return new HCS10Client({
    network: 'testnet',
    operatorId: CONFIG.observer.accountId,
    operatorPrivateKey: CONFIG.observer.privateKey,
    guardedRegistryBaseUrl: CONFIG.hol.registryUrl,
    logLevel: 'error',
  });
}

// ---------------------------------------------------------------------------
// Poll inbound topic for connection requests
// ---------------------------------------------------------------------------

async function pollInboundTopic(): Promise<void> {
  try {
    const { messages } = await hcs10.getMessages(INBOUND_TOPIC, {
      order: 'asc',
    });

    for (const msg of messages) {
      // Skip already-processed messages
      if (msg.sequence_number <= lastInboundSeq) continue;
      lastInboundSeq = msg.sequence_number;

      console.log(
        `[Observer] Inbound msg #${msg.sequence_number} op=${msg.op} from=${msg.operator_id ?? msg.payer}`,
      );

      if (msg.op === 'connection_request') {
        await handleConnectionRequest(msg);
      }
    }
  } catch (err) {
    console.error('[Observer] Error polling inbound topic:', err);
  }
}

// ---------------------------------------------------------------------------
// Handle a new HCS-10 connection request
// ---------------------------------------------------------------------------

async function handleConnectionRequest(msg: {
  sequence_number: number;
  operator_id?: string;
  payer: string;
  requesting_account_id?: string;
}): Promise<void> {
  try {
    const requestorAccount =
      msg.requesting_account_id ??
      (msg.operator_id
        ? hcs10.extractAccountFromOperatorId(msg.operator_id)
        : msg.payer);

    console.log(
      `[Observer] Connection request #${msg.sequence_number} from ${requestorAccount} — accepting...`,
    );

    const result = await hcs10.handleConnectionRequest(
      INBOUND_TOPIC,
      requestorAccount,
      msg.sequence_number,
    );

    const connTopic = result.connectionTopicId;
    activeConnections.add(connTopic);
    connectionSeqs.set(connTopic, 0);

    console.log(
      `[Observer] Connection established: topic=${connTopic} with ${requestorAccount}`,
    );

    // Send a welcome message on the new connection topic
    const welcome = getObserverResponse('hello', latestSignal);
    await hcs10.sendMessage(connTopic, welcome, 'observer-greeting');
    console.log(`[Observer] Sent welcome on ${connTopic}`);
  } catch (err) {
    console.error(
      `[Observer] Failed to handle connection request #${msg.sequence_number}:`,
      err,
    );
  }
}

// ---------------------------------------------------------------------------
// Poll all active connection topics for chat messages
// ---------------------------------------------------------------------------

async function pollConnectionTopics(): Promise<void> {
  for (const connTopic of activeConnections) {
    try {
      const lastSeq = connectionSeqs.get(connTopic) ?? 0;
      const { messages } = await hcs10.getMessages(connTopic, {
        order: 'asc',
      });

      for (const msg of messages) {
        if (msg.sequence_number <= lastSeq) continue;
        connectionSeqs.set(connTopic, msg.sequence_number);

        // Ignore our own messages (sent by the observer operator)
        if (msg.payer === CONFIG.observer.accountId) continue;

        if (msg.op === 'message' && msg.data) {
          console.log(
            `[Observer] Chat on ${connTopic} #${msg.sequence_number}: "${msg.data}"`,
          );

          const response = getObserverResponse(msg.data, latestSignal);
          await hcs10.sendMessage(connTopic, response, 'observer-response');
          console.log(`[Observer] Replied on ${connTopic}: "${response}"`);
        }
      }
    } catch (err) {
      console.error(
        `[Observer] Error polling connection topic ${connTopic}:`,
        err,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Discover existing connections from outbound topic on startup
// ---------------------------------------------------------------------------

async function discoverExistingConnections(): Promise<void> {
  try {
    const outboundMessages = await hcs10.retrieveOutboundMessages(
      CONFIG.observer.accountId,
      { order: 'asc' },
    );

    for (const msg of outboundMessages) {
      if (
        msg.op === 'connection_created' &&
        msg.connection_topic_id &&
        !activeConnections.has(msg.connection_topic_id)
      ) {
        activeConnections.add(msg.connection_topic_id);
        connectionSeqs.set(msg.connection_topic_id, 0);
        console.log(
          `[Observer] Discovered existing connection: ${msg.connection_topic_id}`,
        );
      }
    }

    console.log(
      `[Observer] ${activeConnections.size} existing connection(s) loaded.`,
    );
  } catch (err) {
    console.error('[Observer] Error discovering existing connections:', err);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('[Observer] Starting AgentShield Observer agent...');

  // 1. Subscribe to the signal topic so we always have the latest risk status
  await subscribeToTopic(CONFIG.topics.signal, (signal: Signal) => {
    if (signal.p === 'agentshield' && signal.op === 'signal') {
      latestSignal = signal;
    }
  });
  console.log('[Observer] Subscribed to signal topic.');

  // 2. Initialise HCS-10 client
  hcs10 = initHcs10();
  console.log('[Observer] HCS-10 client initialised.');

  // 3. Discover any connections that were established before this restart
  await discoverExistingConnections();

  // 4. Start polling loops
  //    - Inbound topic: check for new connection requests every 5 s
  //    - Connection topics: check for new chat messages every 4 s
  setInterval(pollInboundTopic, 5000);
  setInterval(pollConnectionTopics, 4000);

  console.log('[Observer] Listening for HCS-10 messages...');
  console.log(
    `[Observer] Inbound topic: ${INBOUND_TOPIC}  |  Operator: ${CONFIG.observer.accountId}`,
  );

  // 5. Periodic status log so judges can see activity in the terminal
  setInterval(() => {
    if (latestSignal) {
      console.log(
        `[Observer] Current: ${latestSignal.level} | Score: ${latestSignal.risk_score.toFixed(2)} | Connections: ${activeConnections.size} | ${latestSignal.reasoning}`,
      );
    } else {
      console.log(
        `[Observer] No signals received yet. Connections: ${activeConnections.size}. System nominal.`,
      );
    }
  }, 10000);
}

main().catch(console.error);
