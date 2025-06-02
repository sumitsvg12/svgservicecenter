const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require("crypto");
const sendEmail = require('../utils/mailer');

module.exports.showRegister = async (req, res) => {
  console.log("admin page")
  res.render('admin/register');
}

module.exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await Admin.findOne({ email });
  if (existing) return res.send("Admin already exists with this email.");

  const hashed = await bcrypt.hash(password, 10);

  const newAdmin = new Admin({
    username,
    email,
    password: hashed
  });

  await newAdmin.save();
  res.redirect('/admin/login');
}
module.exports.renderChangePasswordPage = (req, res) => {
  res.render('admin/changePassword', { error: null, success: null });
};
module.exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const adminId = req.session.admin._id; // Assumes session is set on login

  try {
    const admin = await Admin.findById(adminId);
    const match = await bcrypt.compare(oldPassword, admin.password);
    if (!match) return res.render('admin/changePassword', { error: 'Old password is incorrect.', success: null });

    if (newPassword !== confirmPassword)
      return res.render('admin/changePassword', { error: 'Passwords do not match.', success: null });

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.render('admin/changePassword', { success: 'Password changed successfully.', error: null });
  } catch (err) {
    res.render('admin/changePassword', { error: 'Something went wrong.', success: null });
  }
};
module.exports.renderForgotPassword = (req, res) => {
  res.render('admin/forgotPassword', { message: null });
};


module.exports.handleForgotPassword = async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) return res.render('admin/forgotPassword', { message: 'No admin found with this email.' });

  const token = crypto.randomBytes(20).toString('hex');
  admin.resetToken = token;
  admin.resetTokenExpire = Date.now() + 3600000; // 1 hour expiry
  await admin.save();

  const resetURL = `http://localhost:9000/admin/reset-password/${token}`;
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
    to: email,
    subject: 'Password Reset Link',
    html: `<p>Click <a href="${resetURL}">here</a> to reset your password.</p>`
  });

  res.render('admin/forgotPassword', { message: 'Reset link sent to your email.' });
};
module.exports.renderResetPasswordForm = async (req, res) => {
  const admin = await Admin.findOne({
    resetToken: req.params.token,
    resetTokenExpire: { $gt: Date.now() }
  });

  if (!admin) return res.send('Reset link invalid or expired.');

  res.render('admin/resetPassword', { token: req.params.token, message: null });
};
module.exports.resetPassword = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const admin = await Admin.findOne({
    resetToken: req.params.token,
    resetTokenExpire: { $gt: Date.now() }
  });

  if (!admin) return res.send('Reset link invalid or expired.');

  if (newPassword !== confirmPassword)
    return res.render('admin/resetPassword', { token: req.params.token, message: 'Passwords do not match' });

  admin.password = await bcrypt.hash(newPassword, 10);
  admin.resetToken = undefined;
  admin.resetTokenExpire = undefined;
  await admin.save();

  res.send('Password reset successfully. <a href="/admin/login">Login</a>');
};


module.exports.showLogin = async (req, res) => {
  res.render('admin/login');
}
module.exports.login = async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  if (admin && await bcrypt.compare(password, admin.password)) {
    req.session.admin = admin;
    return res.redirect('/admin/dashboard');
  }
  res.send('Invalid credentials');
}

module.exports.dashboard = async (req, res) => {
  const users = await User.find().lean();

  users.forEach(user => {
    user.formattedDate = user.createdAt
      ? new Date(user.createdAt).toDateString()
      : 'N/A';
  });

  res.render('admin/dashboard', {
    admin: req.session.admin,
    users
  });
};
module.exports.showHeader = async (req, res) => {
  const admin = req.session.admin;
  const users = await User.find().lean();
  if (!admin) {
    return res.redirect('/admin/login');
  }
  else if (!users) {
    return res.redirect('/users/login');
  }
  else if (admin && users) {
    return res.redirect('/admin/dashboard');
  }

  res.render('partials/header', { admin, users });
}

module.exports.showAddUser = async (req, res) => {
  const admin = req.session.admin;
  const users = await User.find().lean();
  res.render('admin/addUser', { admin, users });
}

module.exports.addUser = async (req, res) => {
  try {
    const { username, email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).send('User already exists with this email.');
    }
    // Generate random password (10 characters)
    const rawPassword = generateStrongPassword(10)
    // const rawPassword = crypto.randomBytes(5).toString('hex'); // 5 bytes = 10 hex chars
    console.log(`Generated password for ${username}: ${rawPassword}`);

    // Hash the password
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    // Create new user with 'user' role
    const newUser = new User({
      username: username,
      email,
      password: hashedPassword,
      role: 'user'
    });

    await newUser.save();
    // Send Email with Login Credentials

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: 'sumitsvg2409@gmail.com',       // replace with your email
        pass: 'voebvlkfwvsgjvcs',          // use App Password (not your actual Gmail password)
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    const info = await transporter.sendMail({
      from: '"SVG Service Center" <sumitsvg2409@gmail.com>',
      to: email,
      subject: 'Your Account Credentials - SVG Service Center',
      html: `
        <h3>Welcome to SVG Service Center!</h3>
        <p>Your account has been created by an admin. Here are your login details:</p>
        <ul>
          <li><strong>Username:</strong> ${username}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${rawPassword}</li>
        </ul>
        <p>You can login here: <a href="http://localhost:3000/user/login">Login Page</a></p>
        <br>
        <p>Regards,<br>SVG Admin</p>
      `,
    });

    res.status(200).send('User registered and credentials sent via email.');

  }
  catch (err) {
    console.error('Error adding user:', error);
    res.status(500).send('Internal server error.');
  }
}
module.exports.viewUsers = async (req, res) => {
  const admin = req.session.admin;
  if (!admin) {
    return res.redirect('/admin/login');
  }

  try {
    const users = await User.find().lean();
    users.forEach(user => {
      user.formattedDate = user.createdAt
        ? new Date(user.createdAt).toDateString()
        : 'N/A';
    });

    res.render('admin/viewUsers', { admin, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal server error.');
  }
}
module.exports.renderEditUserPage = async (req, res) => {
  try {
    const admin = req.session.admin;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');
    res.render('admin/editUser', { user ,admin}); // EJS file name: editUser.ejs
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

module.exports.updateUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    await User.findByIdAndUpdate(req.params.id, { username, email, password });
    res.redirect('/admin/view-users'); // redirect to list after update
  } catch (err) {
    console.error(err);
    res.status(500).send('Update failed');
  }
};

module.exports.deleteUser=async(req,res)=>{
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    res.redirect("/admin/view-users"); // redirect to your user list page
} catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send("Internal Server Error");
}
}

module.exports.logout = async (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
}

// Generate strong password with letters, numbers, and special characters
function generateStrongPassword(length = 10) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '@#$%&*';

  const allChars = upper + lower + numbers + symbols;
  let password = '';

  // Ensure password has at least one from each category
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle password
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

