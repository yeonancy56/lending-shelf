// Ask our own address, and let Vite or Vercel pass it on to the server:
// on my computer Vite does that (vite.config.js), online Vercel does (vercel.json).
const API = '/api';

//GET: look at all books (like curl with no -X):
export async function getBooks() {
    const res = await fetch(API + '/books');
    return res.json();
}

// POST: add a book (like curl -X POST -H... -d...)
export async function addBook(book) {
    const res = await fetch(API + '/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
    });
    return res.json();
}

export async function getFriends() {
    const res = await fetch(API + '/friends');
    return res.json();
}

export async function addFriend(friend) {
    const res = await fetch(API +'/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(friend),
    });
    return res.json();
}

//Loans in api.js

//getLoans: the same pattern as getBooks()
export async function getLoans() {
    const res = await fetch(API + '/loans');
    return res.json();
}

//lendBook: a POST like addBook but you send two IDs The new part is how the body is built, so that line is shown in full:
export async function lendBook(bookId, friendId) {
    const res = await fetch(API + '/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: bookId, friendId: friendId }),
    
    });
    return res.json();
}

//returnLoan: a POST with no body, just like your curl. The ID goes in the address:
export async function returnLoan(id) {
    const res = await fetch(API + '/loans/' + id + '/return', {
        method: 'POST',
    });
    return res.json();
}