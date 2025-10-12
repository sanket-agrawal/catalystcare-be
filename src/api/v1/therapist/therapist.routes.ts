import express from 'express';
import { therapistController } from './therapist.controller';
import { authenticate } from '../../../shared/middlewares/authenticatation';

const router = express.Router();

router.post('/register',authenticate, therapistController.registeration);

export default router;