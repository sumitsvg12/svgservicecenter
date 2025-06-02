const express = require('express');

const router = express.Router();

const DOcumentController = require("../controllers/Documentadd")
const { ensureAdmin, ensureUser } = require('../middlewares/auth');
const Billing = require('../models/BillingModel');

// Admin Routes
router.get('/adddocument', ensureAdmin, DOcumentController.adddocument);
router.post('/addbilling', ensureAdmin, Billing.uploadedFiles, DOcumentController.addbilling);
router.get('/viewbillings', ensureAdmin, DOcumentController.viewbillings);
router.get('/getbilling/:id', ensureAdmin, DOcumentController.editCustomerForm);
router.post('/updatebilling', ensureAdmin, Billing.uploadedFiles, DOcumentController.updateBilling);
router.get("/deletebilling/:id", ensureAdmin, DOcumentController.deletebilling);
//user Routes //

router.get('/useradddocument', ensureUser, DOcumentController.useradddocument);
router.post('/adduserbilling', ensureUser, Billing.uploadedFiles, DOcumentController.adduserbilling);
router.get('/viewuserbillings', ensureUser, DOcumentController.viewuserbillings);
router.get('/usergetbilling/:id', ensureUser, DOcumentController.editUserBillingForm);
router.post('/userupdatebilling', ensureUser, Billing.uploadedFiles, DOcumentController.updateUserBilling);
router.get("/userdeletebilling/:id", ensureUser, DOcumentController.userdeletebilling);


//status

router.post('/billingstatus/:id', ensureAdmin, DOcumentController.updateBillingStatus);
router.get('/billingdownload/:id', ensureAdmin, DOcumentController.downloadBilling);
router.post("/paymentstatus/:id", async (req, res) => {
    const { paymentStatus } = req.body;
    try {
        await Billing.findByIdAndUpdate(req.params.id, { paymentStatus });
        res.send('payment was complaint done by me');
    } catch (err) {
        res.status(500).send("Error updating payment status");
    }
});

module.exports = router;