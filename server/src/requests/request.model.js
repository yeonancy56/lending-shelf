const mongoose = require('mongoose');

// a request: Sam asking to borrow Dune. It's never deleted, only marked cancelled, so it stays as a record
const requestSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    friend: { type: mongoose.Schema.Types.ObjectId, ref: 'Friend', required: true },
    status: { type: String, enum: ['waiting', 'cancelled'], default: 'waiting' },
    askedAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date, default: null },
});

// the database itself refuses a second waiting request for the same book. The lending rules already check this,
// but if Sam and Alex click at the same moment, both could pass that check before either is saved.
// Cancelled requests don't count, so Dune can be asked for again after Sam cancels
requestSchema.index({ book: 1 }, { unique: true, partialFilterExpression: { status: 'waiting' } });

module.exports = mongoose.model('Request', requestSchema);
