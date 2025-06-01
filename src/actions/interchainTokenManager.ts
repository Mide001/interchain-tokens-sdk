import {
  Address,
  WalletClient,
  SimulateContractParameters,
  // TransactionReceipt,
} from 'viem';
import {
  INTERCHAIN_PROXY_CONTRACT_ABI,
  INTERCHAIN_PROXY_CONTRACT_ADDRESS,
} from '../constants/constants.js';
import { GenericPublicClient } from '../utils/genericPublicClient.js';
import { validateClientNetwork } from '../utils/validateClientNetwork.js';
import { isERC20Token } from '../utils/validateERC20Address.js';
import { getChainConfig } from '../config/chains.js';
// import { AxelarQueryAPI, Environment } from '@axelar-network/axelarjs-sdk';

// const sdk = new AxelarQueryAPI({ environment: Environment.TESTNET });

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
