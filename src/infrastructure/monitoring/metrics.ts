import client from "prom-client";

export const register = new client.Registry();

// Default Node.js metrics (CPU, memory, GC, event loop)
client.collectDefaultMetrics({
  register,
  prefix: "app_",
});

// HTTP request counter
export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

// HTTP request duration
export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});
