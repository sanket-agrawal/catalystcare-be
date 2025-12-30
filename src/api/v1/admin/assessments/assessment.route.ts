import express from "express";
import questionRoutes from './questions/questions.routes';
import optionRoutes from './options/options.routes'
import { assessmentController } from "./assessment.controller";

const router = express.Router();

router.use('/questions',questionRoutes);
router.use('/options',optionRoutes);
router.get('/fetch-all',assessmentController.getAllAssessments);
router.post('/create',assessmentController.createAssessment);
router.put('/update/:id',assessmentController.updateAssessment);
router.put('/publish/:id',assessmentController.publishAssessment);
router.put('/unpublish/:id',assessmentController.unPublishAssessment);
router.get('/submissions/:assessmentId',assessmentController.fetchSubmissionsById);


export default router;