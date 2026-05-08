import { describe, expect, it } from "vitest";
import { companyWhatsappDetails } from "./whatsapp.config";

describe("companyWhatsappDetails", () => {
  it("returns stable support link and display number", () => {
    const w = companyWhatsappDetails();
    expect(w.contactWhatsappLink).toMatch(/^http/);
    expect(w.displayNumber).toMatch(/\+91/);
    expect(w.message).toContain("Catalyst");
  });
});
