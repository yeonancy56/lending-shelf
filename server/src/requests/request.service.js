const requestDao = require('./request.dao');
const bookDao = require('../books/book.dao');
const loanService = require('../loans/loan.service');
const friendDao = require('../friends/friend.dao');
const { badRequest, ruleBroken, DUPLICATE_KEY } = require('../errors');

const NOTE_LIMIT = 200; // a decline note is a few words, not a letter

// Sam asks for Dune. Sam is always the friend from the sign-in, never from what the page sent.
// The same lending rules as my lend form run straight away, so Sam hears "no" now, not after waiting for me
async function askForBook(bookId, friendId) {
    if (!(await bookDao.exists(bookId))) throw badRequest('That book does not exist');
    await loanService.checkLendingRules(bookId, friendId, 'friend');
    try {
        return await requestDao.create({ book: bookId, friend: friendId });
    } catch (err) {
        // Alex's request was saved a moment before Sam's, so the database said no to Sam's
        if (err.code === DUPLICATE_KEY) throw ruleBroken('Someone has already asked for this book');
        throw err;
    }
}

function listFriendRequests(friendId) { return requestDao.findByFriend(friendId); }

// Sam's panel on my page: every request Sam ever made.
// Gives back nothing when there's no such friend, so the controller can say "Friend not found"
async function listRequestsForPanel(friendId) {
    if (!(await friendDao.exists(friendId))) return null;
    return requestDao.findByFriend(friendId);
}

// why a request that isn't waiting any more can't be cancelled, approved or declined again
function notWaiting(request) {
    if (request.status === 'cancelled') return ruleBroken('This request was cancelled');
    return ruleBroken('This request has already been answered'); // approved or declined
}

// my Requests list: what still needs an answer from me, in the order it came
function listWaitingRequests() { return requestDao.findWaiting(); }

// Sam takes back Sam's own waiting request. Dune is free again, and it stops counting toward Sam's 3.
// Gives back nothing when Sam has no such request, so the controller can say "Request not found"
async function cancelRequest(requestId, friendId) {
    const cancelled = await requestDao.markCancelled(requestId, friendId);
    if (cancelled) return cancelled;
    // nothing was cancelled: either it isn't Sam's (or isn't there at all), or it's not waiting any more
    const request = await requestDao.findByIdForFriend(requestId, friendId);
    if (!request) return null;
    if (request.status === 'cancelled') throw ruleBroken('This request was already cancelled');
    throw notWaiting(request);
}

// I say yes to Sam's request for Dune: Dune is lent to Sam right now, so the 14 days start today
// Gives back nothing when there's no such request, so the controller can say "Request not found"
async function approveRequest(requestId) {
    const request = await requestDao.findById(requestId);
    if (!request) return null;
    if (request.status !== 'waiting') throw notWaiting(request);
    // the rules again, in case something changed since Sam asked, like Sam's loan going overdue
    await loanService.checkLendingRules(request.book, request.friend, 'owner', request._id);
    // say yes first, in one step: if I clicked twice, only one click gets this far, so Dune is lent only once
    const approved = await requestDao.markApproved(requestId);
    if (!approved) throw notWaiting(await requestDao.findById(requestId));
    let loan;
    try {
        loan = await loanService.startLoan(approved.book, approved.friend); // the loans code makes the loan, the same way it does for my lend form
    } catch (err) {
        // lending broke, so my yes didn't happen: the request waits again, on my list and on Sam's page
        await requestDao.putBackToWaiting(requestId);
        throw err;
    }
    return requestDao.linkLoan(requestId, loan.id);
}

// I say no to Sam's request for Dune, maybe with a short note Sam will read. Nothing is lent.
// Gives back nothing when there's no such request, so the controller can say "Request not found"
async function declineRequest(requestId, note) {
    note = note ?? ''; // no note at all is fine: Sam just sees "declined"
    if (typeof note !== 'string') throw badRequest('The note must be words.');
    if (note.length > NOTE_LIMIT) throw badRequest(`Keep the note to ${NOTE_LIMIT} characters or fewer.`);
    const request = await requestDao.findById(requestId);
    if (!request) return null;
    const declined = await requestDao.markDeclined(requestId, note);
    if (!declined) throw notWaiting(await requestDao.findById(requestId));
    return declined;
}

module.exports = { askForBook, listFriendRequests, listWaitingRequests, listRequestsForPanel, cancelRequest, approveRequest, declineRequest };
