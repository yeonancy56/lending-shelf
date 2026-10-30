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

module.exports = { findAll, findById, create, update, remove, exists}