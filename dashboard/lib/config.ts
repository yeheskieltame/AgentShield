export const MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com/api/v1';

export const TOPICS = {
  intent: '0.0.8291524',
  signal: '0.0.8291525',
  reputation: '0.0.8291526',
};

export const TOKENS = {
  shield: '0.0.8291529',
  reputationNft: '0.0.8291530',
};

export const AGENTS = [
  {
    name: 'AgentShield Coordinator',
    role: 'coordinator',
    type: 'Autonomous' as const,
    operatorAccount: '0.0.7275085',
    holAccount: '0.0.8299709',
    inboundTopic: '0.0.8299711',
    outboundTopic: '0.0.8299710',
    profileTopic: '0.0.8299713',
    registrationTx: '0.0.2659396@1773992772.031475119',
  },
  {
    name: 'AgentShield Sentinel Keeper',
    role: 'sentinel-keeper',
    type: 'Autonomous' as const,
    operatorAccount: '0.0.8268231',
    holAccount: '0.0.8299715',
    inboundTopic: '0.0.8299717',
    outboundTopic: '0.0.8299716',
    profileTopic: '0.0.8299719',
    registrationTx: '0.0.2659396@1773992873.484429300',
  },
  {
    name: 'AgentShield Sentinel Arb',
    role: 'sentinel-arb',
    type: 'Autonomous' as const,
    operatorAccount: '0.0.8291404',
    holAccount: '0.0.8299726',
    inboundTopic: '0.0.8299730',
    outboundTopic: '0.0.8299729',
    profileTopic: '0.0.8299732',
    registrationTx: '0.0.2659396@1773992942.594361605',
  },
  {
    name: 'AgentShield Sentinel Whale',
    role: 'sentinel-whale',
    type: 'Autonomous' as const,
    operatorAccount: '0.0.8291411',
    holAccount: '0.0.8299734',
    inboundTopic: '0.0.8299736',
    outboundTopic: '0.0.8299735',
    profileTopic: '0.0.8299740',
    registrationTx: '0.0.2659396@1773993057.429652056',
  },
  {
    name: 'AgentShield Observer',
    role: 'observer',
    type: 'Manual' as const,
    operatorAccount: '0.0.8291431',
    holAccount: '0.0.8299742',
    inboundTopic: '0.0.8299746',
    outboundTopic: '0.0.8299745',
    profileTopic: '0.0.8299748',
    registrationTx: '0.0.2659396@1773993122.791638818',
  },
];
