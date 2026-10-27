const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    friend: { type: mongoose.Schema.Types.ObjectId, ref: 'Friend', required: true },
    lentAt: { type: Date, default: Date.now },
    returnedAt: { type: Date, default: null },
});

module.exports = mongoose.model('Loan', loanSchema);