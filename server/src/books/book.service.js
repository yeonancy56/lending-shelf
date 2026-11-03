const bookDao = require('./book.dao');
const loanDao = require('../loans/loan.dao');
const requestDao = require('../requests/request.dao');
const ratingDao = require('../ratings/rating.dao');
const { badRequest, ruleBroken } = require('../errors');
const { isSameText } = require('./book.same-text');
const SHELF_STATE = require('./book.shelf-state');

// every book on my shelf, each with its average rating if friends have rated it
async function listBooks() {
    const books = await bookDao.findAll();
    const averages = await ratingDao.findAverages();
    return books.map((book) => ({ ...book.toObject(), ...averageOf(book, averages) }));
}

// a copy's average stars and how many rated it, like { averageStars: 4.5, ratingCount: 2 }.
// Left out when no one has rated it, so the page shows nothing rather than "0 stars"
function averageOf(book, averages) {
    const found = averages.find((average) => average._id.equals(book._id));
    return found ? { averageStars: found.averageStars, ratingCount: found.ratingCount } : {};
}

function getBook(id)          { return bookDao.findById(id); }

// the friend shelf view: every book, and whether it's "at home", "lent out" or "asked for".
// Only the book's own details are copied over, so who has Dune, or who asked for it, can never slip into Sam's page.
// For the friend looking (friendId), a copy they've returned also says they can rate it, with their own stars once they have.
// Never anyone else's stars, only the average of everyone's
async function listShelf(friendId) {
    const books = await bookDao.findAll();
    const lentOutIds = await loanDao.findLentOutBookIds();
    const askedForIds = await requestDao.findAskedForBookIds();
    const returnedIds = await loanDao.findReturnedBookIds(friendId);
    const myRatings = await ratingDao.findByFriend(friendId);
    const averages = await ratingDao.findAverages();
    const isIn = (ids, book) => ids.some((id) => id.equals(book._id));
    function stateOf(book) {
        if (isIn(lentOutIds, book)) return SHELF_STATE.LENT_OUT;
        if (isIn(askedForIds, book)) return SHELF_STATE.ASKED_FOR;
        return SHELF_STATE.AT_HOME;
    }
    // canRate and myStars are left out when they don't apply, the same way a book with no copy note has no copyNote
    function starsOf(book) {
        if (!isIn(returnedIds, book)) return {};
        const mine = myRatings.find((rating) => rating.book.equals(book._id));
        return mine ? { canRate: true, myStars: mine.stars } : { canRate: true };
    }
    return books.map((book) => ({
        _id: book._id,
        title: book.title,
        author: book.author,
        copyNote: book.copyNote,
        state: stateOf(book),
        ...starsOf(book),
        ...averageOf(book, averages),
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
