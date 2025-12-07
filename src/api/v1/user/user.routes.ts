import express from 'express';
import { updateUserProfile, userProfile } from './user.controller';
import { authenticate } from '../../../shared/middlewares/authenticatation';

const router = express.Router();

router.get('/profile',authenticate,userProfile);

router.put('/update-profile',authenticate,updateUserProfile);

export default router;