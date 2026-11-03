const mongoose = require('mongoose');
const Book = require('./book.model')
const { sameTextPattern } = require('./book.same-text');

function findAll()          { return Book.find(); }
// the book with this ID, or null. An ID in the wrong shape, like "abc", can't belong to any book
async function findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Book.findById(id);
}
function create(data)       { return Book.create(data); }
function remove(id)         { return Book.findByIdAndDelete(id); }

// swap the book for its edited version. The whole book is replaced, so an emptied copy note is gone too
function update(id, data) {
    return Book.findOneAndReplace({ _id: id }, data, { returnDocument: 'after' });
}

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