# Interchain Tokens SDK

A TypeScript SDK for managing interchain tokens across different blockchain networks. Currently supports testnet environments for Base, Optimism, and Ethereum networks.

## Supported Networks

- Base Sepolia (Testnet)
- Optimism Sepolia (Testnet)
- Polygon Sepolia (Testnet)

## Installation

```bash
npm install interchain-tokens-sdk
```

## Usage

```typescript
import { InterchainTokensSDK } from "interchain-tokens-sdk";
import { createWalletClient, createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

// Initialize the SDK
const sdk = new InterchainTokensSDK({
  // configuration options
});

// Create wallet and public clients
const walletClient = createWalletClient({
  account: yourAccount,
  chain: baseSepolia,
  transport: http(RPC_URL),
});

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

// Deploy an interchain token across multiple chains using multicall
const result = await sdk.deployInterchainTokenMulticall({
  name: "My Token",
  symbol: "MTK",
  decimals: 18,
  initialSupply: 1000000,
  minter: "0x0000000000000000000000000000000000000000", // Address that can mint new tokens
  destinationChains: ["optimism-sepolia", "ethereum-sepolia"], // Chains to deploy to
  walletClient,
  publicClient,
});

// Result structure
interface DeployResult {
  hash: `0x${string}`; // Transaction hash
  tokenDeployed?: {
    tokenId: `0x${string}`; // Unique identifier for the token
    tokenAddress: `0x${string}`; // Address of the deployed token contract
    minter: `0x${string}`; // Address that can mint new tokens
    name: string; // Token name
    symbol: string; // Token symbol
    decimals: number; // Token decimals
    salt: `0x${string}`; // Salt used for deployment
  };
}
```

## Features

- Cross-chain token management between Base, Optimism, and Ethereum testnets
- Built with TypeScript
- Uses viem for Ethereum interactions
- Network validation for supported testnets
- Deterministic token deployment using salt
- Event parsing for deployment confirmation
- Multicall support for deploying tokens across multiple chains in a single transaction

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Run tests:
   ```bash
   npm test
   ```

## License

ISC