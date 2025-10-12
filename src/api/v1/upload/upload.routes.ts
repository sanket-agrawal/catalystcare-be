import express from 'express';
import multer from "multer";
import { uploadFile } from './upload.controller';
const router = express.Router();

router.post("/:userId", multer().single("file"), uploadFile);

export default router;