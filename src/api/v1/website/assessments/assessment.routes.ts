import express from 'express';
import { AssessmentController } from './assessment.controller';
import { validateRequest } from "../../../../shared/middlewares/validate";
import { submitAssessmentSchema } from "./assessment.dto";

const router = express.Router();

router.get('/',AssessmentController.fetchAllAssessments);
router.get('/:slug',AssessmentController.fetchAssessmentBySlug);
router.post('/submit', validateRequest(submitAssessmentSchema), AssessmentController.submitAssessment);

export default router;