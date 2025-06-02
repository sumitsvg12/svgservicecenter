const express = require("express");
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require("path");
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const cors = require('cors');
const alert = require("alert-node");
// const db=require("./config/db");
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Middlewares
app.use(express.urlencoded());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("assets"));
app.use('/uploads/billing_docs', express.static(path.join(__dirname, 'uploads/billing_docs')));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
}));

const port = 9000;

app.use((req, res, next) => {
    res.locals.admin = req.session.user; // Example for EJS
    req.user = req.session.user;         // Makes it accessible in middleware
    next();
});
// Routes

app.use("/admin", require("./routes/authRoutes"));
app.use("/services", require("./routes/serviceRoutes"));
app.use("/customers", require("./routes/customerRoutes"));
app.use("/User", require("./routes/userRoutes"));
app.use("/billing", require("./routes/Documentadd"));
app.get('/', (req, res) => res.redirect('/admin/login'));
app.post('/notify-admin', async (req, res) => {
    const { index } = req.body;
    const nodemailer = require('nodemailer');
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
        from: 'sumitsvg2409@gmail.com',
        to: 'sumitsvg2409@gmail.com',
        subject: 'QR Payment Scanned',
        text: `Customer with index ${index} has scanned the QR and clicked Close. Please verify the payment.`
    })
    try {

        res.json({ success: true, message: 'Notification sent to admin.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to notify admin.' });
    }
})

app.listen(port, (err) => {
    if (err) {
        console.log("Error in running the server", err);
        return false;
    }
    console.log("Server is running on port:", port);
});
