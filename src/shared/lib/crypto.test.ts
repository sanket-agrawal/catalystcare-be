import { describe, expect, it, beforeEach, vi } from "vitest";
import { encryptStringGCM, decryptStringGCM, normalizeVpa, sha256Hex } from "./crypto";

vi.mock("../config/server.config", () => ({
  dataKeys: {
    DATA_KEY_V1: "base64:" + Buffer.from("a".repeat(32)).toString("base64"),
  },
}));

describe("Crypto Utilities", () => {
  describe("encryptStringGCM", () => {
    it("should encrypt a string successfully", () => {
      const plaintext = "Hello, World!";
      const result = encryptStringGCM(plaintext);

      expect(result).toHaveProperty("ciphertext");
      expect(result).toHaveProperty("iv");
      expect(result).toHaveProperty("tag");
      expect(result.iv).toBeInstanceOf(Buffer);
      expect(result.tag).toBeInstanceOf(Buffer);
      expect(result.ciphertext).toBeInstanceOf(Buffer);
      expect(result.iv.length).toBe(12); // IV for GCM should be 12 bytes
      expect(result.tag.length).toBe(16); // Auth tag should be 16 bytes
    });

    it("should produce different ciphertexts for same plaintext (due to random IV)", () => {
      const plaintext = "Same message";
      const result1 = encryptStringGCM(plaintext);
      const result2 = encryptStringGCM(plaintext);

      expect(result1.ciphertext).not.toEqual(result2.ciphertext);
      expect(result1.iv).not.toEqual(result2.iv);
      expect(result1.tag).not.toEqual(result2.tag);
    });

    it("should encrypt empty string", () => {
      const result = encryptStringGCM("");

      expect(result.ciphertext).toBeInstanceOf(Buffer);
      expect(result.iv).toBeInstanceOf(Buffer);
      expect(result.tag).toBeInstanceOf(Buffer);
    });

    it("should encrypt special characters", () => {
      const plaintext = "Special chars: !@#$%^&*()_+-=[]{}|;:',.<>?/\\";
      const result = encryptStringGCM(plaintext);

      expect(result.ciphertext).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.tag).toBeDefined();
    });

    it("should encrypt unicode characters", () => {
      const plaintext = "Unicode: 你好世界 🌍 مرحبا";
      const result = encryptStringGCM(plaintext);

      expect(result.ciphertext).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.tag).toBeDefined();
    });

    it("should encrypt long strings", () => {
      const plaintext = "x".repeat(10000);
      const result = encryptStringGCM(plaintext);

      expect(result.ciphertext).toBeDefined();
      expect(result.ciphertext.length).toBeGreaterThanOrEqual(plaintext.length);
    });
  });

  describe("decryptStringGCM", () => {
    it("should decrypt encrypted string correctly", () => {
      const plaintext = "Secret message";
      const encrypted = encryptStringGCM(plaintext);
      const decrypted = decryptStringGCM(encrypted.ciphertext, encrypted.iv, encrypted.tag);

      expect(decrypted).toBe(plaintext);
    });

    it("should decrypt empty string", () => {
      const plaintext = "";
      const encrypted = encryptStringGCM(plaintext);
      const decrypted = decryptStringGCM(encrypted.ciphertext, encrypted.iv, encrypted.tag);

      expect(decrypted).toBe(plaintext);
    });

    it("should decrypt special characters", () => {
      const plaintext = "Special: !@#$%^&*()";
      const encrypted = encryptStringGCM(plaintext);
      const decrypted = decryptStringGCM(encrypted.ciphertext, encrypted.iv, encrypted.tag);

      expect(decrypted).toBe(plaintext);
    });

    it("should fail to decrypt with wrong tag", () => {
      const plaintext = "Secret";
      const encrypted = encryptStringGCM(plaintext);
      const wrongTag = Buffer.from("0".repeat(32), "hex");

      expect(() => {
        decryptStringGCM(encrypted.ciphertext, encrypted.iv, wrongTag);
      }).toThrow();
    });

    it("should fail to decrypt with wrong IV", () => {
      const plaintext = "Secret";
      const encrypted = encryptStringGCM(plaintext);
      const wrongIV = Buffer.from("0".repeat(24), "hex");

      expect(() => {
        decryptStringGCM(encrypted.ciphertext, wrongIV, encrypted.tag);
      }).toThrow();
    });

    it("should fail to decrypt with wrong ciphertext", () => {
      const plaintext = "Secret";
      const encrypted = encryptStringGCM(plaintext);
      const modifiedCiphertext = Buffer.from(encrypted.ciphertext);
      modifiedCiphertext[0] = (modifiedCiphertext[0] + 1) % 256;

      expect(() => {
        decryptStringGCM(modifiedCiphertext, encrypted.iv, encrypted.tag);
      }).toThrow();
    });

    it("should handle unicode correctly on decryption", () => {
      const plaintext = "Unicode: 你好 🌍";
      const encrypted = encryptStringGCM(plaintext);
      const decrypted = decryptStringGCM(encrypted.ciphertext, encrypted.iv, encrypted.tag);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle large strings", () => {
      const plaintext = "x".repeat(50000);
      const encrypted = encryptStringGCM(plaintext);
      const decrypted = decryptStringGCM(encrypted.ciphertext, encrypted.iv, encrypted.tag);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe("normalizeVpa", () => {
    it("should trim whitespace", () => {
      expect(normalizeVpa("  user@upi  ")).toBe("user@upi");
    });

    it("should convert to lowercase", () => {
      expect(normalizeVpa("USER@UPI")).toBe("user@upi");
    });

    it("should trim and lowercase", () => {
      expect(normalizeVpa("  USER@UPI  ")).toBe("user@upi");
    });

    it("should handle already normalized VPA", () => {
      expect(normalizeVpa("user@upi")).toBe("user@upi");
    });

    it("should handle VPA with numbers", () => {
      expect(normalizeVpa("  USER123@UPI  ")).toBe("user123@upi");
    });

    it("should handle empty string", () => {
      expect(normalizeVpa("")).toBe("");
    });

    it("should handle only whitespace", () => {
      expect(normalizeVpa("   ")).toBe("");
    });

    it("should handle multiple spaces", () => {
      expect(normalizeVpa("   user@upi   ")).toBe("user@upi");
    });
  });

  describe("sha256Hex", () => {
    it("should generate SHA256 hash in hex format", () => {
      const input = "hello";
      const hash = sha256Hex(input);

      expect(hash).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
    });

    it("should be deterministic", () => {
      const input = "test";
      const hash1 = sha256Hex(input);
      const hash2 = sha256Hex(input);

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", () => {
      const hash1 = sha256Hex("input1");
      const hash2 = sha256Hex("input2");

      expect(hash1).not.toBe(hash2);
    });

    it("should return hex string of correct length", () => {
      const hash = sha256Hex("test");

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash.length).toBe(64); // SHA256 is 32 bytes = 64 hex chars
    });

    it("should handle empty string", () => {
      const hash = sha256Hex("");

      expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    });

    it("should handle long strings", () => {
      const input = "x".repeat(10000);
      const hash = sha256Hex(input);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should handle special characters", () => {
      const input = "!@#$%^&*()_+-=[]{}|;:',.<>?/\\";
      const hash = sha256Hex(input);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should handle unicode characters", () => {
      const input = "Unicode: 你好世界 🌍";
      const hash = sha256Hex(input);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should be case sensitive", () => {
      const hash1 = sha256Hex("ABC");
      const hash2 = sha256Hex("abc");

      expect(hash1).not.toBe(hash2);
    });
  });
});
