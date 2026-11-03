// Ask our own address, and let Vite or Vercel pass it on to the server:
// on my computer Vite does that (vite.config.js), online Vercel does (vercel.json).
const API = '/api';

// The server's known mistakes, each with its own red message. Keep in step with server/src/errors.js:
// 400 = a mistake in the form, like a second Dune with no note
// 404 = it doesn't exist (any more), like returning a loan that's gone
// 409 = a lending rule says no, like Dune already being with Sam
const KNOWN_MISTAKES = [400, 404, 409];

// The Google sign-in, kept in the browser so a reload stays signed in.
// It goes with every request, and the server checks it's really me.
const SIGN_IN_KEY = 'signIn';
const NOT_SIGNED_IN = 'Please sign in.'; // the server's own words, for when its 401 has none

// after the Google button: remember who signed in
export function saveSignIn(signIn) {
    localStorage.setItem(SIGN_IN_KEY, signIn);
}

export function isSignedIn() {
    return Boolean(localStorage.getItem(SIGN_IN_KEY));
}

export function signOut() {
    localStorage.removeItem(SIGN_IN_KEY);
}

// what the page does when the server says "I don't know you" (401): go back to the sign-in button
let signedOutListener = () => {};
export function whenSignedOut(listener) {
    signedOutListener = listener;
}

// the server said 401 to the sign-in we sent: a stranger, or one that's too old. Forget it, and tell the page why
async function signedOutByServer(res, sentSignIn) {
    let message = NOT_SIGNED_IN;
    try {
        message = (await res.json()).error || NOT_SIGNED_IN;
    } catch {
        // no words in the answer, so use our own
    }
    // signed in again while this answer was on the way? Then it's about the old sign-in, so keep the new one
    if (localStorage.getItem(SIGN_IN_KEY) === sentSignIn) {
        signOut();
        signedOutListener(message);
    }
    return { error: message };
}

// what the page shows when the server really breaks, or can't be reached at all
const SOMETHING_WENT_WRONG = { error: 'Something went wrong. Try again.' };

// Send something to the server (or ask it for a list) and read its answer.
// A known mistake comes back as the server wrote it.
// Anything else that fails, no answer at all (wifi down), or an answer that isn't data
// (like a web page sent back by mistake) is a real breakdown,
// so the page gets one plain message instead. send always hands back an answer, it never crashes the page.
async function send(path, options = {}) {
    const signIn = localStorage.getItem(SIGN_IN_KEY);
    const headers = { ...options.headers }; // keep the Content-Type, if there is one
    if (signIn) headers.Authorization = 'Bearer ' + signIn; // and add who I am
    let res;
    try {
        res = await fetch(API + path, { ...options, headers });
    } catch {
        return SOMETHING_WENT_WRONG;
    }
    if (res.status === 401) return signedOutByServer(res, signIn);
    if (res.ok || KNOWN_MISTAKES.includes(res.status)) {
        try {
            return await res.json();
        } catch {
            return SOMETHING_WENT_WRONG;
        }
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

// PUT: save an edited book. The ID goes in the address, the fixed title, author and copy note in the body
export async function updateBook(id, book) {
    return send('/books/' + id, {
        method: 'PUT',
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

// PUT: save an edited friend, like Sam with a new Google email. An empty email removes it
export async function updateFriend(id, friend) {
    return send('/friends/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(friend),
    });
}

// Sam's panel: what Sam has now, Sam's past loans, and the 3-book limit
export async function getFriendLoans(friendId) {
    return send('/friends/' + friendId + '/loans');
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