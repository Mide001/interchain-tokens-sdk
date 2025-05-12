import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import {
  deployInterchainToken,
  deployInterchainTokenCall,
  deployRemoteInterchainToken,
  deployRemoteInterchainTokenCall,
  getInterchainTokenDeployedFromLogs,
} from "../actions/interchainTokenFactory";
import { INTERCHAIN_PROXY_CONTRACT_ADDRESS } from "../constants/constants";
import { Address, TransactionReceipt } from "viem";
import { validateClientNetwork } from "../utils/validateClientNetwork";
import { keccak256, toBytes } from "viem/utils";

vi.mock("../utils/validateClientNetwork", () => ({
  validateClientNetwork: vi.fn(),
}));

describe("InterchainTokenFactory", () => {
  const mockWalletClient = {
    account: "0x1234567890123456789012345678901234567890" as Address,
    writeContract: vi.fn(),
    chain: { id: 1 },
  };

  const mockPublicClient = {
    simulateContract: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
    estimateContractGas: vi.fn(),
    chain: { id: 1 },
    account: "0x1234567890123456789012345678901234567890" as Address,
  };

  const mockSalt =
    "0x1234567890123456789012345678901234567890123456789012345678901234";
  const mockName = "Test Token";
  const mockSymbol = "TEST";
  const mockDecimals = 18;
  const mockInitialSupply = 1000000;
  const mockMinter = "0x1234567890123456789012345678901234567890" as Address;
  const mockDestinationChain = "ethereum";
  const mockGasValue = BigInt(100000);

  beforeEach(() => {
    vi.clearAllMocks();
    (validateClientNetwork as Mock).mockReturnValue(true);
  });

  describe("deployInterchainTokenCall", () => {
    it("should return correct contract call parameters", () => {
      const result = deployInterchainTokenCall(
        mockSalt,
        mockName,
        mockSymbol,
        mockDecimals,
        mockInitialSupply,
        mockMinter
      );

      expect(result).toEqual({
        address: INTERCHAIN_PROXY_CONTRACT_ADDRESS,
        abi: expect.any(Array),
        functionName: "deployInterchainToken",
        args: [
          mockSalt,
          mockName,
          mockSymbol,
          mockDecimals,
          mockInitialSupply,
          mockMinter,
        ],
      });
    });
  });

  describe("deployRemoteInterchainTokenCall", () => {
    it("should return correct contract call parameters", () => {
      const result = deployRemoteInterchainTokenCall(
        mockSalt,
        mockDestinationChain,
        mockGasValue
      );

      expect(result).toEqual({
        address: INTERCHAIN_PROXY_CONTRACT_ADDRESS,
        abi: expect.any(Array),
        functionName: "deployRemoteInterchainToken",
        args: [mockSalt, mockDestinationChain, mockGasValue],
      });
    });
  });

  describe("getInterchainTokenDeployedFromLogs", () => {
    it("should extract token deployment event from logs", () => {
      const eventSignature = keccak256(
        toBytes(
          "InterchainTokenDeployed(bytes32,address,address,string,string,uint8)"
        )
      ) as `0x${string}`;
      const tokenId =
        "0x1234567890123456789012345678901234567890123456789012345678901234" as `0x${string}`;
      const minter = "0x1234567890123456789012345678901234567890";
      const minterTopic = ("0x" +
        "0".repeat(24) +
        minter.slice(2)) as `0x${string}`;

      const data = ("0x" +
        "0000000000000000000000001234567890123456789012345678901234567890" +
        "0000000000000000000000000000000000000000000000000000000000000040" +
        "0000000000000000000000000000000000000000000000000000000000000080" +
        "000000000000000000000000000000000000000000000000000000000000000a" +
        "0000000000000000000000000000000000000000000000000000000000000004" +
        "54657374" +
        "0000000000000000000000000000000000000000000000000000000000000000" +
        "0000000000000000000000000000000000000000000000000000000000000004" +
        "54455354" +
        "0000000000000000000000000000000000000000000000000000000000000000") as `0x${string}`;

      const mockReceipt: TransactionReceipt = {
        logs: [
          {
            address: INTERCHAIN_PROXY_CONTRACT_ADDRESS,
            topics: [eventSignature, tokenId, minterTopic],
            data: data,
            blockNumber: BigInt(1),
            blockHash:
              "0x1234567890123456789012345678901234567890123456789012345678901234",
            transactionHash:
              "0x1234567890123456789012345678901234567890123456789012345678901234",
            logIndex: 0,
            transactionIndex: 0,
            removed: false,
          },
        ],
        blockHash:
          "0x1234567890123456789012345678901234567890123456789012345678901234",
        blockNumber: BigInt(1),
        contractAddress: null,
        cumulativeGasUsed: BigInt(1),
        effectiveGasPrice: BigInt(1),
        from: "0x1234567890123456789012345678901234567890",
        gasUsed: BigInt(1),
        logsBloom: `0x${"0".repeat(512)}` as `0x${string}`,
        status: "success",
        to: "0x1234567890123456789012345678901234567890",
        transactionHash:
          "0x1234567890123456789012345678901234567890123456789012345678901234",
        transactionIndex: 0,
        type: "0x0",
      };

      const result = getInterchainTokenDeployedFromLogs(mockReceipt, mockSalt);
      expect(result).toBeDefined();
      if (result) {
        expect(result.salt).toBe(mockSalt);
      }
    });

    it("should return undefined when no deployment event is found", () => {
      const mockReceipt: TransactionReceipt = {
        logs: [],
        blockHash:
          "0x1234567890123456789012345678901234567890123456789012345678901234",
        blockNumber: BigInt(1),
        contractAddress: null,
        cumulativeGasUsed: BigInt(1),
        effectiveGasPrice: BigInt(1),
        from: "0x1234567890123456789012345678901234567890",
        gasUsed: BigInt(1),
        logsBloom: `0x${"0".repeat(512)}` as `0x${string}`,
        status: "success",
        to: "0x1234567890123456789012345678901234567890",
        transactionHash:
          "0x1234567890123456789012345678901234567890123456789012345678901234",
        transactionIndex: 0,
        type: "0x0",
      };

      const result = getInterchainTokenDeployedFromLogs(mockReceipt, mockSalt);
      expect(result).toBeUndefined();
    });
  });

  describe("deployInterchainToken", () => {
    it("should deploy an interchain token successfully", async () => {
      const mockHash =
        "0x1234567890123456789012345678901234567890123456789012345678901234";
      const mockReceipt: TransactionReceipt = {
        logs: [],
        blockHash:
          "0x1234567890123456789012345678901234567890123456789012345678901234",
        blockNumber: BigInt(1),
        contractAddress: null,
        cumulativeGasUsed: BigInt(1),
        effectiveGasPrice: BigInt(1),
        from: "0x1234567890123456789012345678901234567890",
        gasUsed: BigInt(1),
        logsBloom: `0x${"0".repeat(512)}` as `0x${string}`,
        status: "success",
        to: "0x1234567890123456789012345678901234567890",
        transactionHash: mockHash,
        transactionIndex: 0,
        type: "0x0",
      };

      mockPublicClient.simulateContract.mockResolvedValue({ request: {} });
      mockWalletClient.writeContract.mockResolvedValue(mockHash);
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await deployInterchainToken(
        mockName,
        mockSymbol,
        mockDecimals,
        mockInitialSupply,
        mockMinter,
        mockWalletClient as any,
        mockPublicClient as any
      );

      expect(result).toEqual({
        hash: mockHash,
        tokenDeployed: undefined,
      });
      expect(validateClientNetwork).toHaveBeenCalled();
    });
  });

  describe("deployRemoteInterchainToken", () => {
    it("should deploy a remote interchain token successfully", async () => {
      const mockHash =
        "0x1234567890123456789012345678901234567890123456789012345678901234";
      const mockReceipt: TransactionReceipt = {
        logs: [],
        blockHash:
          "0x1234567890123456789012345678901234567890123456789012345678901234",
        blockNumber: BigInt(1),
        contractAddress: null,
        cumulativeGasUsed: BigInt(1),
        effectiveGasPrice: BigInt(1),
        from: "0x1234567890123456789012345678901234567890",
        gasUsed: BigInt(1),
        logsBloom: `0x${"0".repeat(512)}` as `0x${string}`,
        status: "success",
        to: "0x1234567890123456789012345678901234567890",
        transactionHash: mockHash,
        transactionIndex: 0,
        type: "0x0",
      };

      mockPublicClient.simulateContract.mockResolvedValue({ request: {} });
      mockWalletClient.writeContract.mockResolvedValue(mockHash);
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await deployRemoteInterchainToken(
        mockSalt,
        mockDestinationChain,
        mockGasValue,
        mockWalletClient as any,
        mockPublicClient as any
      );

      expect(result).toEqual({
        hash: mockHash,
        tokenDeployed: undefined,
      });
      expect(validateClientNetwork).toHaveBeenCalled();
    });
  });
});
