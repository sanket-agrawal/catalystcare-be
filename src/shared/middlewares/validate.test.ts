import { describe, expect, it, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validateRequest } from "./validate";

describe("validateRequest", () => {
  const testSchema = z.object({
    name: z.string().min(1, "Name is required"),
    age: z.number().min(0, "Age must be non-negative"),
  });

  function createMocks(body: any) {
    const req = { body } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;
    return { req, res, next };
  }

  it("should call next() and set parsed body when validation passes", () => {
    const { req, res, next } = createMocks({ name: "Sanket", age: 25 });
    const middleware = validateRequest(testSchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // called without arguments
    expect(req.body).toEqual({ name: "Sanket", age: 25 });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 400 with validation errors when body is invalid", () => {
    const { req, res, next } = createMocks({ name: "", age: -5 });
    const middleware = validateRequest(testSchema);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Validation failed",
        errors: expect.arrayContaining([expect.stringContaining("Name is required")]),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 400 when required fields are missing", () => {
    const { req, res, next } = createMocks({});
    const middleware = validateRequest(testSchema);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Validation failed",
        errors: expect.any(Array),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 400 when field types are wrong", () => {
    const { req, res, next } = createMocks({ name: 123, age: "not a number" });
    const middleware = validateRequest(testSchema);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("should apply transforms from the schema to req.body", () => {
    const transformSchema = z.object({
      email: z
        .string()
        .email()
        .transform((s) => s.toLowerCase()),
    });
    const { req, res, next } = createMocks({ email: "TEST@EXAMPLE.COM" });
    const middleware = validateRequest(transformSchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ email: "test@example.com" });
  });

  it("should forward non-Zod errors to next()", () => {
    // Create a schema that throws a non-Zod error
    const brokenSchema = {
      parse: () => {
        throw new Error("Unexpected internal error");
      },
    } as unknown as z.ZodType;

    const { req, res, next } = createMocks({ anything: true });
    const middleware = validateRequest(brokenSchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
  });
});
