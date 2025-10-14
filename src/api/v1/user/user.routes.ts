import express from 'express';
import { userProfile } from './user.controller';
import { authenticate } from '../../../shared/middlewares/authenticatation';

const router = express.Router();

router.get('/profile',authenticate,userProfile);

export default router;