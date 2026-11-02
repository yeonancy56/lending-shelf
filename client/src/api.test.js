// Tests how api.js reads the server's answer. No server needed:
// fetch (the browser's way of calling the server) is swapped for a fake one.
import { afterEach, expect, test, vi } from 'vitest';
import { addBook, addFriend, lendBook, returnLoan } from './api';

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
