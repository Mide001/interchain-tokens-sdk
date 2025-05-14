"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateClientNetwork = void 0;
const chains_1 = require("viem/chains");
const validateClientNetwork = (publicClient) => {
    var _a;
    const clientChainId = (_a = publicClient.chain) === null || _a === void 0 ? void 0 : _a.id;
    if (clientChainId === chains_1.baseSepolia.id) {
        return;
    }
    if (clientChainId === chains_1.optimismSepolia.id) {
        return;
    }
    if (clientChainId === chains_1.arbitrumSepolia.id) {
        return;
    }
    throw new Error("Client network is not supported");
};
exports.validateClientNetwork = validateClientNetwork;
