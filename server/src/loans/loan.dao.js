const Loan = require ('./loan.model');

//basic
function findAll()    { return Loan.find().populate('book').populate('friend'); }
function findById(id) { return Loan.findById(id); }
function create(data) { return Loan.create(data); }

// rule 1: is this book still out?
function findActiveByBook(bookId) {
    return Loan.findOne({ book: bookId, returnedAt: null });
}

// rule 2: how mayn books does this friend out?
function countActiveByFriend(friendId) {
    return Loan.countDocuments({ friend: friendId, returnedAt: null });
}

// rule 3: does this firend have an overdue book?
function findOverdueByFriend(friendId, cutoff) {
    return Loan.findOne({ friend: friendId, returnedAt: null, lentAt: { $lt:cutoff } });
}

//return a book: fill in today's date
function markReturned(id) {
    return Loan.findByIdAndUpdate(id, { returnedAt: new Date() }, { returnDocument: 'after' });
}

module.exports = {findAll, findById, create, findActiveByBook, countActiveByFriend, findOverdueByFriend, markReturned}