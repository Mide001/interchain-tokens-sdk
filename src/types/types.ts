import { Address } from "viem";

export type InterchainTokenDeployedEventArgs = {
  tokenId: `0x${string}`;
  tokenAddress: Address;
  minter: Address;
  name: string;
  symbol: string;
  decimals: number;
  salt: `0x${string}`;
};

export type TokenDeployed = {
  tokenId: string;
  tokenAddress: string;
  minter: string;
  name: string;
  symbol: string;
  decimals: number;
  salt: string;
};
