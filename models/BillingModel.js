const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// Folder to store uploads
const BILLING_DOCS_PATH = '/uploads/billing_docs';

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
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', BILLING_DOCS_PATH));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
});

// Multer upload (fields version for multiple files)
billingSchema.statics.uploadedFiles = multer({
    storage: storage
}).fields([
    { name: 'id_proof', maxCount: 1 },
    { name: 'address_proof', maxCount: 1 },
    { name: 'banking', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'others', maxCount: 10 }
]);

billingSchema.statics.docsPath = BILLING_DOCS_PATH;

const Billing = mongoose.model('Billing', billingSchema);
module.exports = Billing;
