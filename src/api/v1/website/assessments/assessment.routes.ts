import express from 'express';
import { AssessmentController } from './assessment.controller';

const router = express.Router();

router.get('/',AssessmentController.fetchAllAssessments);
router.get('/:slug',AssessmentController.fetchAssessmentBySlug);

export default router;