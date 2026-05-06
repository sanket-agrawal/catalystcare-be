import { describe, expect, it } from "vitest";
import {
  forgotPasswordOtpTemplate,
  otpVerificationTemplate,
  welcomeEmailTemplate,
} from "./auth";

describe("auth email templates", () => {
  it("otpVerificationTemplate embeds name and OTP", () => {
    const html = otpVerificationTemplate("Sam", "482910");
    expect(html).toContain("Hi Sam,");
    expect(html).toContain("482910");
    expect(html).toContain("OTP Verification");
  });

  it("welcomeEmailTemplate greets the user", () => {
    const html = welcomeEmailTemplate("Alex");
    expect(html).toContain("Alex");
    expect(html).toContain("Welcome to Catalyst Care");
  });

  it("forgotPasswordOtpTemplate includes OTP copy", () => {
    const html = forgotPasswordOtpTemplate("Jordan", "111222");
    expect(html).toContain("Jordan");
    expect(html).toContain("111222");
  });
});
