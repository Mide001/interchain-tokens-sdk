import {
  Address,
  WalletClient,
  SimulateContractParameters,
  TransactionReceipt,
  parseEventLogs,
  encodeFunctionData,
} from 'viem';
import {
  INTERCHAIN_PROXY_CONTRACT_ABI,
  INTERCHAIN_PROXY_CONTRACT_ADDRESS,
} from '../constants/constants.js';
import { GenericPublicClient } from '../utils/genericPublicClient.js';
import { validateClientNetwork } from '../utils/validateClientNetwork.js';
import { SUPPORTED_CHAINS, getChainConfig, validateChain, ChainConfig } from '../config/chains.js';

// This file will contain functions for managing existing interchain tokens
// such as transfers, approvals, and other token operations 