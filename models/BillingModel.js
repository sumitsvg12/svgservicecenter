const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// Folder to store uploads
// const BILLING_DOCS_PATH = '/uploads/billing_docs';
const cloudinary = require('../config/cloudinary'); // adjust path

// Mongoose schema
const billingSchema = new mongoose.Schema({
    customer: {
        type: String,
        required: true
    },
    ServiceName: {
        type: String
    },
    id_proof: {
        type: String,
        required: true
    },
    address_proof: {
        type: String,
        required: true
    },
    pan_card: {
        type: String
    },
    banking: {
        type: String
    },
    photo: {
        type: String
    },
    others: {
        type: [String]
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Multer storage configuration
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
        folder: 'billing_docs',
        public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E6)}`,
        resource_type: 'auto'
    })
});

// Multer upload (fields version for multiple files)
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
        }
    }
});

billingSchema.statics.uploadedFiles = upload.fields([
    { name: 'id_proof', maxCount: 1 },
    { name: 'address_proof', maxCount: 1 },
    { name: 'banking', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'others', maxCount: 10 }
]);




const Billing = mongoose.model('Billing', billingSchema);
module.exports = Billing;
