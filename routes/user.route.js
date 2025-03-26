import { registerController } from '../controllers/user.controller.js';

import express from 'express'

const router = express.Router();

router.get('/home', registerController) 


export default router;