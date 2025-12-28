import express from 'express'
import { OptionController } from './options.controller';
const router = express.Router();

router.post('/', OptionController.createOption);
router.put('/:id', OptionController.updateOption);
router.delete('/:id', OptionController.deleteOption);

export default router;