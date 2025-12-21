import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import routes from './api/index'
import './infrastructure/redis/index'
import bullMqRouter from "./infrastructure/bullMq/index";
import { registerRepeatableJobs } from "./infrastructure/jobs/daily-jobs";
import connectMongoDB from "./infrastructure/mongodb/index";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet()); // security headers
app.use(morgan("combined")); // logging

app.use('/api',routes);

app.use('/admin/queues',bullMqRouter);

(async () => {
  await connectMongoDB()
  await registerRepeatableJobs();
})();

export default app;
