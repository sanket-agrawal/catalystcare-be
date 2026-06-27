import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authorizeRoles } from "./rbac";
import { Request, Response } from "express";
import ApiResponse from "../utils/ApiResponse";

describe("authorizeRoles middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when no user is attached to request", () => {
    const middleware = authorizeRoles("ADMIN");

    const req = {} as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      new ApiResponse(false, 401, "Unauthorized: No user found in request")
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 when user role is not in allowed roles", () => {
    const middleware = authorizeRoles("ADMIN", "THERAPIST");

    const req = {
      user: {
        userId: "user-1",
        role: "USER",
      },
    } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      new ApiResponse(false, 403, "Access denied: Insufficient permissions")
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when user role matches one of allowed roles", () => {
    const middleware = authorizeRoles("ADMIN", "THERAPIST");

    const req = {
      user: {
        userId: "user-1",
        role: "THERAPIST",
      },
    } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return 500 and log error when an exception is thrown", () => {
    const middleware = authorizeRoles("ADMIN");

    // Force an error by passing a request that causes a type error/property access crash
    // or by overriding includes. For example, if user.role is null and we mock allowedRoles to throw
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const req = {
      // Accessing req.user will be successful, but accessing role will throw if user is a getter that throws
      get user() {
        throw new Error("Simulated database/property error");
      },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Authorization Error:",
      "Simulated database/property error"
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      new ApiResponse(false, 500, "Internal server error in role check")
    );
    expect(next).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
