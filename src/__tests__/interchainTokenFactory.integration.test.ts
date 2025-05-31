import { describe, it, expect, beforeAll } from "vitest";
import {
  createWalletClient,
  createPublicClient,
  http,
  WalletClient,
  Address,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { deployInterchainTokenMulticall } from "../actions/interchainTokenFactory";
import { GenericPublicClient } from "../utils/genericPublicClient";
require("dotenv").config();

const PRIVATE_KEY = process.env.TEST_PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.TEST_RPC_URL || "https://sepolia.base.org";

// ERC20 ABI for balanceOf
const ERC20_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
]);

describe("InterchainTokenFactory Integration Tests", () => {
  let walletClient: WalletClient;
  let publicClient: GenericPublicClient;

  beforeAll(async () => {
    console.log("Setting up test environment...");
    console.log("RPC URL:", RPC_URL);

    if (!PRIVATE_KEY) {
      throw new Error("TEST_PRIVATE_KEY environment variable required");
    }

    const account = privateKeyToAccount(PRIVATE_KEY);
    const userAddress = account.address;
    console.log("Test account address:", userAddress);

    console.log("Creating wallet client...");
    walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(RPC_URL),
    });
    console.log("Wallet client created");

    console.log("Creating public client...");
    publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
    });
    console.log("Public client created");

    // Verify chain ID
    const chainId = await publicClient.getChainId();
    console.log("Connected to chain ID:", chainId.toString());
  });

  it("should deploy an interchain token on base-sepolia and optimism-sepolia using multicall", async () => {
    const name = 'Billionaire Son';
    const symbol = 'BNS';
    const decimals = 18;
    const initialSupply = 10000000; // 10 million tokens
    const minter = '0x0000000000000000000000000000000000000000' as `0x${string}`;
    const destinationChains = ['optimism-sepolia'];
    const userAddress = (await walletClient.account?.address) as `0x${string}`;

    console.log("\nStarting test deployment...");
    console.log("Token details:", {
      name,
      symbol,
      decimals,
      initialSupply,
      minter,
      expectedTotalSupply: `${initialSupply} * 10^${decimals}`,
    });
    console.log("Destination chains:", destinationChains);

    const result = await deployInterchainTokenMulticall(
      name,
      symbol,
      decimals,
      initialSupply,
      minter,
      destinationChains,
      walletClient,
      publicClient
    );

    console.log("\nDeployment completed");
    console.log("Deployment results:", {
      hash: result.hash,
      tokenDeployed: result.tokenDeployed,
    });

    // Validate the deployment result
    expect(result.hash).toBeDefined();
    expect(result.tokenDeployed).toBeDefined();

    if (result.tokenDeployed) {
      const {
        tokenId,
        tokenAddress,
        minter: deployedMinter,
        name: deployedName,
        symbol: deployedSymbol,
        decimals: deployedDecimals,
        salt,
      } = result.tokenDeployed;

      expect(tokenId).toBeDefined();
      expect(tokenAddress).toBeDefined();
      expect(deployedName).toBe(name);
      expect(deployedSymbol).toBe(symbol);
      expect(deployedDecimals).toBe(decimals);
      expect(salt).toBeDefined();

      // Verify the token contract
      console.log("\nVerifying token contract...");

      // Get token balance
      const balance = (await publicClient.readContract({
        address: tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      })) as bigint;

      const expectedBalance =
        BigInt(initialSupply) * BigInt(10) ** BigInt(decimals);
      console.log("Token balance:", {
        actual: balance.toString(),
        expected: expectedBalance.toString(),
      });

      expect(balance).toBe(expectedBalance);
    }
  }, 120000); // 2 minute timeout for cross-chain deployment
});
