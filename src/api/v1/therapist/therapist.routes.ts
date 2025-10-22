import express from 'express';
import { therapistController } from './therapist.controller';
import { authenticate } from '../../../shared/middlewares/authenticatation';
import availabilityRoutes from './availability/availability.routes';

const router = express.Router();

router.post('/register',authenticate, therapistController.registeration);
router.use('/availability',authenticate,availabilityRoutes);
router.get('/profile',authenticate,therapistController.profile)

export default router;