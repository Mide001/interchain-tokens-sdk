"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomSalt = generateRandomSalt;
const crypto_1 = require("crypto");
/**
 * Generates a random 32-byte salt for token deployment
 * @returns A hex string representing a 32-byte salt
 */
function generateRandomSalt() {
    const salt = (0, crypto_1.randomBytes)(32);
    return `0x${salt.toString("hex")}`;
}
