const mongoose = require('mongoose');
const Request = require('./request.model');

function create(data) { return Request.create(data); }

// the lending rules: has someone asked for this book, and is still waiting? With their name, so my lend form can say who
function findWaitingByBook(bookId) {
    return Request.findOne({ book: bookId, status: 'waiting' }).populate('friend');
}

// the 3-book limit: how many requests is this friend still waiting on?
// Leaves out the one I'm approving (leaveOutId), if any, so it doesn't count against itself
function countWaitingByFriend(friendId, leaveOutId = null) {
    const filter = { friend: friendId, status: 'waiting' };
    if (leaveOutId) filter._id = { $ne: leaveOutId };
    return Request.countDocuments(filter);
}

// the friend shelf view: which books are asked for right now? Only the books' ids, never who asked
function findAskedForBookIds() {
    return Request.distinct('book', { status: 'waiting' });
}

// Sam's requests: every one Sam ever made, with each book's name, the newest first
function findByFriend(friendId) {
    return Request.find({ friend: friendId }).sort({ askedAt: -1 }).populate('book');
}

// has anyone ever asked for this book? Counts every request, whatever happened to it
async function hasEverBeenAskedFor(bookId) {
    return (await Request.exists({ book: bookId })) !== null;
}

// has this friend ever asked for a book? Counts every request, whatever happened to it
async function hasEverAsked(friendId) {
    return (await Request.exists({ friend: friendId })) !== null;
}

// one of this friend's requests. Alex's request is never "found" for Sam.
// An ID in the wrong shape, like "abc", can't belong to any request, so there's nothing to find
function findByIdForFriend(id, friendId) {
    return mongoose.isValidObjectId(id) ? Request.findOne({ _id: id, friend: friendId }) : null;
}

// my Requests list: every request still waiting on me, the oldest first, with the book's and the friend's names
function findWaiting() {
    return Request.find({ status: 'waiting' }).sort({ askedAt: 1 }).populate('book').populate('friend');
}

// cancel: only if it's this friend's and still waiting, in one step, so two clicks can't both cancel it.
// Gives back nothing when there was nothing to cancel
function markCancelled(id, friendId) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Request.findOneAndUpdate(
        { _id: id, friend: friendId, status: 'waiting' },
        { status: 'cancelled', cancelledAt: new Date() },
        { returnDocument: 'after' },
    );
}

// approve: only if it's still waiting, in one step, so two clicks can't both say yes.
// Gives back nothing when it wasn't waiting any more
function markApproved(id) {
    return Request.findOneAndUpdate(
        { _id: id, status: 'waiting' },
        { status: 'approved', answeredAt: new Date() },
        { returnDocument: 'after' },
    );
}

// decline: only if it's still waiting, in one step, so a decline can't land on a request I just approved.
// Gives back nothing when it wasn't waiting any more
function markDeclined(id, note) {
    return Request.findOneAndUpdate(
        { _id: id, status: 'waiting' },
        { status: 'declined', answeredAt: new Date(), note },
        { returnDocument: 'after' },
    );
}

// one request, whoever made it, for my Approve and Decline buttons.
// An ID in the wrong shape, like "abc", can't belong to any request, so there's nothing to find
function findById(id) {
    return mongoose.isValidObjectId(id) ? Request.findById(id) : null;
}

// an approved request points to the loan it started, so the two stay connected
function linkLoan(id, loanId) {
    return Request.findByIdAndUpdate(id, { loan: loanId }, { returnDocument: 'after' });
}

module.exports = { create, findWaitingByBook, countWaitingByFriend, findAskedForBookIds, hasEverBeenAskedFor, hasEverAsked, findByFriend, findByIdForFriend, markCancelled, findWaiting, markApproved, markDeclined, linkLoan, findById };
