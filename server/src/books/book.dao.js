const Book = require('../models/book.model')

function findAll()          { return Book.find(); }
function findById(id)       { return Book.findById(id); }
function create(data)       { return Book.create(data); }
function update(id, data)   { return Book.findByIdAndUpdate(id, data, { returnDocument: 'after' }); }
function remove(id)         { return Book.findByIdAndDelete(id); }

module.exports = { findAll, findById, create, update, remove}