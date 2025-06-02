const bcrypt = require('bcrypt');

const Admin = require('../models/Admin');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const Datamodel = require("../models/databasemodel");

const Billing = require('../models/BillingModel');
const archiver = require('archiver');
const fs = require("fs");
const path = require("path");


//admin//
module.exports.adddocument = async (req, res) => {
    try {
        let data = await Datamodel.find();
        const admin = req.session.admin;
        const users = await User.find().lean();
        res.render('document/adddocument', { data, admin, users });
    }
    catch (err) {
        console.log('Error in fetching data', err);
        res.status(500).send('Internal Server Error');
    }
}
module.exports.addbilling = async (req, res) => {
    try {
        let files = req.files;

        const othersFiles = files.others ? files.others.map(f => f.filename) : [];

        const billing = new Billing({
            customer: req.body.customer,
            ServiceName: req.body.ServiceName,
            pan_card: req.body.pan_card,
            id_proof: files?.id_proof?.[0]?.filename || '',
            address_proof: files?.address_proof?.[0]?.filename || '',
            banking: files.banking ? files.banking[0].filename : '',
            photo: files.photo ? files.photo[0].filename : '',
            others: othersFiles,
            addedBy: req.session.admin._id
        });

        const doc = await billing.save();
        console.log(doc);
        res.redirect('/billing/viewbillings');
    }
    catch (err) {
        console.error("Error adding billing:", err);
        res.status(500).send("Server error");
    }
}
module.exports.viewbillings = async (req, res) => {
    try {
        const admin = req.session.admin;
        const users = await User.find().lean();
        const billings = await Billing.find().populate('addedBy').lean();
        res.render('document/viewbilling', { admin, users, billings });
    }
    catch (err) {
        console.error("Error adding billing:", err);
        res.status(500).send("Server error");
    }
}
module.exports.editCustomerForm = async (req, res) => {
    try {
        const admin = req.session.admin;
        const users = await User.find().lean();
        const billings = await Billing.findById(req.params.id);
        if (!billings) {
            return res.status(404).send('Customer not found');
        }
        res.render('document/getbilling', { admin, users, billings });
    }
    catch (err) {
        console.error("Error fetching billing data:", err);
        res.status(500).send("Server error");
    }
}
module.exports.updateBilling = async (req, res) => {
    try {
        let id = req.body.billingid;
        // console.log(id);
        let billing = await Billing.findById(req.body.billingid);
        // console.log(billing)
        const files = req.files;
        // console.log(files)

        // Directory where files are stored (adjust path if needed)
        const uploadPath = path.join(__dirname, '..', 'uploads', 'billing_docs');
        // console.log(uploadPath)

        // Helper to delete old file
        function deleteOldFile(oldFileName) {
            if (oldFileName) {
                const filePath = path.join(uploadPath, oldFileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Deleted old file:', filePath);
                }
            }
        }

        if (files?.id_proof?.[0]?.filename) {
            deleteOldFile(billing.id_proof);
            billing.id_proof = files.id_proof[0].filename;
        }
        if (files?.address_proof?.[0]?.filename) {
            deleteOldFile(billing.address_proof);
            billing.address_proof = files.address_proof[0].filename;
        }

        if (files?.banking?.[0]?.filename) {
            deleteOldFile(billing.banking);
            billing.banking = files.banking[0].filename;
        }
        if (files?.photo?.[0]?.filename) {
            deleteOldFile(billing.photo);
            billing.photo = files.photo[0].filename;
        }
        if (files?.others?.length > 0) {
            billing.others.forEach(file => deleteOldFile(file));
            billing.others = files.others.map(file => file.filename);
        }
        billing.customer = req.body.customer;

        billing.ServiceName = req.body.ServiceName;
        billing.pan_card = req.body.pan_card;
        console.log(billing);
        await billing.save();
        res.redirect('/billing/viewbillings');
        console.log("bill update")
    }
    catch (err) {
        console.error("Error fetching billing data:", err);
        res.status(500).send("Server error");
    }
}
module.exports.deletebilling = async (req, res) => {
    try {
        let id = req.params.id;
        // console.log(id);
        let billing = await Billing.findById(req.params.id);
        // console.log(billing)
        if (!billing) {
            return res.status(404).send("Billing record not found.");
        }

        const uploadPath = path.join(__dirname, '..', 'uploads', 'billing_docs');
        // Helper to delete a file safely
        function deleteFile(fileName) {
            if (fileName) {
                const filePath = path.join(uploadPath, fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log("Deleted file:", filePath);
                }
            }
        }
        // Delete all files
        deleteFile(billing.id_proof);
        deleteFile(billing.address_proof);
        deleteFile(billing.banking);
        deleteFile(billing.photo);
        if (billing.others && billing.others.length > 0) {
            billing.others.forEach(file => deleteFile(file));
        }

        // Delete billing from DB
        await Billing.deleteOne({ _id: id });
        res.redirect('/billing/viewbillings');
    }
    catch (err) {
        console.error("Error deleting billing:", err);
        res.status(500).send("Server error.");
    }
}
//user//

