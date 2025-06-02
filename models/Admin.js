const mongoose = require("mongoose");

const AdminScheme = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true,
    },
    // 👇 ADD THESE TWO FIELDS WITH CORRECT TYPES
    resetToken: {
        type: String,
        default: null,
    },
    resetTokenExpire: {
        type: Date,
        default: null,
    }
}, {
    timeStamps: true,
});


const Admin = mongoose.model("Admin", AdminScheme);


module.exports = Admin;