import express from "express";
import { registerUser } from "./auth.controller";
import { validateRequest } from "../../../shared/middlewares/validate";
import { registerUserSchema } from "./auth.dto";

const router = express.Router();

router.post("/register", validateRequest(registerUserSchema), registerUser);

export default router;
