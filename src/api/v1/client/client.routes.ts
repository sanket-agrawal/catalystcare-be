import express from "express"
import { clientController } from "./client.controller";
import {authenticate} from '../../../shared/middlewares/authenticatation'

const router = express.Router()

router.post('/profile-update',authenticate,clientController.profileUpdate);

export default router;

