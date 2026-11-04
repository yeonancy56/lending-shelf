// Tests how api.js reads the server's answer. No server needed:
// fetch (the browser's way of calling the server) is swapped for a fake one.
import { afterEach, expect, test, vi } from 'vitest';
import { addBook, addFriend, updateFriend, getBooks, getFriends, getLoans, getShelf, getMyLoans, getMyRequests, askForBook, cancelRequest, getWaitingRequests, approveRequest, declineRequest, getFriendRequests, whoAmI, isSignedIn, lendBook, returnLoan, saveSignIn, signInWithPassword, signOut, whenSignedOut } from './api';

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

test('keeps the server\'s own words when Sam tries something only I can do (403)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(403, JSON.stringify({ error: 'Only the owner can do that.' }))));

    expect(await getLoans()).toEqual({ error: 'Only the owner can do that.' });
});

test.each([
    ['"who am I?"', whoAmI, '/api/me'],
    ['the friend shelf view', getShelf, '/api/shelf'],
    ['Sam\'s own loans', getMyLoans, '/api/me/loans'],
    ['Sam\'s own requests', getMyRequests, '/api/me/requests'],
])('asks the server for %s at its own address', async (_, ask, address) => {
    const fetch = vi.fn().mockResolvedValue(answer(200, JSON.stringify({ who: 'owner' })));
    vi.stubGlobal('fetch', fetch);

    expect(await ask()).toEqual({ who: 'owner' });
    expect(fetch).toHaveBeenCalledWith(address, expect.anything());
});

// every button that sends something: Add book, Add Friend, Save friend, Lend and Return
test.each([
    ['adding a book', () => addBook(DUNE)],
    ['adding a friend', () => addFriend({ name: 'Sam' })],
    ['saving an edited friend', () => updateFriend('sam-id', { name: 'Sam', email: 'sam@gmail.com' })],
    ['lending Dune to Sam', () => lendBook('dune-id', 'sam-id')],
    ['returning a loan', () => returnLoan('loan-id')],
    ['Sam asking for Dune', () => askForBook('dune-id')],
    ['Sam cancelling a request', () => cancelRequest('request-id')],
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
    ['who am I', whoAmI],
    ['shelf', getShelf],
    ['my loans', getMyLoans],
    ['my requests', getMyRequests],
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

test('asking for Dune sends only the book, never which friend: the server knows it\'s Sam from the sign-in', async () => {
    const fetch = vi.fn().mockResolvedValue(answer(201, JSON.stringify({ _id: 'request-id', status: 'waiting' })));
    vi.stubGlobal('fetch', fetch);

    await askForBook('dune-id');

    expect(fetch).toHaveBeenCalledWith('/api/requests', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ bookId: 'dune-id' });
});

test('cancelling sends the request\'s id in the address', async () => {
    const fetch = vi.fn().mockResolvedValue(answer(200, JSON.stringify({ _id: 'request-id', status: 'cancelled' })));
    vi.stubGlobal('fetch', fetch);

    await cancelRequest('request-id');

    expect(fetch).toHaveBeenCalledWith('/api/requests/request-id/cancel', expect.objectContaining({ method: 'POST' }));
});

test('approving sends the request\'s id in the address', async () => {
    const fetch = vi.fn().mockResolvedValue(answer(200, JSON.stringify({ _id: 'request-id', status: 'approved' })));
    vi.stubGlobal('fetch', fetch);

    await approveRequest('request-id');

    expect(fetch).toHaveBeenCalledWith('/api/requests/request-id/approve', expect.objectContaining({ method: 'POST' }));
});

test('declining sends the request\'s id in the address and my note in the body', async () => {
    const fetch = vi.fn().mockResolvedValue(answer(200, JSON.stringify({ _id: 'request-id', status: 'declined' })));
    vi.stubGlobal('fetch', fetch);

    await declineRequest('request-id', "I'm rereading it this week");

    expect(fetch).toHaveBeenCalledWith('/api/requests/request-id/decline', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ note: "I'm rereading it this week" });
});

test('my Requests list and Sam\'s panel ask the right addresses', async () => {
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(answer(200, '[]')));
    vi.stubGlobal('fetch', fetch);

    await getWaitingRequests();
    await getFriendRequests('sam-id');

    expect(fetch.mock.calls.map((call) => call[0])).toEqual(['/api/requests', '/api/friends/sam-id/requests']);
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

test('signed out, sends no sign-in at all', async () => {
    const fetch = vi.fn().mockResolvedValue(answer(200, '[]'));
    vi.stubGlobal('fetch', fetch);

    await getBooks();

    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined(); // not the word "null"
});

test('a late 401 for an old sign-in doesn\'t sign out the new one', async () => {
    // the old sign-in's answer is slow, and I sign in again before it arrives
    let answerOldRequest;
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise((resolve) => { answerOldRequest = resolve; })));
    const signedOut = vi.fn();
    whenSignedOut(signedOut);
    saveSignIn('old-sign-in');
    const oldRequest = getBooks();

    saveSignIn('new-sign-in');
    answerOldRequest(answer(401, JSON.stringify({ error: 'Please sign in.' })));
    await oldRequest;

    expect(isSignedIn()).toBe(true); // still signed in with the new one
    expect(signedOut).not.toHaveBeenCalled();
});

test('signing in with a password sends the username and password to /sign-in, and hands back the sign-in', async () => {
    const fetch = vi.fn().mockResolvedValue(answer(200, JSON.stringify({ signIn: 'a-password-sign-in' })));
    vi.stubGlobal('fetch', fetch);

    expect(await signInWithPassword('Sam', 'dune-fan-1965')).toEqual({ signIn: 'a-password-sign-in' });
    const [address, options] = fetch.mock.calls[0];
    expect(address).toBe('/api/sign-in');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ username: 'Sam', password: 'dune-fan-1965' });
});

test.each([
    [401, 'Wrong username or password.'],
    [429, 'Too many tries. Try again in 15 minutes.'],
    [503, "Password sign-in isn't set up yet."],
])('a password sign-in the server says no to (%s) keeps the server\'s words, and isn\'t a sign-out', async (status, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(status, JSON.stringify({ error: message }))));
    const signedOut = vi.fn();
    whenSignedOut(signedOut);

    expect(await signInWithPassword('sam', 'not-his-password')).toEqual({ error: message });
    expect(signedOut).not.toHaveBeenCalled(); // the sign-in page stays as it is, with what was typed
});

test('a password sign-in says something went wrong when the server breaks or can\'t be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(500, '<html>Internal Server Error</html>')));
    expect(await signInWithPassword('sam', 'dune-fan-1965')).toEqual({ error: 'Something went wrong. Try again.' });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect(await signInWithPassword('sam', 'dune-fan-1965')).toEqual({ error: 'Something went wrong. Try again.' });
});
