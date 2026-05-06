import { describe, expect, it } from "vitest";
import { parseCSVBuffer } from "./parseCSV";

describe("parseCSVBuffer", () => {
  it("collects valid emails, lowercases, and deduplicates", async () => {
    const csv = [
      "email,name",
      "User@Example.com,One",
      "user@example.com,Two",
      "other@test.org,Three",
    ].join("\n");

    const emails = await parseCSVBuffer(Buffer.from(csv, "utf8"));
    expect(emails).toEqual(["user@example.com", "other@test.org"]);
  });

  it("skips rows with invalid email format", async () => {
    const csv = ["email", "not-an-email", "ok@valid.com"].join("\n");
    const emails = await parseCSVBuffer(Buffer.from(csv, "utf8"));
    expect(emails).toEqual(["ok@valid.com"]);
  });

  it("rejects CSV rows without an email column", async () => {
    const csv = ["name,phone", "Jane,123"].join("\n");
    await expect(parseCSVBuffer(Buffer.from(csv, "utf8"))).rejects.toThrow(
      "CSV must contain 'email' column"
    );
  });
});
