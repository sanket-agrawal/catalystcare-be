import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticate } from "./authenticatation";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import ApiResponse from "../utils/ApiResponse";

describe("authenticate middleware", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.JWT_SECRET = "test-secret";
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return 401 when Authorization header is missing", () => {
    const req = {
      headers: {},
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      new ApiResponse(false, 401, "Unauthorized: Missing or invalid token")
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when Authorization header does not start with Bearer", () => {
    const req = {
      headers: {
        authorization: "Basic token123",
      },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      new ApiResponse(false, 401, "Unauthorized: Missing or invalid token")
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 and log error when JWT_SECRET is not configured", () => {
    delete process.env.JWT_SECRET;
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const req = {
      headers: {
        authorization: "Bearer validtoken",
      },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    authenticate(req, res, next);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Authentication Error:",
      "JWT_SECRET not configured"
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      new ApiResponse(false, 401, "Unauthorized: Invalid or expired token")
    );
    expect(next).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should return 401 when token is invalid or expired", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const req = {
      headers: {
        authorization: "Bearer invalidtoken",
      },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      new ApiResponse(false, 401, "Unauthorized: Invalid or expired token")
    );
    expect(next).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should call next and populate req.user when token is valid", () => {
    const payload = { userId: "user-123", role: "USER" };
    const token = jwt.sign(payload, "test-secret");

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    authenticate(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe("user-123");
    expect(req.user.role).toBe("USER");
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
