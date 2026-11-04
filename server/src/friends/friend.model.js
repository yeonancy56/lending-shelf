const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    name: {type: String, required: true },
    email: { type: String }, // optional: Sam's Google email, so Sam can sign in. Kept trimmed and in small letters
    username: { type: String }, // optional: what Gran types to sign in without Google. Kept trimmed and in small letters
    // optional: Gran's password, scrambled with bcrypt. The password itself is never saved.
    // select: false = left behind whenever a friend is loaded, like Sam's name on a loan, unless friend.dao.js asks for it
    passwordHash: { type: String, select: false },
});

// the database itself refuses a second friend with the same email. The friend form already checks this,
// but if I saved Sam and Alex with the same email at the same moment, both could pass that check before either is saved.
// Friends with no email don't count, so Gran and Grandad can both have none
friendSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
// the same for usernames, so a username always means one friend
friendSchema.index({ username: 1 }, { unique: true, partialFilterExpression: { username: { $type: 'string' } } });

// when the friends code sends a friend to the page, the scrambled password stays here.
// The page only hears whether there is one, so Sam's panel can say "Has a password"
friendSchema.set('toJSON', {
    transform: (doc, friend) => {
        friend.hasPassword = Boolean(friend.passwordHash);
        delete friend.passwordHash;
        return friend;
    },
});

module.exports = mongoose.model('Friend', friendSchema);
