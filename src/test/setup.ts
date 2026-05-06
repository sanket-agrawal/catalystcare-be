import { vi } from "vitest";

/**
 * Prevent real Redis connections during unit tests (e.g. CI before Docker brings Redis up).
 * Any file that imports `infrastructure/redis` gets this stub.
 */
vi.mock("../infrastructure/redis/index", () => ({
  redisConnection: {
    on: vi.fn(),
    disconnect: vi.fn(),
    quit: vi.fn().mockResolvedValue("OK"),
    status: "ready",
  },
}));
