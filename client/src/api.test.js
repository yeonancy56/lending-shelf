// Tests how api.js reads the server's answer. No server needed:
// fetch (the browser's way of calling the server) is swapped for a fake one.
import { afterEach, expect, test, vi } from 'vitest';
import { addBook, addFriend, getBooks, getFriends, getLoans, isSignedIn, lendBook, returnLoan, saveSignIn, signOut, whenSignedOut } from './api';

const DUNE = { title: 'Dune', author: 'Frank Herbert' };

// a fake answer, shaped like the ones fetch gives back
function answer(status, body) {
    return new Response(body, { status });
}

afterEach(() => {
    vi.unstubAllGlobals();
    signOut(); // each test starts signed out
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

test('sends my Google sign-in with every request, so the server knows it\'s me', async () => {
    const fetch = vi.fn().mockResolvedValue(answer(201, JSON.stringify(DUNE)));
    vi.stubGlobal('fetch', fetch);
    saveSignIn('my-sign-in');

    await addBook(DUNE);

    const sent = fetch.mock.calls[0][1];
    expect(sent.headers.Authorization).toBe('Bearer my-sign-in');
    expect(sent.headers['Content-Type']).toBe('application/json'); // still says it's sending data
});

test('remembers the sign-in, like after a reload, until I sign out', () => {
    expect(isSignedIn()).toBe(false);

    saveSignIn('my-sign-in');
    expect(isSignedIn()).toBe(true);

    signOut();
    expect(isSignedIn()).toBe(false);
});

test('when the server says "not on the list" (401), forgets the sign-in and tells the page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(401, JSON.stringify({ error: "You're not on the list." }))));
    const signedOut = vi.fn();
    whenSignedOut(signedOut);
    saveSignIn('a-stranger-sign-in');

    const result = await getBooks();

    expect(signedOut).toHaveBeenCalledWith("You're not on the list.");
    expect(isSignedIn()).toBe(false);
    expect(result).toEqual({ error: "You're not on the list." }); // no books, so the page has nothing to show
});

test('a 401 that isn\'t data still sends the page back to sign in', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(401, 'Unauthorized')));
    const signedOut = vi.fn();
    whenSignedOut(signedOut);
    saveSignIn('an-old-sign-in');

    await getBooks();

    expect(signedOut).toHaveBeenCalledWith('Please sign in.');
    expect(isSignedIn()).toBe(false);
});
