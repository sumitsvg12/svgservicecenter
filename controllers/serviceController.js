const bcrypt = require('bcrypt');

const Admin = require('../models/Admin');

const User = require('../models/User');

const servicemodel=require("../models/servicemodels");

module.exports.services=async(req,res)=>{
    try{
        const admin = req.session.admin;
        const users = await User.find().lean();
        res.render('services/addservice',{ admin, users })
    }
    catch (err) {
        console.log("Error in creating the data", err);
    }
}

module.exports.addservice=async(req,res)=>{
    try{
        let data = await servicemodel.create(req.body);
        res.redirect("/services");
    }
    catch (err) {
        console.log("Error in creating the data", err);
    }
}

module.exports.viewservice=async(req,res)=>{
    try {
        let data = await servicemodel.find();
        res.render("services/viewservice", { data: data, });
    }
    catch (err) {
        console.log("Error in showing the data", err);
    }
}

module.exports.getservice = async (req, res) => {
    try {
        let id = req.params.id;
        let data = await servicemodel.findById(id);
        console.log(data);
        res.render("services/getservice", { data: data });
    }
    catch (err) {
        console.log("Error in showing the data", err);
    }
}
module.exports.updateservice = async (req, res) => {
    try {
        let id = req.body.dataid;
        console.log(id);
        let data = await servicemodel.findByIdAndUpdate(id, req.body);
        console.log(data);
        res.redirect("/services/viewservice");
    }
    catch (err) {
        console.log("Error in creating the data", err);
    }
}

module.exports.deleteservice = async (req, res) => {
    let id = req.params.id;
    try {
        let data = await servicemodel.findByIdAndDelete(id);
        res.redirect("/services/viewservice");
    }
    catch (err) {
        console.log("Error in creating the data", err);
    }
}
