// models/Income.js
const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
          required: true
    },
});

module.exports = mongoose.model('Income', incomeSchema);
