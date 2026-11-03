const bookDao = require('./book.dao');
const loanDao = require('../loans/loan.dao');
const requestDao = require('../requests/request.dao');
const { badRequest, ruleBroken } = require('../errors');
const { isSameText } = require('./book.same-text');

function listBooks()          { return bookDao.findAll(); }
function getBook(id)          { return bookDao.findById(id); }

// the three words Sam's page shows next to a book. Sam's page has its own copy (SHELF_STATE in client/src/App.jsx),
// so a rename changes this line and that one
const SHELF_STATE = { atHome: 'at home', lentOut: 'lent out', askedFor: 'asked for' };

// the friend shelf view: every book, and whether it's "at home", "lent out" or "asked for".
// Only the book's own details are copied over, so who has Dune, or who asked for it, can never slip into Sam's page
async function listShelf() {
    const books = await bookDao.findAll();
    const lentOutIds = await loanDao.findLentOutBookIds();
    const askedForIds = await requestDao.findAskedForBookIds();
    const isIn = (ids, book) => ids.some((id) => id.equals(book._id));
    function stateOf(book) {
        if (isIn(lentOutIds, book)) return SHELF_STATE.lentOut;
        if (isIn(askedForIds, book)) return SHELF_STATE.askedFor;
        return SHELF_STATE.atHome;
    }
    return books.map((book) => ({
        _id: book._id,
        title: book.title,
        author: book.author,
        copyNote: book.copyNote,
        state: stateOf(book),
    }));
}

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

// a book that's been lent or asked for can't be deleted, because its loans and requests are kept forever and still need it.
// Gives back nothing when there's no such book, so the controller can say "Book not found"
async function deleteBook(id) {
    if (!(await bookDao.exists(id))) return null;
    if (await loanDao.hasEverBeenLent(id)) {
        throw ruleBroken("This book has been lent before, so it can't be deleted. Its loans need it.");
    }
    if (await requestDao.hasEverBeenAskedFor(id)) {
        throw ruleBroken("This book has been asked for before, so it can't be deleted. Its requests need it.");
    }
    return bookDao.remove(id);
}

module.exports = {listBooks, listShelf, getBook, addBook, updateBook, deleteBook};
