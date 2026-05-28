import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./api/index";
import swaggerDocsRouter from "./docs/swagger.router";
import "./infrastructure/redis/index";
import bullMqRouter from "./infrastructure/bullMq/index";
import { registerRepeatableJobs } from "./infrastructure/jobs/daily-jobs";
import connectMongoDB from "./infrastructure/mongodb/index";
import { register } from "./infrastructure/monitoring/metrics";
import { httpMetricsMiddleware } from "./infrastructure/monitoring/http-metrics";
import { invalidJsonHandler } from "./shared/middlewares/invalidJson";
import { allowedOrigins } from "./shared/config/cors.config";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin
      // (mobile apps, curl, Postman, server-to-server)

      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(invalidJsonHandler);
// Relaxed CSP so Swagger UI can run inline scripts/styles. Tighten if docs are dev-only.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://validator.swagger.io"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
      },
    },
  })
);
app.use(morgan("combined")); // logging

app.use(httpMetricsMiddleware);

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/api/docs", swaggerDocsRouter);
app.use("/api", routes);

app.use("/admin/queues", bullMqRouter);

(async () => {
  await connectMongoDB();
  await registerRepeatableJobs();
})();

export default app;
