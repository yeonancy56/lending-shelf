const mongoose = require('mongoose');
const STATUS = require('./request.status');

// a request: Sam asking to borrow Dune. It's never deleted, only marked approved, declined or cancelled, so it stays as a record
const requestSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    friend: { type: mongoose.Schema.Types.ObjectId, ref: 'Friend', required: true },
    status: { type: String, enum: Object.values(STATUS), default: STATUS.WAITING },
    askedAt: { type: Date, default: Date.now },
    answeredAt: { type: Date, default: null },   // when I said yes or no
    cancelledAt: { type: Date, default: null },
    note: { type: String, default: '' },           // a declined request: the few words I wrote to Sam, or empty
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', default: null }, // an approved request: the loan it started
});

// the database itself refuses a second waiting request for the same book. The lending rules already check this,
// but if Sam and Alex click at the same moment, both could pass that check before either is saved.
// Cancelled and declined requests don't count, so Dune can be asked for again after Sam cancels or I decline
requestSchema.index({ book: 1 }, { unique: true, partialFilterExpression: { status: STATUS.WAITING } });

module.exports = mongoose.model('Request', requestSchema);
