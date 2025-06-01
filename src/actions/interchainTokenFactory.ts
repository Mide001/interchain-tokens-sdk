import {
  Address,
  WalletClient,
  SimulateContractParameters,
  TransactionReceipt,
  parseEventLogs,
  encodeFunctionData,
} from 'viem';
import {
  INTERCHAIN_PROXY_CONTRACT_ABI,
  INTERCHAIN_PROXY_CONTRACT_ADDRESS,
} from '../constants/constants.js';
import { GenericPublicClient } from '../utils/genericPublicClient.js';
import { validateClientNetwork } from '../utils/validateClientNetwork.js';
import { generateRandomSalt } from '../utils/salt.js';
import { AxelarQueryAPI, Environment } from '@axelar-network/axelarjs-sdk';
import { SUPPORTED_CHAINS, getChainConfig, validateChain, ChainConfig } from '../config/chains.js';
import { InterchainTokenDeployedEventArgs, TokenDeployed } from '../types/types.js';

const sdk = new AxelarQueryAPI({
  environment: Environment.TESTNET,
});

export function deployInterchainTokenCall(
  salt: `0x${string}`,
  name: string,
  symbol: string,
  decimals: number,
  initialSupply: number,
  minter: `0x${string}`
): SimulateContractParameters {
  return {
    address: INTERCHAIN_PROXY_CONTRACT_ADDRESS,
    abi: INTERCHAIN_PROXY_CONTRACT_ABI,
    functionName: 'deployInterchainToken',
    args: [salt, name, symbol, decimals, initialSupply, minter],
  } as const;
}

export function deployRemoteInterchainTokenCall(
  salt: `0x${string}`,
  destinationChain: string,
  gasValue: bigint
): SimulateContractParameters {
  return {
    address: INTERCHAIN_PROXY_CONTRACT_ADDRESS,
    abi: INTERCHAIN_PROXY_CONTRACT_ABI,
    functionName: 'deployRemoteInterchainToken',
    args: ['', salt, '0x0000000000000000000000000000000000000000', destinationChain, gasValue],
  } as const;
}

export function getInterchainTokenDeployedFromLogs(
  receipt: TransactionReceipt,
  salt: `0x${string}`
): InterchainTokenDeployedEventArgs | undefined {
  const eventLogs = parseEventLogs({
    abi: INTERCHAIN_PROXY_CONTRACT_ABI,
    logs: receipt.logs,
  });

  const event = eventLogs.find((log) => log.eventName === 'InterchainTokenDeployed');

  if (!event) {
    return undefined;
  }

  try {
    const args = event.args as {
      tokenId: `0x${string}`;
      tokenAddress: Address;
      minter: Address;
      name: string;
      symbol: string;
      decimals: bigint;
    };

    return {
      tokenId: args.tokenId,
      tokenAddress: args.tokenAddress,
      minter: args.minter,
      name: args.name,
      symbol: args.symbol,
      decimals: Number(args.decimals),
      salt,
    };
  } catch (error) {
    return undefined;
  }
}

export async function estimateRemoteDeploymentGas(
  sourceChainName: string,
  destinationChain: string,
  executeData: `0x${string}`
): Promise<bigint> {
  try {
    validateChain(destinationChain);
    const chainConfig = getChainConfig(destinationChain);

    const baseGasEstimate = chainConfig.baseGasEstimate;

    const gasFee = await sdk.estimateGasFee(
      sourceChainName,
      destinationChain,
      baseGasEstimate.toString(),
      1.2,
      'ETH',
      undefined,
      executeData,
      undefined
    );

    if (typeof gasFee === 'string') {
      return BigInt(gasFee);
    }

    const estimatedGas = (baseGasEstimate * BigInt(120)) / BigInt(100);

    return estimatedGas;
  } catch (error) {
    return BigInt(600000);
  }
}

