import express from 'express';
import { therapistController } from './therapist.controller';
import { authenticate } from '../../../shared/middlewares/authenticatation';
import availabilityRoutes from './availability/availability.routes';
import { authorizeRoles } from '../../../shared/middlewares/rbac';
import { validateRequest } from '../../../shared/middlewares/validate';
import { upiVpaSchema } from './therapist.dto';

const router = express.Router();

router.post('/register',authenticate, authorizeRoles('THERAPIST'),therapistController.registeration);
router.use('/availability',authenticate,authorizeRoles('THERAPIST'),availabilityRoutes);
router.get('/profile',authenticate,authorizeRoles('THERAPIST'),therapistController.profile);
router.get('/bookings',authenticate,authorizeRoles('THERAPIST'),therapistController.fetchBookings)
router.post('/set-vpa',authenticate,authorizeRoles('THERAPIST'),validateRequest(upiVpaSchema),therapistController.setUPIVPA);
router.get('/fetch-masked-vpa',authenticate,authorizeRoles('THERAPIST'),therapistController.fetchMaskedVPA);
router.get('/billing-dashboard',authenticate,authorizeRoles('THERAPIST'),therapistController.therapistBillingDashboard)

export default router;