const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    name: {type: String, required: true },
    email: { type: String } // optional: Sam's Google email, so Sam can sign in. Kept trimmed and in small letters
});

// the database itself refuses a second friend with the same email. The friend form already checks this,
// but if I saved Sam and Alex with the same email at the same moment, both could pass that check before either is saved.
// Friends with no email don't count, so Gran and Grandad can both have none
friendSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });

module.exports = mongoose.model('Friend', friendSchema);