export async function deployInterchainToken(
  name: string,
  symbol: string,
  decimals: number,
  initialSupply: number,
  minter: `0x${string}`,
  walletClient: WalletClient,
  publicClient: GenericPublicClient
): Promise<{
  hash: `0x${string}`;
  tokenDeployed: InterchainTokenDeployedEventArgs | undefined;
}> {
  validateClientNetwork(publicClient);
  const salt = generateRandomSalt();

  const call = deployInterchainTokenCall(salt, name, symbol, decimals, initialSupply, minter);

  const { request } = await publicClient.simulateContract({
    ...call,
    account: walletClient.account!,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const tokenDeployed = getInterchainTokenDeployedFromLogs(receipt, salt);

  return {
    hash,
    tokenDeployed,
  };
}

export async function deployRemoteInterchainToken(
  salt: `0x${string}`,
  destinationChain: string,
  gasValue: bigint,
  walletClient: WalletClient,
  publicClient: GenericPublicClient
): Promise<{
  hash: `0x${string}`;
  tokenDeployed: InterchainTokenDeployedEventArgs | undefined;
}> {
  validateClientNetwork(publicClient);

  const call = deployRemoteInterchainTokenCall(salt, destinationChain, gasValue);

  const { request } = await publicClient.simulateContract({
    ...call,
    account: walletClient.account!,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const tokenDeployed = getInterchainTokenDeployedFromLogs(receipt, salt);

  return {
    hash,
    tokenDeployed,
  };
}

export async function deployInterchainTokenMulticall(
  name: string,
  symbol: string,
  decimals: number,
  initialSupply: number,
  minter: string,
  destinationChains: string[],
  walletClient: any,
  publicClient: any
): Promise<{
  hash: string;
  tokenDeployed?: TokenDeployed;
}> {
  const chainId = BigInt(await publicClient.getChainId());

  const currentChain = Object.entries(SUPPORTED_CHAINS).find(
    ([_, config]: [string, ChainConfig]) => config.chainId === chainId
  );

  if (!currentChain) {
    throw new Error(
      `Current chain (${chainId}) is not supported. Supported chains: ${Object.entries(
        SUPPORTED_CHAINS
      )
        .map(([name, config]: [string, ChainConfig]) => `${name} (chain ID: ${config.chainId})`)
        .join(', ')}`
    );
  }
  const currentChainName = currentChain[0];

  // Filter out the current chain from destination chains
  destinationChains = destinationChains.filter(
    (chain) => chain.toLowerCase() !== currentChainName.toLowerCase()
  );

  // Validate all destination chains
  destinationChains.forEach(validateChain);

  const salt = generateRandomSalt();

  const initialSupplyWithDecimals = BigInt(initialSupply) * BigInt(10) ** BigInt(decimals);

  const initialDeployCall = encodeFunctionData({
    abi: INTERCHAIN_PROXY_CONTRACT_ABI,
    functionName: 'deployInterchainToken',
    args: [salt, name, symbol, decimals, initialSupplyWithDecimals, minter],
  });

  const remoteDeployCalls = await Promise.all(
    destinationChains.map(async (chain) => {
      const executeData = encodeFunctionData({
        abi: INTERCHAIN_PROXY_CONTRACT_ABI,
        functionName: 'deployRemoteInterchainToken',
        args: ['', salt, '0x0000000000000000000000000000000000000000', chain, BigInt(0)],
      });

      const gasValue = await estimateRemoteDeploymentGas(currentChainName, chain, executeData);

      return encodeFunctionData({
        abi: INTERCHAIN_PROXY_CONTRACT_ABI,
        functionName: 'deployRemoteInterchainToken',
        args: ['', salt, '0x0000000000000000000000000000000000000000', chain, gasValue],
      });
    })
  );

  const multicallData = [initialDeployCall, ...remoteDeployCalls];

  try {
    const { request } = await publicClient.simulateContract({
      address: INTERCHAIN_PROXY_CONTRACT_ADDRESS,
      abi: INTERCHAIN_PROXY_CONTRACT_ABI,
      functionName: 'multicall',
      args: [multicallData],
      account: walletClient.account,
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const tokenDeployed = getInterchainTokenDeployedFromLogs(receipt, salt);

    return {
      hash,
      tokenDeployed,
    };
  } catch (error) {
    throw error;
  }
}
