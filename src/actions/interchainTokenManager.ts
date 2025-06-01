import {
  Address,
  WalletClient,
  SimulateContractParameters,
  TransactionReceipt,
  encodeFunctionData,
} from 'viem';
import {
  INTERCHAIN_PROXY_CONTRACT_ABI,
  INTERCHAIN_PROXY_CONTRACT_ADDRESS,
} from '../constants/constants.js';
import { GenericPublicClient } from '../utils/genericPublicClient.js';
import { validateClientNetwork } from '../utils/validateClientNetwork.js';
import { isERC20Token } from '../utils/validateERC20Address.js';
import { validateChain, getChainConfig, SUPPORTED_CHAINS, ChainConfig } from '../config/chains.js';
import { AxelarQueryAPI, Environment } from '@axelar-network/axelarjs-sdk';

const sdk = new AxelarQueryAPI({ environment: Environment.TESTNET });

export function registerCanonicalInterchainTokenCall(
  tokenAddress: string
): SimulateContractParameters {
  return {
    address: INTERCHAIN_PROXY_CONTRACT_ADDRESS,
    abi: INTERCHAIN_PROXY_CONTRACT_ABI,
    functionName: 'registerCanonicalInterchainToken',
    args: [tokenAddress],
  } as const;
}

export function deployRemoteCanonicalInterchainTokenCall(
  tokenAddress: Address,
  destinationChain: string,
  gasValue: bigint
): SimulateContractParameters {
  return {
    address: INTERCHAIN_PROXY_CONTRACT_ADDRESS,
    abi: INTERCHAIN_PROXY_CONTRACT_ABI,
    functionName: 'deployRemoteCanonicalInterchainToken',
    args: [tokenAddress, destinationChain, gasValue],
  } as const;
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

export async function registerCanonicalInterchainToken(
  tokenAddress: Address,
  walletClient: WalletClient,
  publicClient: GenericPublicClient
): Promise<{
  hash: `0x${string}`;
}> {
  validateClientNetwork(publicClient);

  // Validate token address first
  const isValid = await isERC20Token(tokenAddress, publicClient);
  if (!isValid) {
    const chainId = await publicClient.getChainId();
    const chainConfig = getChainConfig(chainId.toString());
    throw new Error(`${tokenAddress} not found on ${chainConfig.name}`);
  }

  const call = registerCanonicalInterchainTokenCall(tokenAddress);

  const { request } = await publicClient.simulateContract({
    ...call,
    account: walletClient.account!,
  });

  const hash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });

  return {
    hash,
  };
}

export async function deployRemoteCanonicalInterchainToken(
  tokenAddress: Address,
  destinationChain: string,
  gasValue: bigint,
  walletClient: WalletClient,
  publicClient: GenericPublicClient
): Promise<{
  hash: `0x${string}`;
  receipt: TransactionReceipt;
}> {
  validateClientNetwork(publicClient);

  const isValid = await isERC20Token(tokenAddress, publicClient);

  if (!isValid) {
    const chainId = await publicClient.getChainId();
    const chainConfig = getChainConfig(chainId.toString());
    throw new Error(`${tokenAddress} not found on ${chainConfig.name}`);
  }

  const call = deployRemoteCanonicalInterchainTokenCall(tokenAddress, destinationChain, gasValue);

  const { request } = await publicClient.simulateContract({
    ...call,
    account: walletClient.account!,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    hash,
    receipt,
  };
}

export async function registerAndDeployCanonicalInterchainTokenMulticall(
  tokenAddress: Address,
  destinationChains: string[],
  walletClient: WalletClient,
  publicClient: GenericPublicClient
): Promise<{
  hash: `0x${string}`;
}> {
  validateClientNetwork(publicClient);

  // Validate token address first
  const isValid = await isERC20Token(tokenAddress, publicClient);
  if (!isValid) {
    const chainId = await publicClient.getChainId();
    const chainConfig = getChainConfig(chainId.toString());
    throw new Error(`${tokenAddress} not found on ${chainConfig.name}`);
  }

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

  const initialRegisterCall = encodeFunctionData({
    abi: INTERCHAIN_PROXY_CONTRACT_ABI,
    functionName: 'registerCanonicalInterchainToken',
    args: [tokenAddress],
  });

  const remoteDeployCalls = await Promise.all(
    destinationChains.map(async (chain) => {
      const executeData = encodeFunctionData({
        abi: INTERCHAIN_PROXY_CONTRACT_ABI,
        functionName: 'deployRemoteCanonicalInterchainToken',
        args: [tokenAddress, chain, BigInt(0)],
      });

      const gasValue = await estimateRemoteDeploymentGas(currentChainName, chain, executeData);

      return encodeFunctionData({
        abi: INTERCHAIN_PROXY_CONTRACT_ABI,
        functionName: 'deployRemoteCanonicalInterchainToken',
        args: [tokenAddress, chain, gasValue],
      });
    })
  );

  const multicallData = [initialRegisterCall, ...remoteDeployCalls];

  try {
    const { request } = await publicClient.simulateContract({
      address: INTERCHAIN_PROXY_CONTRACT_ADDRESS,
      abi: INTERCHAIN_PROXY_CONTRACT_ABI,
      functionName: 'multicall',
      args: [multicallData],
      account: walletClient.account,
    });

    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
    };
  } catch (error) {
    throw error;
  }
}
