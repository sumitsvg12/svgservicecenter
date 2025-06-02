const express=require('express');

const router=express.Router();

const adminController  = require('../controllers/authController');
const { ensureAdmin } = require('../middlewares/auth');

console.log("Admin Routes Loaded");

router.get('/register', adminController.showRegister);
router.post('/register', adminController.register);
router.get('/change-password', ensureAdmin, adminController.renderChangePasswordPage);
router.post('/change-password', ensureAdmin, adminController.changePassword);
router.get('/forgot-password', adminController.renderForgotPassword);
router.post('/forgot-password', adminController.handleForgotPassword);
router.get('/reset-password/:token', adminController.renderResetPasswordForm);
router.post('/reset-password/:token', adminController.resetPassword);

router.get('/login', adminController.showLogin);
router.post('/login', adminController.login);
router.get('/header',adminController.showHeader);
router.get('/dashboard', ensureAdmin, adminController.dashboard);

router.get('/add-user', ensureAdmin, adminController.showAddUser);
router.post('/add-user', ensureAdmin, adminController.addUser);
router.get('/view-users', ensureAdmin, adminController.viewUsers);
router.get('/edit-user/:id', ensureAdmin, adminController.renderEditUserPage);
router.post('/edit-user/:id', ensureAdmin, adminController.updateUser);
router.get('/deleteuser/:id',ensureAdmin,adminController.deleteUser);

router.get('/logout', ensureAdmin, adminController.logout);

module.exports=router;