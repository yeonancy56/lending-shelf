// Ask our own address, and let Vite or Vercel pass it on to the server:
// on my computer Vite does that (vite.config.js), online Vercel does (vercel.json).
const API = '/api';

// Send something to the server and read its answer.
// A known mistake (400 or 409, like "This book is already lent out") comes back as the server wrote it.
// Anything else that fails, or no answer at all (wifi down), is a real breakdown,
// so the page gets one plain message instead.
const SOMETHING_WENT_WRONG = { error: 'Something went wrong. Try again.' };

async function send(path, options) {
    let res;
    try {
        res = await fetch(API + path, options);
    } catch {
        return SOMETHING_WENT_WRONG;
    }
    if (res.ok || res.status === 400 || res.status === 409) {
        return res.json();
    }
    return SOMETHING_WENT_WRONG;
}

//GET: look at all books (like curl with no -X):
export async function getBooks() {
    const res = await fetch(API + '/books');
    return res.json();
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
    const res = await fetch(API + '/friends');
    return res.json();
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
    const res = await fetch(API + '/loans');
    return res.json();
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