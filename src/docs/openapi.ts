/**
 * OpenAPI 3 document for Swagger UI. Extend `paths` and `components` as routes are documented.
 */
export function getOpenApiSpec() {
  const host =
    process.env.SWAGGER_SERVER_URL ||
    process.env.API_PUBLIC_URL ||
    `http://localhost:${process.env.PORT || 4000}`;

  return {
    openapi: "3.0.3",
    info: {
      title: "CatalystCare API",
      version: "1.0.0",
      description:
        "Backend HTTP API. Use **Authorize** and a `Bearer <JWT>` token for protected routes.",
    },
    servers: [{ url: host, description: "Current environment" }],
    tags: [
      { name: "Health", description: "Service health" },
      { name: "Auth", description: "Registration, login, password flows" },
    ],
    paths: {
      "/api/v1/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          description:
            "Returns server status, database and redis connectivity, uptime, timestamp, and memory usage.",
          responses: {
            "200": {
              description: "Service is healthy and all dependencies are operational",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiSuccessHealth" },
                },
              },
            },
            "503": {
              description: "Service degraded or dependency check failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiSuccessHealth" },
                },
              },
            },
            "500": {
              description: "Health check failed with internal error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorBody" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          description:
            "Authenticate with email and password; returns tokens in the app-specific response body.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiSuccessGeneric" },
                },
              },
            },
            "400": {
              description: "Validation or auth error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorBody" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "user@example.com" },
            password: { type: "string", format: "password", example: "••••••••" },
          },
        },
        ApiSuccessHealth: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 200 },
            message: { type: "string", example: "Health Check Performed Successfully" },
            data: {
              type: "object",
              properties: {
                status: { type: "string", example: "Healthy" },
                server: { type: "string", example: "ok" },
                database: { type: "string", example: "ok" },
                redis: { type: "string", example: "ok" },
                timestamp: { type: "string", example: "2026-09-25T17:50:00.000Z" },
                uptime: { type: "integer", example: 3600 },
                upTime: { type: "number", example: 3600.123 },
                timeStamp: { type: "integer", example: 1727286600000 },
                memory: {
                  type: "object",
                  properties: {
                    rss: { type: "string", example: "128 MB" },
                    heapUsed: { type: "string", example: "64 MB" },
                    heapTotal: { type: "string", example: "96 MB" },
                  },
                },
              },
            },
          },
        },
        ApiSuccessGeneric: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer" },
            message: { type: "string" },
            data: { type: "object", additionalProperties: true },
          },
        },
        ApiErrorBody: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            statusCode: { type: "integer" },
            message: { type: "string" },
          },
        },
      },
    },
  };
}