module.exports.useradddocument = async (req, res) => {
    try {
        let data = await Datamodel.find({ addedBy: req.session.userId });
        console.log(data)
        const admin = req.session.admin;
        const user = await User.findById(req.session.userId);
        res.render('document/userdocument', { admin, user, data })
    } catch (err) {
        console.log("Error in rendering add customer page", err);
    }
}
module.exports.adduserbilling = async (req, res) => {
    try {
        let files = req.files;

        const othersFiles = files.others ? files.others.map(f => f.filename) : [];

        const billing = new Billing({
            customer: req.body.customer,
            ServiceName: req.body.ServiceName,
            pan_card: req.body.pan_card,
            id_proof: files?.id_proof?.[0]?.filename || '',
            address_proof: files?.address_proof?.[0]?.filename || '',
            banking: files.banking ? files.banking[0].filename : '',
            photo: files.photo ? files.photo[0].filename : '',
            others: othersFiles,
            addedBy: req.session.userId,

        });
        console.log("New  ducument  Data:", billing);
        const doc = await billing.save();
        console.log(doc);
        res.redirect('/billing/viewuserbillings');
    }
    catch (err) {
        console.error("Error adding billing:", err);
        res.status(500).send("Server error");
    }
}
module.exports.viewuserbillings = async (req, res) => {
    try {
        const admin = req.session.admin;
        const user = await User.findById(req.session.userId);
        const billings = await Billing.find({ addedBy: req.session.userId }).populate('addedBy').lean();
        res.render('document/userviewdocumentd', { admin, user, billings });
    }
    catch (err) {
        console.error("Error adding billing:", err);
        res.status(500).send("Server error");
    }
}
module.exports.editUserBillingForm = async (req, res) => {
    try {
        const admin = req.session.admin;
        const user = await User.findById(req.session.userId);
        const billing = await Billing.findById({ _id: req.params.id, addedBy: req.session.userId })
        if (!billing) {
            return res.status(404).send('Billing not found');
        }
        res.render('document/edituseerdocument', { admin, user, billing });
    }
    catch (err) {
        console.error("Error fetching billing data:", err);
        res.status(500).send("Server error");
    }
}
module.exports.updateUserBilling = async (req, res) => {
    try {
        let id = req.body.billingid;
        // console.log(id);
        const billing = await Billing.findOne({ _id: id, addedBy: req.session.userId });
        // console.log(billing)
        const files = req.files;
        // console.log(files)
        // Directory where files are stored (adjust path if needed)
        const uploadPath = path.join(__dirname, '..', 'uploads', 'billing_docs');
        // console.log(uploadPath)

        // Helper to delete old file
        function deleteOldFile(oldFileName) {
            if (oldFileName) {
                const filePath = path.join(uploadPath, oldFileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Deleted old file:', filePath);
                }
            }
        }
        if (files?.id_proof?.[0]?.filename) {
            deleteOldFile(billing.id_proof);
            billing.id_proof = files.id_proof[0].filename;
        }
        if (files?.address_proof?.[0]?.filename) {
            deleteOldFile(billing.address_proof);
            billing.address_proof = files.address_proof[0].filename;
        }
        if (files?.banking?.[0]?.filename) {
            deleteOldFile(billing.banking);
            billing.banking = files.banking[0].filename;
        }
        if (files?.photo?.[0]?.filename) {
            deleteOldFile(billing.photo);
            billing.photo = files.photo[0].filename;
        }
        if (files?.others?.length > 0) {
            billing.others.forEach(file => deleteOldFile(file));
            billing.others = files.others.map(file => file.filename);
        }
        billing.customer = req.body.customer;

        billing.ServiceName = req.body.ServiceName;
        billing.pan_card = req.body.pan_card;
        console.log(billing);
        await billing.save();
        res.redirect('/billing/viewuserbillings');
        console.log("bill update")
    }
    catch (err) {
        console.error("Error fetching billing data:", err);
        res.status(500).send("Server error");
    }
}

module.exports.userdeletebilling = async (req, res) => {
    try {
        let id = req.params.id;
        // console.log(id);
        const billing = await Billing.findOne({ _id: id, addedBy: req.session.userId });
        // console.log(billing)
        if (!billing) {
            return res.status(404).send("Billing record not found.");
        }
        const uploadPath = path.join(__dirname, '..', 'uploads', 'billing_docs');
        // Helper to delete a file safely
        function deleteFile(fileName) {
            if (fileName) {
                const filePath = path.join(uploadPath, fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log("Deleted file:", filePath);
                }
            }
        }
        // Delete all files
        deleteFile(billing.id_proof);
        deleteFile(billing.address_proof);
        deleteFile(billing.banking);
        deleteFile(billing.photo);
        if (billing.others && billing.others.length > 0) {
            billing.others.forEach(file => deleteFile(file));
        }

        // Delete billing from DB
        await Billing.deleteOne({ _id: id });
        res.redirect('/billing/viewuserbillings');
    }
    catch (err) {
        console.error("Error deleting billing:", err);
        res.status(500).send("Server error.");
    }
}

module.exports.updateBillingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updatedBilling = await Billing.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('addedBy');
        if (updatedBilling && updatedBilling.addedBy && updatedBilling.addedBy.email) {
            // Create transporter
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
            // Prepare mail options
            const info = await transporter.sendMail({
                from: 'sumitsvg2409@gmail.com',
                to: updatedBilling.addedBy.email,
                subject: 'Billing Status Updated ${status}',
                text: `Hello ${updatedBilling.addedBy.username || 'User'},\n\nYour billing status has been updated to: ${status}.\n\nThank you.`
            });
        }
        res.redirect('/billing/viewbillings'); // adjust if your route differs
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}

module.exports.downloadBilling = async (req, res) => {
    try {
        const billing = await Billing.findById(req.params.id);
        if (!billing) return res.status(404).send('Not Found');

        const archive = archiver('zip');
        res.attachment(`billing-${billing.customer}.zip`);
        archive.pipe(res);

        const fields = ['id_proof', 'address_proof', 'banking', 'photo'];
        fields.forEach(field => {
            const filePath = path.join(__dirname, '../uploads/billing_docs', billing[field]);
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: `${field}-${billing[field]}` });
            }
        });

        // others (array)
        billing.others.forEach(file => {
            const filePath = path.join(__dirname, '../uploads/billing_docs', file);
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: `others-${file}` });
            }
        });

        await archive.finalize();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}