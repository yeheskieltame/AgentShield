import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  network: process.env.HEDERA_NETWORK || 'testnet',
  coordinator: {
    accountId: process.env.COORDINATOR_ACCOUNT_ID!,
    privateKey: process.env.COORDINATOR_PRIVATE_KEY!,
  },
  sentinels: {
    keeper: {
      accountId: process.env.SENTINEL_KEEPER_ACCOUNT_ID!,
      privateKey: process.env.SENTINEL_KEEPER_PRIVATE_KEY!,
    },
    arb: {
      accountId: process.env.SENTINEL_ARB_ACCOUNT_ID!,
      privateKey: process.env.SENTINEL_ARB_PRIVATE_KEY!,
    },
    whale: {
      accountId: process.env.SENTINEL_WHALE_ACCOUNT_ID!,
      privateKey: process.env.SENTINEL_WHALE_PRIVATE_KEY!,
    },
  },
  observer: {
    accountId: process.env.OBSERVER_ACCOUNT_ID!,
    privateKey: process.env.OBSERVER_PRIVATE_KEY!,
  },
  treasury: {
    accountId: process.env.TREASURY_ACCOUNT_ID!,
    privateKey: process.env.TREASURY_PRIVATE_KEY!,
  },
  topics: {
    intent: process.env.INTENT_TOPIC_ID!,
    signal: process.env.SIGNAL_TOPIC_ID!,
    reputation: process.env.REPUTATION_TOPIC_ID!,
  },
  tokens: {
    shield: process.env.SHIELD_TOKEN_ID!,
    reputationNft: process.env.REPUTATION_NFT_ID!,
  },
  hol: {
    registryUrl: process.env.REGISTRY_URL || 'https://moonscape.tech',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY!,
  },
};
