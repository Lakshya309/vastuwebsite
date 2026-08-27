import { pbkdf2Sync, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

/**
 * Hashes a plain-text password using bcrypt with 12 rounds.
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

/**
 * Verifies a plain-text password against a stored hash.
 * Supports both custom PBKDF2 hashes (salt:hash) and Supabase's Bcrypt hashes.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    // If it's a standard Bcrypt hash ($2a$, $2b$, $2y$)
    if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$") || storedHash.startsWith("$2")) {
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
