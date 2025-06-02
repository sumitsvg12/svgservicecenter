const User = require('../models/User');
const Admin = require('../models/Admin');
const servicemodel=require("../models/servicemodels");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

module.exports.showLogin = (req, res) => {
    res.render('user/userLogin');
}
module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login attempt with email:", email);
        console.log("Login attempt with password:", password);
        // Check if user exists
        const user = await User.findOne({ email });
        console.log("User found:", user);
        if (!user) {
            console.log("User not found with email:", email);
            return res.status(400).render('user/userLogin', { error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match status:", isMatch);
        if (!isMatch) {
            return res.status(400).render('user/userLogin', { error: 'Invalid email or password' });
        }

        // Store user in session
        req.session.userId = user._id;
        console.log("User session created with ID:", req.session.userId);
        // Redirect to dashboard
        res.redirect('/User/dashboard');
        console.log("Redirecting to user dashboard");
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}
module.exports.showHeader = async (req, res) => {
    const admin = req.session.admin;
    const users = await User.findOne({ email });
    if (!admin) {
        return res.redirect('/admin/login');
    }
    else if (!users) {
        return res.redirect('/User/login');
    }
    else if (admin && users) {
        return res.redirect('/User/dashboard');
    }

    res.render('user/header', { admin, users });
}
module.exports.dashboard = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.redirect('/user/login');
        }

        res.render('user/dashboard', { user }); // pass user to EJS
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// change password
module.exports.passwordchange = async (req, res) => {

    res.render('user/change_password');
}
module.exports.updatePassword = async (req, res) => {
    const userId = req.session.userId;
    console.log(userId)
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).send('All fields are required.');
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).send('New passwords do not match.');
    }

    try {
        const user = await User.findById(userId);
        console.log(user);
        const match = await bcrypt.compare(currentPassword, user.password);

        if (!match) {
            return res.status(401).send('Current password is incorrect.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.send('Password changed successfully.');
        return res.redirect('/User/password-change/');
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).send('Internal server error.');
    }
};

// Forgot password
module.exports.forgotPasswordForm = (req, res) => {
    res.render('user/forgot_password');
};
module.exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.send('No account with that email found.');
        const token = crypto.randomBytes(20).toString('hex');
        const expires = Date.now() + 15 * 60 * 1000; // 15 mins

        user.resetPasswordToken = token;
        user.resetPasswordExpires = expires;
        await user.save();

        const resetURL = `http://localhost:9000/User/reset-password/${token}`;

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: 'sumitsvg2409@gmail.com',
                pass: 'pkbbjadkbeiblhcw'  // Use App Password if 2FA enabled
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        const info = await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset',
            html: `<p>Click <a href="${resetURL}">here</a> to reset your password. This link expires in 15 minutes.</p>`
        });
        res.send('Password reset email sent.');
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error sending reset email.');
    }
}

// Reset password
module.exports.resetPasswordForm = async (req, res) => {
    const { token } = req.params;
    console.log(token)
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) return res.send('Password reset token is invalid or has expired.');

    res.render('user/reset_password', { token });
};
module.exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) return res.send('Passwords do not match.');

    try {
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) return res.send('Token expired or invalid.');

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        res.send('Password has been reset successfully.');
        return res.redirect('/User/password-change/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Could not reset password.');
    }
};


module.exports.myservicepage=async(req,res)=>{
    try{
        const admin = req.session.admin;
        const user = await User.findById(req.session.userId)
        let data = await servicemodel.find();
        res.render("user/viewservice", { data: data,admin,users });
    }
    catch (err) {
        console.log("Error in showing the data", err);
    }
}
module.exports.logout = async (req, res) => {
    req.session.destroy(() => {
        res.redirect('/User/login');
    });
}
