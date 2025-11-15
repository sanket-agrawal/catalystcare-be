import crypto from "crypto";
import { dataKeys } from "../config/server.config";

function getKeyFromEnv(varName = 'DATA_KEY_V1') : Buffer{
    const val = dataKeys.DATA_KEY_V1;
    const b64 = val.startsWith('base64') ? val.slice(7) : val;
    const key = Buffer.from(b64,'base64');
    if(key.length !== 32) throw new Error(`${varName} must be decoded to 32 bytes`);
    return key;
}

export function encryptStringGCM(plaintext: string, keyVersion = 1) {
  const key = getKeyFromEnv(`DATA_KEY_V${keyVersion}`);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext, iv, tag };
}

export function decryptStringGCM(ciphertext: Buffer, iv: Buffer, tag: Buffer, keyVersion = 1): string {
  const key = getKeyFromEnv(`DATA_KEY_V${keyVersion}`);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  return plaintext;
}

export function normalizeVpa(vpa: string): string {
  return vpa.trim().toLowerCase();
}

export function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}
