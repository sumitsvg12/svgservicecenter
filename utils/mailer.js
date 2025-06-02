
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = async function sendCredentialMail(to, password) {
  const mailOptions = {
    from: `"SVG Service Center" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Login Credentials",
    text: `You have been registered. Use this email and password to log in:\n\nEmail: ${to}\nPassword: ${password}`
  };

  await transporter.sendMail(mailOptions);
};
