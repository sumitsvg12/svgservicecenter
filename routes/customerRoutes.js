const express = require('express');

const router = express.Router();

const customerController = require("../controllers/customerController")
const { ensureAdmin, ensureUser } = require('../middlewares/auth');





// Admin Routes
router.get('/addcustomer', customerController.addcustomer);
router.post('/admin/addcustomer',ensureAdmin,customerController.addCustomer);
router.get('/admincustomers', ensureAdmin, customerController.getAllCustomers);
router.get('/admincustomers/edit/:id', ensureAdmin, customerController.editCustomerForm);
router.post('/admincustomers/edit', ensureAdmin, customerController.updateCustomer);

router.get('/admincustomers/delete/:id', ensureAdmin, customerController.deleteCustomer);

// User Routes
router.get('/useraddcustomer',ensureUser,customerController.userAddCustomer);
router.post('/user/addcustomer',ensureUser,customerController.useraddCustomer);
router.get('/usercustomers', ensureUser, customerController.getUserCustomers);
router.get('/usercustomers/edit/:id', ensureUser, customerController.editCustomerFormUser);

router.post('/usercustomers/edit/:id', ensureUser, customerController.updateCustomerUser);

router.post('/usercustomers/delete/:id', ensureUser, customerController.deleteCustomerUser);

module.exports = router;