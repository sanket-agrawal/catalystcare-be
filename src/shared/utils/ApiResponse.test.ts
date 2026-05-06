import { describe, expect, it } from "vitest";
import ApiResponse from "./ApiResponse";

describe("ApiResponse", () => {
  it("stores success, statusCode, message, and optional data", () => {
    const ok = new ApiResponse(true, 200, "OK", { id: 1 });
    expect(ok.success).toBe(true);
    expect(ok.statusCode).toBe(200);
    expect(ok.message).toBe("OK");
    expect(ok.data).toEqual({ id: 1 });
  });

  it("omits data property when data is undefined", () => {
    const res = new ApiResponse(false, 400, "Bad request");
    expect(res.success).toBe(false);
    expect("data" in res).toBe(false);
  });
});
