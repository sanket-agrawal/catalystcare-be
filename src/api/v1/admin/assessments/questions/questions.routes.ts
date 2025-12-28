import express from 'express';
import { QuestionController } from './questions.controller';

const router = express.Router();

router.post('/', QuestionController.createQuestion);
router.put('/:id', QuestionController.updateQuestion);
router.delete('/:id', QuestionController.deleteQuestion);

export default router;