# Interchain Tokens SDK

A TypeScript SDK for managing interchain tokens across different blockchain networks. Currently supports testnet environments for Base, Optimism, and Ethereum networks.

## Supported Networks

- Base Sepolia (Testnet)
- Optimism Sepolia (Testnet)
- Ethereum Sepolia (Testnet)

## Installation

```bash
npm install interchain-tokens-sdk
```

## Usage

```typescript
import { InterchainTokensSDK } from "interchain-tokens-sdk";

// Initialize the SDK
const sdk = new InterchainTokensSDK({
  // configuration options
});
```

## Features

- Cross-chain token management between Base, Optimism, and Ethereum testnets
- Built with TypeScript
- Uses viem for Ethereum interactions
- Network validation for supported testnets

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
