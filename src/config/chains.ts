import { Chain } from 'viem';

export interface ChainConfig {
  name: string;
  chainId: bigint;
  rpcUrl: string;
  contractAddress: `0x${string}`;
  baseGasEstimate: bigint;
  gasBuffer: bigint;
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  'base-sepolia': {
    name: 'Base Sepolia',
    chainId: BigInt(84532),
    rpcUrl: 'https://sepolia.base.org',
    contractAddress: '0x83a93500d23Fbc3e82B410aD07A6a9F7A0670D66',
    baseGasEstimate: BigInt(500000),
    gasBuffer: BigInt(100000),
  },
  'optimism-sepolia': {
    name: 'Optimism Sepolia',
    chainId: BigInt(11155420),
    rpcUrl: 'https://sepolia.optimism.io',
    contractAddress: '0x83a93500d23Fbc3e82B410aD07A6a9F7A0670D66',
    baseGasEstimate: BigInt(500000),
    gasBuffer: BigInt(100000),
  },
  'arbitrum-sepolia': {
    name: 'Arbitrum Sepolia',
    chainId: BigInt(421614),
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    contractAddress: '0x83a93500d23Fbc3e82B410aD07A6a9F7A0670D66',
    baseGasEstimate: BigInt(500000),
    gasBuffer: BigInt(100000),
  },
};

export function getChainConfig(chainName: string): ChainConfig {
  const config = SUPPORTED_CHAINS[chainName.toLowerCase()];
  if (!config) {
    throw new Error(`Chain ${chainName} is not supported. Supported chains: ${Object.keys(SUPPORTED_CHAINS).join(', ')}`);
  }
  return config;
}

export function validateChain(chainName: string): void {
  if (!SUPPORTED_CHAINS[chainName.toLowerCase()]) {
    throw new Error(`Chain ${chainName} is not supported. Supported chains: ${Object.keys(SUPPORTED_CHAINS).join(', ')}`);
  }
} 