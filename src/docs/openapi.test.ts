import { afterEach, describe, expect, it, vi } from "vitest";
import { getOpenApiSpec } from "./openapi";

describe("getOpenApiSpec", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns OpenAPI 3 metadata and documented paths", () => {
    const spec = getOpenApiSpec();
    expect(spec.openapi).toBe("3.0.3");
    expect(spec.info.title).toBe("CatalystCare API");
    expect(spec.paths["/api/v1/health"]).toBeDefined();
    expect(spec.paths["/api/v1/auth/login"]).toBeDefined();
    expect(spec.components?.securitySchemes?.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
  });

  it("uses SWAGGER_SERVER_URL when set", () => {
    vi.stubEnv("SWAGGER_SERVER_URL", "https://api.example.com");
    vi.stubEnv("API_PUBLIC_URL", "https://ignored.example.com");
    const spec = getOpenApiSpec();
    expect(spec.servers[0].url).toBe("https://api.example.com");
  });
});
