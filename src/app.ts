import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import routes from './api/index'

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet()); // security headers
app.use(morgan("combined")); // logging


app.use('/api',routes);

export default app;
