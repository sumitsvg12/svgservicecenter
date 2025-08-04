const bcrypt = require('bcrypt');

const Admin = require('../models/Admin');
const Billing = require('../models/BillingModel');
const User = require('../models/User');
const Datamodel = require("../models/databasemodel");
const nodemailer = require('nodemailer');
const archiver = require('archiver');
const fs = require("fs");
const path = require("path");
const axios = require('axios');
const os = require('os');


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

        const othersFiles = files.others ? files.others.map(f => f.path) : [];


        const billing = new Billing({
            customer: req.body.customer,
            ServiceName: req.body.ServiceName,
            pan_card: req.body.pan_card,
            id_proof: files?.id_proof?.[0]?.path || '',
            address_proof: files?.address_proof?.[0]?.path || '',
            banking: files.banking ? files.banking[0].path : '',
            photo: files.photo ? files.photo[0].path : '',
            others: othersFiles, // update othersFiles below
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
        const uploadPath = path.join(__dirname, '..', 'uploads', 'billing_docs'); // adjust if needed

        // console.log(uploadPath)

        // Helper to delete old file
        async function deleteFile(oldFilePath) {
            if (!oldFilePath) return;

            if (oldFilePath.startsWith('http')) {
                // Cloudinary URL
                try {
                    const parts = oldFilePath.split('/');
                    const filenameWithExt = parts.pop();
                    const publicId = filenameWithExt.split('.').slice(0, -1).join('.');
                    const uploadIndex = parts.findIndex(p => p === 'upload');
                    let publicIdPath = parts.slice(uploadIndex + 1).filter(p => !p.startsWith('v')).join('/');
                    const fullPublicId = publicIdPath ? `${publicIdPath}/${publicId}` : publicId;

                    await cloudinary.uploader.destroy(fullPublicId, function (error, result) {
                        if (error) {
                            console.error("Cloudinary deletion error:", error);
                        } else {
                            console.log("Deleted Cloudinary file:", fullPublicId);
                        }
                    });
                } catch (err) {
                    console.error("Cloudinary delete failed:", err);
                }
            } else {
                // Local file
                const filePath = path.join(uploadPath, path.basename(oldFilePath));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Deleted local file:', filePath);
                }
            }
        }


        if (files?.id_proof?.[0]?.path) {
            await deleteFile(billing.id_proof);
            billing.id_proof = files.id_proof[0].path;
        }
        if (files?.address_proof?.[0]?.path) {
            deleteFile(billing.address_proof);
            billing.address_proof = files.address_proof[0].path;
        }

        if (files?.banking?.[0]?.path) {
            deleteFile(billing.banking);
            billing.banking = files.banking[0].path;
        }
        if (files?.photo?.[0]?.path) {
            deleteFile(billing.photo);
            billing.photo = files.photo[0].path;
        }
        if (files?.others?.length > 0) {
            if (billing.others && billing.others.length > 0) {
                for (const file of billing.others) {
                    await deleteFile(file);
                }
            }
            billing.others = files.others.map(f => f.path);
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
        let files = req.files || {};

    // ✅ Step 2: Debug logs
         
    console.log("FILES RECEIVED:", files);
    console.log("Customer:", req.body.customer);

        if (!files.id_proof || !files.address_proof) {
            return res.status(400).send("Required files missing: ID Proof or Address Proof");
          }

        const othersFiles = Array.isArray(files.others) ? files.others.map(f => f.path) : [];

      // Directory where files are stored (adjust path if needed)  

        const billing = new Billing({
            customer: req.body.customer,
            ServiceName: req.body.ServiceName,
            pan_card: req.body.pan_card,
            id_proof: files.id_proof?.[0]?.path || '',
            address_proof: files.address_proof?.[0]?.path || '',
            banking: files.banking?.[0]?.path || '',
            photo: files.photo?.[0]?.path || '',
            others: othersFiles,
            addedBy: req.session.userId,
        });
 return res.status(200).send("FILE ADD SUCCESSFULL");
        const doc = await billing.save();
        console.log("Billing saved:", doc);
        res.redirect('/billing/viewuserbillings');
    } catch (err) {
        console.error("🔥 Error saving billing:", err.message);
        console.error(err.stack);
        res.status(500).send("Internal Server Error: " + err.message);
    }
};
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
        async function deleteFile(oldFilePath) {
            if (!oldFilePath) return;

            if (oldFilePath.startsWith('http')) {
                // Cloudinary URL
                try {
                    const parts = oldFilePath.split('/');
                    const filenameWithExt = parts.pop();
                    const publicId = filenameWithExt.split('.').slice(0, -1).join('.');
                    const uploadIndex = parts.findIndex(p => p === 'upload');
                    let publicIdPath = parts.slice(uploadIndex + 1).filter(p => !p.startsWith('v')).join('/');
                    const fullPublicId = publicIdPath ? `${publicIdPath}/${publicId}` : publicId;

                    await cloudinary.uploader.destroy(fullPublicId, function (error, result) {
                        if (error) {
                            console.error("Cloudinary deletion error:", error);
                        } else {
                            console.log("Deleted Cloudinary file:", fullPublicId);
                        }
                    });
                } catch (err) {
                    console.error("Cloudinary delete failed:", err);
                }
            } else {
                // Local file
                const filePath = path.join(uploadPath, path.basename(oldFilePath));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Deleted local file:', filePath);
                }
            }
        }


        if (files?.id_proof?.[0]?.path) {
            await deleteFile(billing.id_proof);
            billing.id_proof = files.id_proof[0].path;
        }
        if (files?.address_proof?.[0]?.path) {
            deleteFile(billing.address_proof);
            billing.address_proof = files.address_proof[0].path;
        }

        if (files?.banking?.[0]?.path) {
            deleteFile(billing.banking);
            billing.banking = files.banking[0].path;
        }
        if (files?.photo?.[0]?.path) {
            deleteFile(billing.photo);
            billing.photo = files.photo[0].path;
        }
        if (files?.others?.length > 0) {
            if (billing.others && billing.others.length > 0) {
                for (const file of billing.others) {
                    await deleteFile(file);
                }
            }
            billing.others = files.others.map(f => f.path);
        }

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

async function downloadFile(url, outputPath) {
    const writer = fs.createWriteStream(outputPath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}
module.exports.downloadBilling = async (req, res) => {
    try {
        const billing = await Billing.findById(req.params.id);
        if (!billing) return res.status(404).send('Not Found');

        const archive = archiver('zip', { zlib: { level: 9 } });
        res.attachment(`billing-${billing.customer}.zip`);
        archive.on('error', err => { throw err; });
        archive.pipe(res);

        // Temp folder for downloads
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'billing-'));

        // List of fields with Cloudinary URLs
        const fields = ['id_proof', 'address_proof', 'banking', 'photo'];
        // Download each file and append to archive
        for (const field of fields) {
            if (billing[field]) {
                const url = billing[field];  // Assuming billing[field] contains Cloudinary URL
                const filename = path.basename(url);
                const tempFilePath = path.join(tempDir, `${field}-${filename}`);

                await downloadFile(url, tempFilePath);
                archive.file(tempFilePath, { name: `${field}-${filename}` });
            }
        }

        // Others array
        if (billing.others && billing.others.length > 0) {
            for (const fileUrl of billing.others) {
                const filename = path.basename(fileUrl);
                const tempFilePath = path.join(tempDir, `others-${filename}`);

                await downloadFile(fileUrl, tempFilePath);
                archive.file(tempFilePath, { name: `others-${filename}` });
            }
        }

        await archive.finalize();

        // After sending zip, delete temp files and folder
        archive.on('end', () => {
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}
