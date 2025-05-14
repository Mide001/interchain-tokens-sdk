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
exports.deployInterchainTokenCall = deployInterchainTokenCall;
exports.deployRemoteInterchainTokenCall = deployRemoteInterchainTokenCall;
exports.getInterchainTokenDeployedFromLogs = getInterchainTokenDeployedFromLogs;
exports.estimateRemoteDeploymentGas = estimateRemoteDeploymentGas;
exports.deployInterchainToken = deployInterchainToken;
exports.deployRemoteInterchainToken = deployRemoteInterchainToken;
exports.deployInterchainTokenMulticall = deployInterchainTokenMulticall;
const viem_1 = require("viem");
const constants_1 = require("../constants/constants");
const validateClientNetwork_1 = require("../utils/validateClientNetwork");
const salt_1 = require("../utils/salt");
const axelarjs_sdk_1 = require("@axelar-network/axelarjs-sdk");
const chains_1 = require("../config/chains");
const sdk = new axelarjs_sdk_1.AxelarQueryAPI({
    environment: axelarjs_sdk_1.Environment.TESTNET,
});
function deployInterchainTokenCall(salt, name, symbol, decimals, initialSupply, minter) {
    return {
        address: constants_1.INTERCHAIN_PROXY_CONTRACT_ADDRESS,
        abi: constants_1.INTERCHAIN_PROXY_CONTRACT_ABI,
        functionName: "deployInterchainToken",
        args: [salt, name, symbol, decimals, initialSupply, minter],
    };
}
function deployRemoteInterchainTokenCall(salt, destinationChain, gasValue) {
    return {
        address: constants_1.INTERCHAIN_PROXY_CONTRACT_ADDRESS,
        abi: constants_1.INTERCHAIN_PROXY_CONTRACT_ABI,
        functionName: "deployRemoteInterchainToken",
        args: [
            "",
            salt,
            "0x0000000000000000000000000000000000000000",
            destinationChain,
            gasValue,
        ],
    };
}
function getInterchainTokenDeployedFromLogs(receipt, salt) {
    const eventLogs = (0, viem_1.parseEventLogs)({
        abi: constants_1.INTERCHAIN_PROXY_CONTRACT_ABI,
        logs: receipt.logs,
    });
    const event = eventLogs.find((log) => log.eventName === "InterchainTokenDeployed");
    if (!event) {
        return undefined;
    }
    try {
        const args = event.args;
        return {
            tokenId: args.tokenId,
            tokenAddress: args.tokenAddress,
            minter: args.minter,
            name: args.name,
            symbol: args.symbol,
            decimals: Number(args.decimals),
            salt,
        };
    }
    catch (error) {
        return undefined;
    }
}
function estimateRemoteDeploymentGas(destinationChain, executeData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            (0, chains_1.validateChain)(destinationChain);
            const chainConfig = (0, chains_1.getChainConfig)(destinationChain);
            const baseGasEstimate = chainConfig.baseGasEstimate;
            const gasFee = yield sdk.estimateGasFee("base-sepolia", destinationChain, baseGasEstimate.toString(), 1.2, "ETH", undefined, executeData, undefined);
            if (typeof gasFee === "string") {
                return BigInt(gasFee);
            }
            const estimatedGas = (baseGasEstimate * BigInt(120)) / BigInt(100);
            return estimatedGas;
        }
        catch (error) {
            console.error(`Error estimating gas for ${destinationChain}:`, error);
            return BigInt(600000);
        }
    });
}
function deployInterchainToken(name, symbol, decimals, initialSupply, minter, walletClient, publicClient) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, validateClientNetwork_1.validateClientNetwork)(publicClient);
        const salt = (0, salt_1.generateRandomSalt)();
        const call = deployInterchainTokenCall(salt, name, symbol, decimals, initialSupply, minter);
        const { request } = yield publicClient.simulateContract(Object.assign(Object.assign({}, call), { account: walletClient.account }));
        const hash = yield walletClient.writeContract(request);
        const receipt = yield publicClient.waitForTransactionReceipt({ hash });
        const tokenDeployed = getInterchainTokenDeployedFromLogs(receipt, salt);
        return {
            hash,
            tokenDeployed,
        };
    });
}
function deployRemoteInterchainToken(salt, destinationChain, gasValue, walletClient, publicClient) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, validateClientNetwork_1.validateClientNetwork)(publicClient);
        const call = deployRemoteInterchainTokenCall(salt, destinationChain, gasValue);
        const { request } = yield publicClient.simulateContract(Object.assign(Object.assign({}, call), { account: walletClient.account }));
        const hash = yield walletClient.writeContract(request);
        const receipt = yield publicClient.waitForTransactionReceipt({ hash });
        const tokenDeployed = getInterchainTokenDeployedFromLogs(receipt, salt);
        return {
            hash,
            tokenDeployed,
        };
    });
}
function deployInterchainTokenMulticall(name, symbol, decimals, initialSupply, minter, destinationChains, walletClient, publicClient) {
    return __awaiter(this, void 0, void 0, function* () {
        const chainId = BigInt(yield publicClient.getChainId());
        const currentChain = Object.entries(chains_1.SUPPORTED_CHAINS).find(([_, config]) => config.chainId === chainId);
        if (!currentChain) {
            throw new Error(`Current chain (${chainId}) is not supported. Supported chains: ${Object.entries(chains_1.SUPPORTED_CHAINS)
                .map(([name, config]) => `${name} (chain ID: ${config.chainId})`)
                .join(", ")}`);
        }
        // Filter out the current chain from destination chains if it's included
        destinationChains = destinationChains.filter((chain) => chain.toLowerCase() !== currentChain[0].toLowerCase());
        // Validate all destination chains
        destinationChains.forEach(chains_1.validateChain);
        const salt = (0, salt_1.generateRandomSalt)();
        const initialSupplyWithDecimals = BigInt(initialSupply) * BigInt(10) ** BigInt(decimals);
        const initialDeployCall = (0, viem_1.encodeFunctionData)({
            abi: constants_1.INTERCHAIN_PROXY_CONTRACT_ABI,
            functionName: "deployInterchainToken",
            args: [salt, name, symbol, decimals, initialSupplyWithDecimals, minter],
        });
        const remoteDeployCalls = yield Promise.all(destinationChains.map((chain) => __awaiter(this, void 0, void 0, function* () {
            const executeData = (0, viem_1.encodeFunctionData)({
                abi: constants_1.INTERCHAIN_PROXY_CONTRACT_ABI,
                functionName: "deployRemoteInterchainToken",
                args: [
                    "",
                    salt,
                    "0x0000000000000000000000000000000000000000",
                    chain,
                    BigInt(0),
                ],
            });
            const gasValue = yield estimateRemoteDeploymentGas(chain, executeData);
            return (0, viem_1.encodeFunctionData)({
                abi: constants_1.INTERCHAIN_PROXY_CONTRACT_ABI,
                functionName: "deployRemoteInterchainToken",
                args: [
                    "",
                    salt,
                    "0x0000000000000000000000000000000000000000",
                    chain,
                    gasValue,
                ],
            });
        })));
        const multicallData = [initialDeployCall, ...remoteDeployCalls];
        const { request } = yield publicClient.simulateContract({
            address: constants_1.INTERCHAIN_PROXY_CONTRACT_ADDRESS,
            abi: constants_1.INTERCHAIN_PROXY_CONTRACT_ABI,
            functionName: "multicall",
            args: [multicallData],
            account: walletClient.account,
        });
        const hash = yield walletClient.writeContract(request);
        const receipt = yield publicClient.waitForTransactionReceipt({ hash });
        const tokenDeployed = getInterchainTokenDeployedFromLogs(receipt, salt);
        return {
            hash,
            tokenDeployed,
        };
    });
}
