import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from './api/index'

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api',routes);

export default app;
