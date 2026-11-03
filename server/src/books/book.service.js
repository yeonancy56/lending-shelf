const bookDao = require('./book.dao');
const { badRequest } = require('../errors');
const { isSameText } = require('./book.same-text');

function listBooks()          { return bookDao.findAll(); }
function getBook(id)          { return bookDao.findById(id); }
function deleteBook(id)       { return bookDao.remove(id); }

// the other copies of this book must look different from it: if there are any, it needs a copy note,
// and that note must be different from every other copy's ("Paperback" and "paperback" count as the same).
// When editing, the book being edited is left out, so it never clashes with itself
async function checkOtherCopies(data, editingId) {
    const sameBooks = await bookDao.findSameBooks(data.title, data.author);
    const otherCopies = editingId ? sameBooks.filter((book) => !book._id.equals(editingId)) : sameBooks;
    if (otherCopies.length > 0 && !data.copyNote) {
        throw badRequest(`You already have ${otherCopies[0].title.trim()}. Add a note, like 'signed', to tell them apart.`);
    }
    const bookWithSameNote = otherCopies.find((book) => isSameText(book.copyNote, data.copyNote));
    if (bookWithSameNote) {
        throw badRequest(`You already have ${bookWithSameNote.title.trim()} (${bookWithSameNote.copyNote}). Use a different note.`);
    }
}

async function addBook(data) {
    await checkOtherCopies(data);
    return bookDao.create(data);
}

// gives back nothing when there's no such book, so the controller can say "Book not found"
async function updateBook(id, data) {
    if (!(await bookDao.exists(id))) return null;
    await checkOtherCopies(data, id);
    return bookDao.update(id, data);
}

module.exports = {listBooks, getBook, addBook, updateBook, deleteBook};
