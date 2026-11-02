// Ask our own address, and let Vite or Vercel pass it on to the server:
// on my computer Vite does that (vite.config.js), online Vercel does (vercel.json).
const API = '/api';

// The server's known mistakes, each with its own red message. Keep in step with server/src/errors.js:
// 400 = a mistake in the form, like a second Dune with no note
// 404 = it doesn't exist (any more), like returning a loan that's gone
// 409 = a lending rule says no, like Dune already being with Sam
const KNOWN_MISTAKES = [400, 404, 409];

// what the page shows when the server really breaks, or can't be reached at all
const SOMETHING_WENT_WRONG = { error: 'Something went wrong. Try again.' };

// Send something to the server (or ask it for a list) and read its answer.
// A known mistake comes back as the server wrote it.
// Anything else that fails, or no answer at all (wifi down), is a real breakdown,
// so the page gets one plain message instead.
async function send(path, options) {
    let res;
    try {
        res = await fetch(API + path, options);
    } catch {
        return SOMETHING_WENT_WRONG;
    }
    if (res.ok || KNOWN_MISTAKES.includes(res.status)) {
        return res.json();
    }
    return SOMETHING_WENT_WRONG;
}

//GET: look at all books (like curl with no -X):
export async function getBooks() {
    return send('/books');
}

// POST: add a book (like curl -X POST -H... -d...)
export async function addBook(book) {
    return send('/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
    });
}

export async function getFriends() {
    return send('/friends');
}

export async function addFriend(friend) {
    return send('/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(friend),
    });
}

//Loans in api.js

//getLoans: the same pattern as getBooks()
export async function getLoans() {
    return send('/loans');
}

//lendBook: a POST like addBook but you send two IDs The new part is how the body is built, so that line is shown in full:
export async function lendBook(bookId, friendId) {
    return send('/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: bookId, friendId: friendId }),
    });
}

//returnLoan: a POST with no body, just like your curl. The ID goes in the address:
export async function returnLoan(id) {
    return send('/loans/' + id + '/return', {
        method: 'POST',
    });
}