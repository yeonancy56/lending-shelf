const requestDao = require('./request.dao');
const bookDao = require('../books/book.dao');
const loanService = require('../loans/loan.service');
const { badRequest, ruleBroken } = require('../errors');

const SAME_KEY = 11000; // the database's own code for "that would break a one-only rule"

// Sam asks for Dune. Sam is always the friend from the sign-in, never from what the page sent.
// The same lending rules as my lend form run straight away, so Sam hears "no" now, not after waiting for me
async function askForBook(bookId, friendId) {
    if (!(await bookDao.exists(bookId))) throw badRequest('That book does not exist');
    await loanService.checkLendingRules(bookId, friendId, 'friend');
    try {
        return await requestDao.create({ book: bookId, friend: friendId });
    } catch (err) {
        // Alex's request was saved a moment before Sam's, so the database said no to Sam's
        if (err.code === SAME_KEY) throw ruleBroken('Someone has already asked for this book');
        throw err;
    }
}

function listFriendRequests(friendId) { return requestDao.findByFriend(friendId); }

// Sam takes back Sam's own waiting request. Dune is free again, and it stops counting toward Sam's 3.
// Gives back nothing when Sam has no such request, so the controller can say "Request not found"
async function cancelRequest(requestId, friendId) {
    const cancelled = await requestDao.markCancelled(requestId, friendId);
    if (cancelled) return cancelled;
    // nothing was cancelled: either it isn't Sam's (or isn't there at all), or it's not waiting any more
    const request = await requestDao.findByIdForFriend(requestId, friendId);
    if (!request) return null;
    throw ruleBroken('This request was already cancelled');
}

module.exports = { askForBook, listFriendRequests, cancelRequest };
