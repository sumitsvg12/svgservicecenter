const Datamodel = require("../models/databasemodel")
const bcrypt = require('bcrypt');

const Admin = require('../models/Admin');

const User = require('../models/User');

module.exports.addcustomer = async (req, res) => {
    try {
        const admin = req.session.admin;
        const users = await User.find().lean();
        res.render('customers/addcustomer', { admin, users })
    } catch (err) {
        console.log("Error in rendering add customer page", err);
    }
}
module.exports.userAddCustomer = async (req, res) => {
    try {
        const admin = req.session.admin;
        const user = await User.findById(req.session.userId);
        res.render('customers/useraddcoustomer', { admin, user })
    } catch (err) {
        console.log("Error in rendering add customer page", err);
    }
}
exports.addCustomer = async (req, res, userId) => {
    try {
        const { full_name, state, email, address, city, gender, date_of_birth, mobile } = req.body;

        const newCustomer = new Datamodel({
            full_name, state, email, address, city, gender, date_of_birth, mobile, addedBy: req.session.admin._id  // Admin ID 
        });
        console.log("New Customer Data:", newCustomer);
        await newCustomer.save();
        res.redirect('/customers/admincustomers'); // Adjust route as needed
    } catch (error) {
        console.error("Admin Add Customer Error:", error);
        res.status(500).send("Internal Server Error");
    }
};
module.exports.useraddCustomer = async (req, res) => {
    try {
        const {
            full_name,
            state,
            email,
            address,
            city,
            gender,
            date_of_birth,
            mobile
        } = req.body;

        const newCustomer = new Datamodel({
            full_name,
            state,
            email,
            address,
            city,
            gender,
            date_of_birth,
            mobile,
            addedBy: req.session.userId  // User ID
        });
        console.log("New User Customer Data:", newCustomer);

        await newCustomer.save();
        res.redirect('/customers/usercustomers'); // Adjust route as needed
    } catch (error) {
        console.error("User Add Customer Error:", error);
        res.status(500).send("Internal Server Error");
    }
}

// Admin: Get All Customers

exports.getAllCustomers = async (req, res) => {
    try {
        const admin = req.session.admin;
        const users = await User.find().lean();
        const customers = await Datamodel.find().populate('addedBy');
        res.render('customers/viewcustomer', { customers, admin, users });
    } catch (err) {
        res.status(500).send('Error fetching customers');
    }
};

// Admin: Edit Customer Form
exports.editCustomerForm = async (req, res) => {
    const admin = req.session.admin;
    const users = await User.find().lean();
    const customer = await Datamodel.findById(req.params.id);
    res.render('customers/getcustomer', { customer, admin, users });
};
// Admin: Update Customer
exports.updateCustomer = async (req, res) => {
    await Datamodel.findByIdAndUpdate(req.body.dataid, req.body);
    console.log("Customer updated successfully");
    res.redirect('/customers/admincustomers');
};

// Admin: Delete Customer
exports.deleteCustomer = async (req, res) => {
    await Datamodel.findByIdAndDelete(req.params.id);
    console.log("Customer deleted successfully");
    res.redirect('/customers/admincustomers');
};

// User: Get Own Customers
exports.getUserCustomers = async (req, res) => {
    try {
        const admin = req.session.admin;
        const user = await User.findById(req.session.userId);
        const customers = await Datamodel.find({ addedBy: req.session.userId });
        console.log("User customers fetched successfully", customers);
        res.render('customers/userCustomerList', { customers, admin, user });
    } catch (err) {
        res.status(500).send('Error fetching user customers');
    }
};
// User: Edit Customer Form (only their own)
exports.editCustomerFormUser = async (req, res) => {
    console.log("Fetching customer for editing by user");
    console.log("User ID:", req.session.userId);
    console.log("Customer ID:", req.params.id);
    const admin = req.session.admin;
    const user = await User.findById(req.session.userId);
    const customer = await Datamodel.findOne({ _id: req.params.id, addedBy: req.session.userId });
    if (!customer) return res.status(403).send('Access denied');
    res.render('customers/editCustomerForm', { customer, admin, user });
};


// User: Update Own Customer
exports.updateCustomerUser = async (req, res) => {
    const customer = await Datamodel.findOne({ _id: req.params.id, addedBy: req.session.userId });
    if (!customer) return res.status(403).send('Access denied');
    await Datamodel.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/customers/usercustomers');
};
// User: Delete Own Customer
exports.deleteCustomerUser = async (req, res) => {
    const customer = await Datamodel.findOne({ _id: req.params.id, addedBy: req.session.userId });
    if (!customer) return res.status(403).send('Access denied');
    await Datamodel.findByIdAndDelete(req.params.id);
    res.redirect('/customers/usercustomers');
};
