// infrastructure/crypto/vent.crypto.ts
import { aiConfig } from "../../shared/config/ai.config";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(aiConfig.ventEncryptionKey!, "hex"); // 32 bytes = 64 hex chars

export function encryptContent(plaintext: string): string {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag(); // authentication tag — detects tampering

  // Store as iv:tag:ciphertext (all base64)
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

// vent.crypto.ts
export function decryptContent(stored: string): string {
  // Guard: if it doesn't look like our format (iv:tag:ciphertext), return as-is
  // This handles any plaintext rows that existed before encryption was added
  const parts = stored.split(":");
  if (parts.length !== 3) return stored;

  const [ivB64, tagB64, dataB64] = parts;
  if (!ivB64 || !tagB64 || !dataB64) return stored;

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);

  return decipher.update(data) + decipher.final("utf8");
}

// Generate a key (run once, store in env):
// node -e "console.log(crypto.randomBytes(32).toString('hex'))"