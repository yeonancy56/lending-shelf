const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    friend: { type: mongoose.Schema.Types.ObjectId, ref: 'Friend', required: true },
    lentAt: { type: Date, default: Date.now },
    returnedAt: { type: Date, default: null },
});

// the database itself refuses a second active loan for the same book. The lending rules already check this,
// but if my lend form and my Approve button lend Dune at the same moment, both could pass that check before either is saved.
// Returned loans don't count, so Dune can be lent again once it comes back
loanSchema.index({ book: 1 }, { unique: true, partialFilterExpression: { returnedAt: { $type: 'null' } } });

module.exports = mongoose.model('Loan', loanSchema);