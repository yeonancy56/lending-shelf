const ratingDao = require('./rating.dao');
const loanDao = require('../loans/loan.dao');
const { ruleBroken } = require('../errors');

// Sam gives Dune his stars, or changes them. Sam is always the friend from the sign-in, never from what the page sent.
// He can only rate a copy he has brought back at least once, so he's read it before he rates it
async function rateBook(bookId, friendId, stars) {
    if (!(await loanDao.hasReturned(bookId, friendId))) throw ruleBroken("You can rate a book once you've returned it");
    const rating = await ratingDao.setStars(bookId, friendId, stars);
    return { book: rating.book, stars: rating.stars }; // never the friend: Sam already knows it's his
}

module.exports = { rateBook };
