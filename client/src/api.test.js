// Tests how api.js reads the server's answer. No server needed:
// fetch (the browser's way of calling the server) is swapped for a fake one.
import { afterEach, expect, test, vi } from 'vitest';
import { addBook, addFriend, getBooks, getFriends, getLoans, lendBook, returnLoan } from './api';

const DUNE = { title: 'Dune', author: 'Frank Herbert' };

// a fake answer, shaped like the ones fetch gives back
function answer(status, body) {
    return new Response(body, { status });
}

afterEach(() => {
    vi.unstubAllGlobals();
});

test('keeps the server\'s own words for a known mistake, like a second Dune with no note', async () => {
    const message = "You already have Dune. Add a note, like 'signed', to tell them apart.";
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(400, JSON.stringify({ error: message }))));

    expect(await addBook(DUNE)).toEqual({ error: message });
});

test('keeps the server\'s own words when returning a loan that no longer exists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(404, JSON.stringify({ error: 'Loan not found' }))));

    expect(await returnLoan('loan-id')).toEqual({ error: 'Loan not found' });
});

// every button that sends something: Add book, Add Friend, Lend and Return
test.each([
    ['adding a book', () => addBook(DUNE)],
    ['adding a friend', () => addFriend({ name: 'Sam' })],
    ['lending Dune to Sam', () => lendBook('dune-id', 'sam-id')],
    ['returning a loan', () => returnLoan('loan-id')],
])('says something went wrong when the server breaks while %s', async (_, click) => {
    // like the database being down: Express's own "500" page is HTML, not the { error } the page knows how to read
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(500, '<pre>Internal Server Error</pre>')));

    expect(await click()).toEqual({ error: 'Something went wrong. Try again.' });
});

test('says something went wrong when the server can\'t be reached, like the wifi being down', async () => {
    // with no connection, fetch never gets an answer at all, it just fails
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    expect(await addBook(DUNE)).toEqual({ error: 'Something went wrong. Try again.' });
});

// the three lists the page fills in when it opens
test.each([
    ['books', getBooks],
    ['friends', getFriends],
    ['loans', getLoans],
])('says something went wrong when the %s list can\'t load', async (_, load) => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    expect(await load()).toEqual({ error: 'Something went wrong. Try again.' });
});

test('says something went wrong when the server says OK but sends a web page instead of the books', async () => {
    // like Vercel set up wrong online: /api gives back the app's own page, not the list
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(200, '<!doctype html><html></html>')));

    expect(await getBooks()).toEqual({ error: 'Something went wrong. Try again.' });
});

test('says something went wrong when a lending rule says no but the answer isn\'t data', async () => {
    // a 409 is a known mistake, like Dune already being with Sam, but here there are no words to show
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(409, '<!doctype html><html></html>')));

    expect(await lendBook('dune-id', 'sam-id')).toEqual({ error: 'Something went wrong. Try again.' });
});
