const loanDao = require ('../daos/loan.dao');

const MAX_LOANS = 3;
const LOAN_DAYS = 14;

function listLoans() { return loanDao.findAll(); }

async function lendBook(bookId, friendId) {
    //rule 1: is the book already out?
    const activeLoan = await loanDao.findActiveByBook(bookId);
    if (activeLoan) throw new Error('This book is already lent out');

    // rule 2: does the friend already have 3?
    const count = await loanDao.countActiveByFriend(friendId);
    if (count >= MAX_LOANS) throw new Error('this friend already has 3 books');


    //rule 3: does the friend have an overdue book?
    const cutoff = new Date(Date.now() - LOAN_DAYS * 24 * 60 * 60 * 1000);
    const overdue = await loanDao.findOverdueByFriend(friendId, cutoff);
    if (overdue) throw new Error('This friend has an overdue book');

    // all rules paseed -> lend it 
    return loanDao.create({book: bookId, friend: friendId});
}

async function returnBook(loanId) {
    const loan = await loanDao.findById(loanId);
    if (!loan) return null;
    if (loan.returnedAt) throw new Error('This book was already returned');
    return loanDao.markReturned(loanId);
}

module.exports = {listLoans, lendBook, returnBook}