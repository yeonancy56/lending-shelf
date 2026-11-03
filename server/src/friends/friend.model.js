const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    name: {type: String, required: true },
    email: { type: String } // optional: Sam's Google email, so Sam can sign in. Kept trimmed and in small letters
});

module.exports = mongoose.model('Friend', friendSchema);