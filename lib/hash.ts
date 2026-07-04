import { pbkdf2Sync, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

/**
 * Hashes a plain-text password using Node's native pbkdf2.
 * Returns salt:hash format.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plain-text password against a stored hash.
 * Supports both custom PBKDF2 hashes (salt:hash) and Supabase's Bcrypt hashes.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    // If it's a Supabase Bcrypt hash
    if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
      return bcrypt.compareSync(password, storedHash);
    }

    // Otherwise, verify using PBKDF2
    const parts = storedHash.split(":");
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const hash = pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === originalHash;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}
