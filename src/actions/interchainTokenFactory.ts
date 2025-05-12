import {
  Address,
  WalletClient,
  SimulateContractParameters,
  TransactionReceipt,
  parseEventLogs,
} from "viem";
import {
  INTERCHAIN_PROXY_CONTRACT_ABI,
  INTERCHAIN_PROXY_CONTRACT_ADDRESS,
} from "../constants/constants";
import { GenericPublicClient } from "../utils/genericPublicClient";
import { validateClientNetwork } from "../utils/validateClientNetwork";
import { generateRandomSalt } from "../utils/salt";

export type InterchainTokenDeployedEventArgs = {
  tokenId: `0x${string}`;
  tokenAddress: Address;
  minter: Address;
  name: string;
  symbol: string;
  decimals: number;
  salt: `0x${string}`;
};

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
    functionName: "deployInterchainToken",
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
    functionName: "deployRemoteInterchainToken",
    args: [salt, destinationChain, gasValue],
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

  const event = eventLogs.find(
    (log) => log.eventName === "InterchainTokenDeployed"
  );

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
  salt: `0x${string}`,
  destinationChain: string,
  publicClient: GenericPublicClient
): Promise<bigint> {
  validateClientNetwork(publicClient);

  const call = deployRemoteInterchainTokenCall(
    salt,
    destinationChain,
    BigInt(0)
  );

  try {
    const { request } = await publicClient.simulateContract({
      ...call,
      account: publicClient.account,
    });

    const gasEstimate = await publicClient.estimateContractGas({
      ...call,
      account: publicClient.account,
    });

    return (gasEstimate * BigInt(120)) / BigInt(100);
  } catch (error) {
    console.error("Error estimating gas:", error);
    return BigInt(500000); 
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

  const call = deployInterchainTokenCall(
    salt,
    name,
    symbol,
    decimals,
    initialSupply,
    minter
  );

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

  const call = deployRemoteInterchainTokenCall(
    salt,
    destinationChain,
    gasValue
  );

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
