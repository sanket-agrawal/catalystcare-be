import express from 'express';
import { adminController } from './admin.controller';

const router = express.Router();

router.get('/therapist-profiles',adminController.fetchTherapistProfiles);
router.patch('/therapist-profiles/:profileId/approve-reject',adminController.approveRejectTherapistProfile); 

export default router;