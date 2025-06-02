const express=require('express');

const router=express.Router();
const { ensureUser } = require('../middlewares/auth');

const userController = require('../controllers/userController');

router.get('/login', userController.showLogin);
router.post('/login', userController.login);
router.get('/header',userController.showHeader);
router.get('/dashboard', ensureUser, userController.dashboard);

router.get('/password-change',ensureUser,userController.passwordchange);

// POST update password
router.post('/password-change', ensureUser, userController.updatePassword);

// Forgot password
router.get('/forgot-password', userController.forgotPasswordForm);
router.post('/forgot-password', userController.forgotPassword);

// Reset password
router.get('/reset-password/:token', userController.resetPasswordForm);
router.post('/reset-password/:token', userController.resetPassword);

router.get('/myservicepage',userController.myservicepage)
router.get('/logout',ensureUser,userController.logout);

module.exports = router;



