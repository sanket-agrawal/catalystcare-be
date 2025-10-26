import express from "express";
import { availabilityController } from "./availability.controller";
import { authenticate } from "../../../../shared/middlewares/authenticatation";

const router = express.Router();
router.post('/',authenticate,availabilityController.createAvailability);

router.get('/rules',authenticate,availabilityController.getAvailabilityRules);

router.post('/generate-slots/:therapistId',authenticate,availabilityController.generateSlots);

router.put('/update/:availabilityId',authenticate,availabilityController.updateAvailability);

router.delete('/delete/:availabilityId',authenticate,availabilityController.deleteAvailability);

export default router;