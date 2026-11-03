const mongoose = require('mongoose');

// a request: Sam asking to borrow Dune. It's never deleted, only marked approved or cancelled, so it stays as a record
const requestSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    friend: { type: mongoose.Schema.Types.ObjectId, ref: 'Friend', required: true },
    status: { type: String, enum: ['waiting', 'approved', 'cancelled'], default: 'waiting' },
    askedAt: { type: Date, default: Date.now },
    answeredAt: { type: Date, default: null },   // when I said yes
    cancelledAt: { type: Date, default: null },
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', default: null }, // an approved request: the loan it started
});

// the database itself refuses a second waiting request for the same book. The lending rules already check this,
// but if Sam and Alex click at the same moment, both could pass that check before either is saved.
// Cancelled requests don't count, so Dune can be asked for again after Sam cancels
requestSchema.index({ book: 1 }, { unique: true, partialFilterExpression: { status: 'waiting' } });

module.exports = mongoose.model('Request', requestSchema);
