"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_CHAINS = void 0;
exports.getChainConfig = getChainConfig;
exports.validateChain = validateChain;
exports.SUPPORTED_CHAINS = {
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
function getChainConfig(chainName) {
    const config = exports.SUPPORTED_CHAINS[chainName.toLowerCase()];
    if (!config) {
        throw new Error(`Chain ${chainName} is not supported. Supported chains: ${Object.keys(exports.SUPPORTED_CHAINS).join(', ')}`);
    }
    return config;
}
function validateChain(chainName) {
    if (!exports.SUPPORTED_CHAINS[chainName.toLowerCase()]) {
        throw new Error(`Chain ${chainName} is not supported. Supported chains: ${Object.keys(exports.SUPPORTED_CHAINS).join(', ')}`);
    }
}
