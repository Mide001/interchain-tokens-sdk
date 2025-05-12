import { describe, it, expect, beforeAll } from "vitest";
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { deployInterchainToken } from "../actions/interchainTokenFactory";
require("dotenv").config();

const PRIVATE_KEY = process.env.TEST_PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.TEST_RPC_URL || "https://sepolia.base.org";

describe("InterchainTokenFactory Integration Tests", () => {
  let walletClient: any;
  let publicClient: any;

  beforeAll(async () => {
    if (!PRIVATE_KEY) {
      throw new Error("TEST_PRIVATE_KEY environment variable required");
    }

    const account = privateKeyToAccount(PRIVATE_KEY);

    walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
    });
  });

  it("should deploy an interchain token on baseSepolia", async () => {
    const name = "Interchain Test Token 1";
    const symbol = "ITT1";
    const decimals = 18;
    const initialSupply = 1000000;
    const minter = "0x0000000000000000000000000000000000000000";

    const result = await deployInterchainToken(
      name,
      symbol,
      decimals,
      initialSupply,
      minter,
      walletClient,
      publicClient
    );

    expect(result.hash).toBeDefined();
    expect(result.tokenDeployed).toBeDefined();

    if (result.tokenDeployed) {
      expect(result.tokenDeployed.name).toBe(name);
      expect(result.tokenDeployed.symbol).toBe(symbol);
      expect(result.tokenDeployed.decimals).toBe(decimals);
      expect(result.tokenDeployed.tokenAddress).toBeDefined();
      expect(result.tokenDeployed.minter).toBeDefined();
      expect(result.tokenDeployed.tokenId).toBeDefined();
    }
  }, 60000);
});
