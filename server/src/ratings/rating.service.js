const ratingDao = require('./rating.dao');
const bookDao = require('../books/book.dao');
const loanDao = require('../loans/loan.dao');
const { ruleBroken } = require('../errors');

// Sam gives Dune his stars, or changes them. Sam is always the friend from the sign-in, never from what the page sent.
// He can only rate a copy he has brought back at least once, so he's read it before he rates it.
// Gives back nothing when there's no such book, so the controller can say "Book not found".
// That includes a book deleted back when a lent book could still be deleted, even if an old loan says Sam returned it
async function rateBook(bookId, friendId, stars) {
    if (!(await bookDao.exists(bookId))) return null;
    if (!(await loanDao.hasReturned(bookId, friendId))) throw ruleBroken("This book can be rated once you've returned it");
    const rating = await ratingDao.setStars(bookId, friendId, stars);
    return { book: rating.book, stars: rating.stars }; // never the friend: Sam already knows it's his
}

module.exports = { rateBook };
