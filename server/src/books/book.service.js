const bookDao = require('./book.dao');

function listBooks()          { return bookDao.findAll(); }
function getBook(id)          { return bookDao.findById(id); }
function addBook(data)        { return bookDao.create(data); }
function updateBook(id, data) { return bookDao.update(id, data); }
function deleteBook(id)       { return bookDao.remove(id); }

module.exports = {listBooks, getBook, addBook, updateBook, deleteBook};