
import { forgetpasswordController, loginUser, logoutController, registerController,resetPasswordController,verifyController,userProfileController } from '../controllers/user.controller.js';
import checkIfLoggedIn from '../middleware/auth.middleware.js';

import express from 'express'

const router = express.Router();

router.post('/register', registerController) 
router.get('/verify/:token', verifyController)
router.post('/login', loginUser)
router.post('/forgetpassword',checkIfLoggedIn, forgetpasswordController)
router.get('/resetpassword/:token',checkIfLoggedIn, resetPasswordController)
router.get('/logout',checkIfLoggedIn, logoutController);
router.get('/profile',checkIfLoggedIn, userProfileController)

export default router;