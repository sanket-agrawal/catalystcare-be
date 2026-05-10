import express from "express";
import {createVentRouter} from "./text/text.routes";
import { prisma } from "../../../../infrastructure/prisma/client";
import { redisConnection } from "../../../../infrastructure/redis";

const router = express.Router();

router.use("/text", createVentRouter(redisConnection, prisma));
export default router;