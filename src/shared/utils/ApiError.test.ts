import { describe, expect, it } from "vitest";
import ApiError from "./ApiError";

describe("ApiError", () => {
  it("sets statusCode and message and is instanceof Error", () => {
    const err = new ApiError(404, "Not found");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not found");
  });
});
