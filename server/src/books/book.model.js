const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true},
    author: { type:String, required: true},
    copyNote: { type: String } // optional: a few words to tell two copies apart, like "signed"
})

module.exports = mongoose.model('Book', bookSchema);
