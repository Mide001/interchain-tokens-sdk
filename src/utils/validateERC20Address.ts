import { ERC20_ABI } from '../constants/constants.js';
import { GenericPublicClient } from './genericPublicClient.js';

interface TokenDetails {
  name: string;
  symbol: string;
  decimals: number;
}

// For UI validation - returns token details
export async function isValidERC20Token(
  tokenAddress: `0x${string}`,
  publicClient: GenericPublicClient
): Promise<TokenDetails | null> {
  try {
    const [{ result: name }, { result: symbol }, { result: decimals }] =
      (await publicClient.multicall({
        contracts: [
          {
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'name',
          },
          {
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'symbol',
          },
          {
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'decimals',
          },
        ],
      })) as [{ result: string }, { result: string }, { result: number }];

    return {
      name,
      symbol,
      decimals,
    };
  } catch (error) {
    return null;
  }
}

// Internal use only - returns boolean
export async function isERC20Token(
  tokenAddress: `0x${string}`,
  publicClient: GenericPublicClient
): Promise<boolean> {
  try {
    await publicClient.multicall({
      contracts: [
        {
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'name',
        },
        {
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'symbol',
        },
        {
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'decimals',
        },
      ],
    });
    return true;
  } catch (error) {
    return false;
  }
}
