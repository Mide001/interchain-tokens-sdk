"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const interchainTokenFactory_1 = require("../actions/interchainTokenFactory");
require("dotenv").config();
const PRIVATE_KEY = process.env.TEST_PRIVATE_KEY;
const RPC_URL = process.env.TEST_RPC_URL || "https://sepolia.base.org";
// ERC20 ABI for balanceOf
const ERC20_ABI = (0, viem_1.parseAbi)([
    "function balanceOf(address owner) view returns (uint256)",
]);
(0, vitest_1.describe)("InterchainTokenFactory Integration Tests", () => {
    let walletClient;
    let publicClient;
    (0, vitest_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        console.log("Setting up test environment...");
        console.log("RPC URL:", RPC_URL);
        if (!PRIVATE_KEY) {
            throw new Error("TEST_PRIVATE_KEY environment variable required");
        }
        const account = (0, accounts_1.privateKeyToAccount)(PRIVATE_KEY);
        const userAddress = account.address;
        console.log("Test account address:", userAddress);
        console.log("Creating wallet client...");
        walletClient = (0, viem_1.createWalletClient)({
            account,
            chain: chains_1.baseSepolia,
            transport: (0, viem_1.http)(RPC_URL),
        });
        console.log("Wallet client created");
        console.log("Creating public client...");
        publicClient = (0, viem_1.createPublicClient)({
            chain: chains_1.baseSepolia,
            transport: (0, viem_1.http)(RPC_URL),
        });
        console.log("Public client created");
        // Verify chain ID
        const chainId = yield publicClient.getChainId();
        console.log("Connected to chain ID:", chainId.toString());
    }));
    (0, vitest_1.it)("should deploy an interchain token on base-sepolia and optimism-sepolia using multicall", () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const name = "Billionaire Son";
        const symbol = "BNS";
        const decimals = 18;
        const initialSupply = 10000000; // 10 million tokens
        const minter = "0x0000000000000000000000000000000000000000";
        const destinationChains = ["polygon-sepolia"];
        const userAddress = (yield ((_a = walletClient.account) === null || _a === void 0 ? void 0 : _a.address));
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
        const result = yield (0, interchainTokenFactory_1.deployInterchainTokenMulticall)(name, symbol, decimals, initialSupply, minter, destinationChains, walletClient, publicClient);
        console.log("\nDeployment completed");
        console.log("Deployment results:", {
            hash: result.hash,
            tokenDeployed: result.tokenDeployed,
        });
        // Validate the deployment result
        (0, vitest_1.expect)(result.hash).toBeDefined();
        (0, vitest_1.expect)(result.tokenDeployed).toBeDefined();
        if (result.tokenDeployed) {
            const { tokenId, tokenAddress, minter: deployedMinter, name: deployedName, symbol: deployedSymbol, decimals: deployedDecimals, salt, } = result.tokenDeployed;
            (0, vitest_1.expect)(tokenId).toBeDefined();
            (0, vitest_1.expect)(tokenAddress).toBeDefined();
            (0, vitest_1.expect)(deployedName).toBe(name);
            (0, vitest_1.expect)(deployedSymbol).toBe(symbol);
            (0, vitest_1.expect)(deployedDecimals).toBe(decimals);
            (0, vitest_1.expect)(salt).toBeDefined();
            // Verify the token contract
            console.log("\nVerifying token contract...");
            // Get token balance
            const balance = (yield publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: "balanceOf",
                args: [userAddress],
            }));
            const expectedBalance = BigInt(initialSupply) * BigInt(10) ** BigInt(decimals);
            console.log("Token balance:", {
                actual: balance.toString(),
                expected: expectedBalance.toString(),
            });
            (0, vitest_1.expect)(balance).toBe(expectedBalance);
        }
    }), 120000); // 2 minute timeout for cross-chain deployment
});
