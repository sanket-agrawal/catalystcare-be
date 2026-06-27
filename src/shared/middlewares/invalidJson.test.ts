import { describe, expect, it, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { invalidJsonHandler } from "./invalidJson";
import ApiResponse from "../utils/ApiResponse";

describe("invalidJsonHandler", () => {
  const mockReq = {} as Request;
  const mockNext = vi.fn() as NextFunction;

  function createMockRes() {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    return res;
  }

  it("should return 400 for SyntaxError with status 400 and body property", () => {
    const res = createMockRes();
    const err = new SyntaxError("Unexpected token") as any;
    err.status = 400;
    err.body = "invalid json";

    invalidJsonHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(new ApiResponse(false, 400, "Invalid JSON payload"));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next() for non-SyntaxError", () => {
    const res = createMockRes();
    const err = new Error("Something else") as any;

    invalidJsonHandler(err, mockReq, res, mockNext);

    expect(res.status).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(err);
  });

  it("should call next() for SyntaxError without status 400", () => {
    const res = createMockRes();
    const err = new SyntaxError("Some syntax error") as any;
    err.status = 500;

    invalidJsonHandler(err, mockReq, res, mockNext);

    expect(res.status).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(err);
  });

  it("should call next() for SyntaxError with status 400 but no body property", () => {
    const res = createMockRes();
    const err = new SyntaxError("Missing body") as any;
    err.status = 400;
    // no `body` property set

    invalidJsonHandler(err, mockReq, res, mockNext);

    expect(res.status).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(err);
  });
});
