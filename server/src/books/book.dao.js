const mongoose = require('mongoose');
const Book = require('./book.model')
const { sameTextPattern } = require('./same-text');

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

// every copy of this book on the shelf (same title and author), lent out or not
function findSameBooks(title, author) {
    return Book.find({ title: sameTextPattern(title), author: sameTextPattern(author) });
}

module.exports = { findAll, findById, create, update, remove, exists, findSameBooks}