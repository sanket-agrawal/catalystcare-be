import { describe, expect, it } from "vitest";
import { comparePassword, hashOtp, hashPassword } from "./hashPassword";

describe("hashPassword / comparePassword", () => {
  it(
    "round-trips: hashed password verifies with compare",
    async () => {
    const hash = await hashPassword("secret-value");
    expect(hash).not.toBe("secret-value");
    expect(await comparePassword("secret-value", hash)).toBe(true);
    expect(await comparePassword("wrong", hash)).toBe(false);
    },
    15_000
  );
});

describe("hashOtp", () => {
  it("produces a bcrypt hash string", async () => {
    const hash = await hashOtp("123456");
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(await comparePassword("123456", hash)).toBe(true);
  });
});
