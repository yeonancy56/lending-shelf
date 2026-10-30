const bookDao = require('./book.dao');

// a mistake in the request (like a second Dune with no copy note).
// The controller answers these with 400, the same way the loans service does
function badRequest(message) {
    const err = new Error(message);
    err.status = 400;
    return err;
}

function listBooks()          { return bookDao.findAll(); }
function getBook(id)          { return bookDao.findById(id); }
function updateBook(id, data) { return bookDao.update(id, data); }
function deleteBook(id)       { return bookDao.remove(id); }

async function addBook(data) {
    // already have this book? Then the new copy needs a copy note, so the two look different on the page
    const sameBooks = await bookDao.findSameBooks(data.title, data.author);
    if (sameBooks.length > 0 && !data.copyNote) {
        throw badRequest(`You already have ${sameBooks[0].title.trim()}. Add a note, like 'signed', to tell them apart.`);
    }
    // and its copy note must be different from every other copy's ("Paperback" and "paperback" count as the same)
    const sameNote = sameBooks.find((book) => book.copyNote?.toLowerCase() === data.copyNote?.toLowerCase());
    if (sameNote) {
        throw badRequest(`You already have ${sameNote.title.trim()} (${sameNote.copyNote}). Use a different note.`);
    }
    return bookDao.create(data);
}

module.exports = {listBooks, getBook, addBook, updateBook, deleteBook};
