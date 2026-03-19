export async function subscribeToTopic(
  topicId: string,
  callback: (message: any) => void
): Promise<void> {
  const mirrorUrl = 'https://testnet.mirrornode.hedera.com';
  let lastTimestamp = '0.0';

  setInterval(async () => {
    try {
      const url = `${mirrorUrl}/api/v1/topics/${topicId}/messages?timestamp=gt:${lastTimestamp}&limit=25&order=asc`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.messages && data.messages.length > 0) {
        for (const msg of data.messages) {
          lastTimestamp = msg.consensus_timestamp;
          const decoded = Buffer.from(msg.message, 'base64').toString('utf-8');
          try {
            const parsed = JSON.parse(decoded);
            callback(parsed);
          } catch {}
        }
      }
    } catch (err) {
      console.error('Mirror node poll error:', err);
    }
  }, 3000);
}
