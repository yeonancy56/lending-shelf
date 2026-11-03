const mongoose = require('mongoose');
const Request = require('./request.model');
const STATUS = require('./request.status');

function create(data) { return Request.create(data); }

// the lending rules: has someone asked for this book, and is still waiting? With their name, so my lend form can say who
function findWaitingByBook(bookId) {
    return Request.findOne({ book: bookId, status: STATUS.WAITING }).populate('friend');
}

// the 3-book limit: how many requests is this friend still waiting on?
// Leaves out the one I'm approving (leaveOutId), if any, so it doesn't count against itself
function countWaitingByFriend(friendId, leaveOutId = null) {
    const filter = { friend: friendId, status: STATUS.WAITING };
    if (leaveOutId) filter._id = { $ne: leaveOutId };
    return Request.countDocuments(filter);
}

// the friend shelf view: which books are asked for right now? Only the books' ids, never who asked
function findAskedForBookIds() {
    return Request.distinct('book', { status: STATUS.WAITING });
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
    return Request.find({ status: STATUS.WAITING }).sort({ askedAt: 1 }).populate('book').populate('friend');
}

// cancel, approve or decline: change the request only if it's still waiting, in one step,
// so two clicks can't both change it, and a decline can't land on a request I just approved.
// changes says what it becomes, like { status: 'declined', answeredAt: now, note }.
// friendId, when given, also means "only if it's this friend's", so Sam can only cancel Sam's own.
// Gives back nothing when there was nothing to change
function markIfWaiting(id, changes, friendId = null) {
    if (!mongoose.isValidObjectId(id)) return null;
    const filter = { _id: id, status: STATUS.WAITING };
    if (friendId) filter.friend = friendId;
    return Request.findOneAndUpdate(filter, changes, { returnDocument: 'after' });
}

// one request, whoever made it, for my Approve and Decline buttons.
// An ID in the wrong shape, like "abc", can't belong to any request, so there's nothing to find
function findById(id) {
    return mongoose.isValidObjectId(id) ? Request.findById(id) : null;
}

module.exports = { create, findWaitingByBook, countWaitingByFriend, findAskedForBookIds, hasEverBeenAskedFor, hasEverAsked, findByFriend, findByIdForFriend, findWaiting, markIfWaiting, findById };
