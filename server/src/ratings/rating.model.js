const mongoose = require('mongoose');

// a rating: the 1 to 5 stars Sam gave one copy, like the signed Dune. Sam can change it, but never remove it
const ratingSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    friend: { type: mongoose.Schema.Types.ObjectId, ref: 'Friend', required: true },
    stars: { type: Number, required: true },
});

// the database itself keeps one rating per friend per copy, so Sam rating Dune again changes his stars, never adds a second rating
ratingSchema.index({ book: 1, friend: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
