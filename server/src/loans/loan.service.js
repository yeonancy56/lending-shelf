const loanDao = require ('./loan.dao');
const bookDao = require('../books/book.dao');
const friendDao = require('../friends/friend.dao');
const { badRequest, ruleBroken } = require('../errors');

const MAX_LOANS = 3;
const LOAN_DAYS = 14;
const LOAN_TIME = LOAN_DAYS * 24 * 60 * 60 * 1000; // 14 days, counted in milliseconds

function dueBackOf(loan) { return new Date(loan.lentAt.getTime() + LOAN_TIME); }

// the one place that decides "is it overdue?", for the red lines and for rule 3.
// Overdue only while the book is still out, and only once it's past the exact due back moment
function isOverdue(loan) {
    return !loan.returnedAt && Date.now() > dueBackOf(loan).getTime();
}

// a book still out gets its due back day, and whether it's overdue. A returned book has neither
function withDueBack(loan) {
    const plain = loan.toObject();
    if (loan.returnedAt) return { ...plain, overdue: false };
    return { ...plain, dueBack: dueBackOf(loan), overdue: isOverdue(loan) };
}

async function listLoans() {
    const loans = await loanDao.findAll();
    return loans.map(withDueBack);
}

async function lendBook(bookId, friendId) {
    // first: do this book and friend exist? No point checking the rules otherwise
    if (!(await bookDao.exists(bookId))) throw badRequest('That book does not exist');
    if (!(await friendDao.exists(friendId))) throw badRequest('That friend does not exist');

    //rule 1: is the book already out?
    const activeLoan = await loanDao.findActiveByBook(bookId);
    if (activeLoan) throw ruleBroken('This book is already lent out');

    // rule 2: does the friend already have 3?
    const count = await loanDao.countActiveByFriend(friendId);
    if (count >= MAX_LOANS) throw ruleBroken('this friend already has 3 books');


    //rule 3: does the friend have an overdue book?
    const activeLoans = await loanDao.findActiveByFriend(friendId);
    if (activeLoans.some(isOverdue)) throw ruleBroken('This friend has an overdue book');

    // all rules paseed -> lend it 
    return loanDao.create({book: bookId, friend: friendId});
}

async function returnBook(loanId) {
    const loan = await loanDao.findById(loanId);
    if (!loan) return null;
    if (loan.returnedAt) throw ruleBroken('This book was already returned');
    return loanDao.markReturned(loanId);
}

module.exports = {listLoans, lendBook, returnBook}