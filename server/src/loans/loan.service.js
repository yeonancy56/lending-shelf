const loanDao = require ('./loan.dao');
const bookDao = require('../books/book.dao');
const friendDao = require('../friends/friend.dao');
const requestDao = require('../requests/request.dao'); // "has someone asked for Dune?" and "how many is Sam waiting on?"
const ROLE = require('../auth/role');
const { badRequest, ruleBroken, DUPLICATE_KEY } = require('../errors');

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

// Sam's panel: what Sam has now, what Sam had before, and the 3-book limit, so the page never has to know it.
// Gives back nothing when there's no such friend, so the controller can say "Friend not found"
async function listFriendLoans(friendId) {
    if (!(await friendDao.exists(friendId))) return null;
    const loans = await loanDao.findByFriend(friendId);
    return {
        active: loans.filter((loan) => !loan.returnedAt).map(withDueBack),
        returned: loans.filter((loan) => loan.returnedAt).map(withDueBack),
        limit: MAX_LOANS,
    };
}

// The lending rules, worded for whoever is reading the red message:
// me at the lend form ("This friend…"), or Sam asking for a book ("you…")
const RULE_WORDS = {
    [ROLE.OWNER]: {
        lentOut: 'This book is already lent out',
        askedFor: (friendName) => `${friendName} has asked for this book`, // I need to know who to answer first
        limit: 'This friend already has 3 books',
        overdue: 'This friend has an overdue book',
    },
    [ROLE.FRIEND]: {
        lentOut: 'This book is already lent out',
        askedFor: () => 'Someone has already asked for this book', // never who, so Sam's asking stays private
        limit: 'You already have 3 books and requests',
        overdue: 'You have an overdue book. Please bring it back first',
    },
};

// The one shared check, used by my lend form, by Sam asking, and by me approving, so the rules can never drift apart.
// reader is ROLE.OWNER or ROLE.FRIEND, and only changes the words. Says nothing when every rule passes.
// approvingId is the request I'm saying yes to, if any. It's left out of "asked for" and the 3-book count,
// so Sam's own request for Dune doesn't block itself
async function checkLendingRules(bookId, friendId, reader, approvingId = null) {
    const words = RULE_WORDS[reader];
    // rule 1: is the book already out?
    if (await loanDao.findActiveByBook(bookId)) throw ruleBroken(words.lentOut);
    // rule 2: has someone asked for it? Then I answer them first, and nobody else can ask
    const waitingRequest = await requestDao.findWaitingByBook(bookId);
    if (waitingRequest && String(waitingRequest._id) !== String(approvingId)) {
        throw ruleBroken(words.askedFor(waitingRequest.friend.name));
    }
    // rule 3: the 3-book limit. Books the friend has now and their waiting requests both count
    const count = await loanDao.countActiveByFriend(friendId) + await requestDao.countWaitingByFriend(friendId, approvingId);
    if (count >= MAX_LOANS) throw ruleBroken(words.limit);
    // rule 4: does the friend have an overdue book?
    const activeLoans = await loanDao.findActiveByFriend(friendId);
    if (activeLoans.some(isOverdue)) throw ruleBroken(words.overdue);
}

async function lendBook(bookId, friendId) {
    // first: do this book and friend exist? No point checking the rules otherwise
    if (!(await bookDao.exists(bookId))) throw badRequest('That book does not exist');
    if (!(await friendDao.exists(friendId))) throw badRequest('That friend does not exist');
    await checkLendingRules(bookId, friendId, ROLE.OWNER);
    // all rules passed -> lend it
    return startLoan(bookId, friendId);
}

// saves the new loan of Dune to Sam. The lending rules must already have said yes:
// my lend form checks them just above, and approving a request checks them before calling this
async function startLoan(bookId, friendId) {
    try {
        return await loanDao.create({ book: bookId, friend: friendId });
    } catch (err) {
        // another loan of Dune was saved a moment before this one, so the database said no
        if (err.code === DUPLICATE_KEY) throw ruleBroken(RULE_WORDS[ROLE.OWNER].lentOut);
        throw err;
    }
}

async function returnBook(loanId) {
    const loan = await loanDao.findById(loanId);
    if (!loan) return null;
    if (loan.returnedAt) throw ruleBroken('This book was already returned');
    return loanDao.markReturned(loanId);
}

module.exports = {listLoans, listFriendLoans, checkLendingRules, lendBook, startLoan, returnBook}