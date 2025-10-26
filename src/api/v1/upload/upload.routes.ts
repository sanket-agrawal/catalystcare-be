import express from 'express';
import multer from "multer";
import { uploadFile } from './upload.controller';
import { authenticate } from '../../../shared/middlewares/authenticatation';
const router = express.Router();

router.post("/single",authenticate, multer().single("file"), uploadFile);

export default router;