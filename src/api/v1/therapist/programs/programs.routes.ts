import express from "express";
import ProgramController from "./program.controller";

const router = express.Router();

router.post('/create',ProgramController.createProgram);
router.get('/fetch',ProgramController.fetchAllPrograms)
router.put('/update/:programId',ProgramController.updateProgram);
router.post('/publish/:programId',ProgramController.publishProgram)
router.post('/un-publish/:programId',ProgramController.unPublishProgram)
router.post('/add-plan/:programId',ProgramController.addPlanToProgram);
router.post('/publish-plan/:planId',ProgramController.publishPlan);
router.post('/un-publish-plan/:planId',ProgramController.unPublishPlan);
router.get('/bookings',ProgramController.fetchProgramBookings)

export default router;