const mongoose = require('mongoose');
const Book = require('./book.model')

function findAll()          { return Book.find(); }
function findById(id)       { return Book.findById(id); }
function create(data)       { return Book.create(data); }
function update(id, data)   { return Book.findByIdAndUpdate(id, data, { returnDocument: 'after' }); }
function remove(id)         { return Book.findByIdAndDelete(id); }

// is there a book with this ID? (an ID in the wrong shape, like "abc", can't belong to any book)
async function exists(id) {
    if (!mongoose.isValidObjectId(id)) return false;
    return (await Book.exists({ _id: id })) !== null;
}

// turn typed text into a search for exactly that text, ignoring capitals and spaces around it.
// Characters like "?" or "(" mean something special in a search, so they get a "\" in front to stay plain letters
function sameText(text) {
    const plain = text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^\\s*${plain}\\s*$`, 'i');
}

// every copy of this book on the shelf (same title and author), lent out or not
function findSameBooks(title, author) {
    return Book.find({ title: sameText(title), author: sameText(author) });
}

module.exports = { findAll, findById, create, update, remove, exists, findSameBooks}