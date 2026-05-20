import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import routes from './api/index'
import swaggerDocsRouter from "./docs/swagger.router";
import './infrastructure/redis/index'
import bullMqRouter from "./infrastructure/bullMq/index";
import { registerRepeatableJobs } from "./infrastructure/jobs/daily-jobs";
import connectMongoDB from "./infrastructure/mongodb/index";
import { register } from "./infrastructure/monitoring/metrics";
import { httpMetricsMiddleware } from "./infrastructure/monitoring/http-metrics";
import { invalidJsonHandler } from "./shared/middlewares/invalidJson";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
app.use('/api',routes);

app.use('/admin/queues',bullMqRouter);

(async () => {
  await connectMongoDB()
  await registerRepeatableJobs();
})();

export default app;
