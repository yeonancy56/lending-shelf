const mongoose = require('mongoose');
const Request = require('./request.model');

function create(data) { return Request.create(data); }

// the lending rules: has someone asked for this book, and is still waiting? With their name, so my lend form can say who
function findWaitingByBook(bookId) {
    return Request.findOne({ book: bookId, status: 'waiting' }).populate('friend');
}

// the 3-book limit: how many requests is this friend still waiting on?
function countWaitingByFriend(friendId) {
    return Request.countDocuments({ friend: friendId, status: 'waiting' });
}

// the friend shelf view: which books are asked for right now? Only the books' ids, never who asked
function findAskedForBookIds() {
    return Request.distinct('book', { status: 'waiting' });
}

// Sam's requests: every one Sam ever made, with each book's name, the newest first
function findByFriend(friendId) {
    return Request.find({ friend: friendId }).sort({ askedAt: -1 }).populate('book');
}

// one of this friend's requests. Alex's request is never "found" for Sam.
// An ID in the wrong shape, like "abc", can't belong to any request, so there's nothing to find
function findByIdForFriend(id, friendId) {
    return mongoose.isValidObjectId(id) ? Request.findOne({ _id: id, friend: friendId }) : null;
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

module.exports = { create, findWaitingByBook, countWaitingByFriend, findAskedForBookIds, findByFriend, findByIdForFriend, markCancelled };
