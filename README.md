# Interchain Tokens SDK

A TypeScript SDK for deploying new tokens across multiple chains using the Axelar network. This SDK allows you to deploy a new token on one chain and automatically deploy its corresponding versions on other supported chains.

## Currently Supported Networks (Testnet Only)

- Base Sepolia
- Optimism Sepolia
- Arbitrum Sepolia

## Installation

```bash
npm install interchain-tokens-sdk
```

## Usage

```typescript
import { deployInterchainTokenMulticall, SUPPORTED_CHAINS } from "interchain-tokens-sdk";
import { createWalletClient, createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

// Create wallet and public clients for your source chain (e.g., Base Sepolia)
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(RPC_URL)
});

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL)
});

// Deploy your token across chains
const result = await deployInterchainTokenMulticall(
  tokenName,            // string: your token name
  tokenSymbol,          // string: your token symbol
  decimals,            // number: number of decimals (e.g., 18)
  initialSupply,       // number: initial token supply
  minterAddress,       // string: address that can mint tokens
  destinationChains,   // string[]: array of supported chain names
  walletClient,
  publicClient
);

// The deployment result will have this structure:
interface DeploymentResult {
  hash: `0x${string}`;              // transaction hash
  tokenDeployed?: {
    tokenId: `0x${string}`;         // unique identifier across chains
    tokenAddress: `0x${string}`;    // token contract address
    minter: `0x${string}`;          // minter address
    name: string;                   // token name
    symbol: string;                 // token symbol
    decimals: number;               // token decimals
    salt: `0x${string}`;           // deployment salt
  };
}
```

## Important Notes

1. **New Tokens Only**: This version of the SDK only supports deploying new tokens. Support for existing tokens will be added in future updates.

2. **Source Chain**: You can deploy from any of the supported chains, but make sure your wallet has enough native tokens for:
   - The deployment transaction
   - Gas fees for cross-chain messaging

3. **Destination Chains**: When specifying destination chains, use the chain identifiers exactly as follows:
   - "base-sepolia"
   - "optimism-sepolia"
   - "arbitrum-sepolia"

4. **Return Values**:
   - `hash`: The transaction hash of the deployment
   - `tokenDeployed`: Object containing the deployed token details
     - `tokenId`: Unique identifier for your token across all chains
     - `tokenAddress`: The token's contract address on the source chain
     - `minter`: Address with minting privileges
     - `name`: Token name as provided during deployment
     - `symbol`: Token symbol as provided during deployment
     - `decimals`: Token decimals as provided during deployment
     - `salt`: Unique salt used for deployment

5. **Axelar Network**: This SDK uses Axelar's infrastructure for cross-chain communication. The deployment process:
   - Deploys the token on the source chain
   - Creates token managers on destination chains
   - Sets up the cross-chain token mapping

## Development

To contribute or modify the SDK:

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build:
   ```bash
   npm run build
   ```
4. Test:
   ```bash
   npm test
   ```

## License

ISC