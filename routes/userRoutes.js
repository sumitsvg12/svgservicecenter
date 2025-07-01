const express = require('express');

const router = express.Router();
const User = require('../models/User');
const Admin = require('../models/Admin');
const Income = require('../models/daily_incomes');
const { ensureUser } = require('../middlewares/auth');

const userController = require('../controllers/userController');

router.get('/login', userController.showLogin);
router.post('/login', userController.login);
router.get('/header', userController.showHeader);
router.get('/dashboard', ensureUser, userController.dashboard);

router.get('/password-change', ensureUser, userController.passwordchange);

// POST update password
router.post('/password-change', ensureUser, userController.updatePassword);

// Forgot password
router.get('/forgot-password', userController.forgotPasswordForm);
router.post('/forgot-password', userController.forgotPassword);

// Reset password
router.get('/reset-password/:token', userController.resetPasswordForm);
router.post('/reset-password/:token', userController.resetPassword);

router.get('/myservicepage', userController.myservicepage)
router.get('/logout', ensureUser, userController.logout);

// routes/user.js
router.get('/income', async (req, res) => {
    const admin = req.session.admin;
    const user = await User.find().lean();
    const userId = req.session.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayIncome = await Income.findOne({
        user: userId,
        date: { $gte: today, $lt: tomorrow }
    });
    const allIncomes = await Income.find({ user: userId }).lean();

    const monthlySummary = {};
    allIncomes.forEach(income => {
        const date = new Date(income.date);
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${month + 1}`;
        if (!monthlySummary[key]) {
            monthlySummary[key] = 0;
        }
        monthlySummary[key] += income.amount;
    });
    const currentKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
    const monthlyIncome = monthlySummary[currentKey] || 0;

    res.render('user/income', {
        todayIncome: todayIncome?.amount || 0,
        monthlyIncome,
        monthlySummary,
        user,
        admin
    });
});


module.exports = router;




