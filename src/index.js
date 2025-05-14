"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_CHAINS = exports.deployInterchainTokenMulticall = void 0;
var interchainTokenFactory_1 = require("./actions/interchainTokenFactory");
Object.defineProperty(exports, "deployInterchainTokenMulticall", { enumerable: true, get: function () { return interchainTokenFactory_1.deployInterchainTokenMulticall; } });
var chains_1 = require("./config/chains");
Object.defineProperty(exports, "SUPPORTED_CHAINS", { enumerable: true, get: function () { return chains_1.SUPPORTED_CHAINS; } });
