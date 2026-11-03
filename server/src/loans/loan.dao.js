const mongoose = require('mongoose');
const Loan = require ('./loan.model');

//basic
function findAll()    { return Loan.find().populate('book').populate('friend'); }
// an ID in the wrong shape, like "abc", can't belong to any loan, so there's nothing to find
function findById(id) { return mongoose.isValidObjectId(id) ? Loan.findById(id) : null; }
function create(data) { return Loan.create(data); }

// rule 1: is this book still out?
function findActiveByBook(bookId) {
    return Loan.findOne({ book: bookId, returnedAt: null });
}

// can this book be deleted? Not if any loan, out now or returned, still needs it
async function existsForBook(bookId) {
    return (await Loan.exists({ book: bookId })) !== null;
}

// rule 2: how mayn books does this friend out?
function countActiveByFriend(friendId) {
    return Loan.countDocuments({ friend: friendId, returnedAt: null });
}

// rule 3: the books this friend has right now, so the service can check if any is overdue
function findActiveByFriend(friendId) {
    return Loan.find({ friend: friendId, returnedAt: null });
}

// Sam's panel: every loan Sam ever had, with each book's name, the most recently lent first
function findByFriend(friendId) {
    return Loan.find({ friend: friendId }).sort({ lentAt: -1 }).populate('book');
}

//return a book: fill in today's date
function markReturned(id) {
    return Loan.findByIdAndUpdate(id, { returnedAt: new Date() }, { returnDocument: 'after' });
}

module.exports = {findAll, findById, create, findActiveByBook, existsForBook, countActiveByFriend, findActiveByFriend, findByFriend, markReturned}