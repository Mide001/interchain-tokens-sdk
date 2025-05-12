import { randomBytes } from "crypto";

/**
 * Generates a random 32-byte salt for token deployment
 * @returns A hex string representing a 32-byte salt
 */
export function generateRandomSalt(): `0x${string}` {
  const salt = randomBytes(32);
  return `0x${salt.toString("hex")}`;
} 