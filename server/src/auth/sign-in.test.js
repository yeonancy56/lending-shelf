// Tests signing in with a username and password, like Gran does, who has no Google account.
// This uses the real "who is this?", not the pretend one: a password sign-in is made by our own server, so Google is never asked.
// Google's library is swapped for a pretend one anyway, so a test can never reach the real Google by mistake
jest.mock('google-auth-library');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const Friend = require('../friends/friend.model');
const friendService = require('../friends/friend.service');
const { forgetAllWrongTries } = require('./wrong-tries');
const testDb = require('../../test-db');

const page = request(app); // the sign-in page, with no one signed in yet
const SAMS_PASSWORD = 'dune-fan-1965';
const WRONG = 'Wrong username or password.';
const MINUTE = 60 * 1000;

let sam;
beforeAll(testDb.start, 60000);
beforeEach(async () => {
    await testDb.clear();
    forgetAllWrongTries(); // every test starts with no wrong tries counted
    process.env.SIGN_IN_SECRET = 'a-long-made-up-secret-for-tests';
    // only the clock is pretend, so the database and supertest keep working as usual
    jest.useFakeTimers({ now: new Date('2026-11-03T10:00:00Z'), doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'hrtime', 'performance'] });
    // Sam gets a username and password the way I'd give them: through the friend form
    process.env.OWNER_EMAIL = 'nancy@gmail.com';
    sam = await friendService.addFriend({ name: 'Sam', username: 'sam', password: SAMS_PASSWORD });
});
afterEach(() => jest.useRealTimers());
afterAll(testDb.stop);

function signIn(username, password) {
    return page.post('/sign-in').send({ username, password });
}

function asking(path, signInCode) {
    return request(app).get(path).set('Authorization', 'Bearer ' + signInCode);
}

test('Sam signs in with "Sam" and his password, and "who am I?" says Sam', async () => {
    const res = await signIn('Sam', SAMS_PASSWORD); // capitals and spaces in the username don't matter

    expect(res.status).toBe(200);
    expect(res.body.signIn).toEqual(expect.any(String));
    const me = await asking('/me', res.body.signIn);
    expect(me.status).toBe(200);
    expect(me.body).toEqual({ who: 'friend', name: 'Sam' });
});

test('with his password sign-in, Sam sees the shelf but none of my addresses', async () => {
    const { body } = await signIn('sam', SAMS_PASSWORD);

    expect((await asking('/shelf', body.signIn)).status).toBe(200);
    const books = await asking('/books', body.signIn);
    expect(books.status).toBe(403); // a password never makes someone the owner
    expect(books.body.error).toBe('Only the owner can do that.');
});

test('a wrong password and a username no one has get the same answer (401)', async () => {
    const wrongPassword = await signIn('sam', 'not-his-password');
    const noOne = await signIn('nobody-has-this', SAMS_PASSWORD);

    for (const res of [wrongPassword, noOne]) {
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: WRONG });
    }
});

test('an empty form is the same as a wrong try (401)', async () => {
    const res = await page.post('/sign-in');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe(WRONG);
});

test('after 5 wrong tries, the 6th is refused even with the right password, and it works again after 15 minutes', async () => {
    for (let tries = 0; tries < 5; tries++) {
        expect((await signIn('sam', 'not-his-password')).status).toBe(401);
    }

    const sixth = await signIn('SAM', SAMS_PASSWORD); // the same username, written differently
    expect(sixth.status).toBe(429);
    expect(sixth.body.error).toBe('Too many tries. Try again in 15 minutes.');

    jest.setSystemTime(Date.now() + 14 * MINUTE);
    expect((await signIn('sam', SAMS_PASSWORD)).status).toBe(429); // not yet

    jest.setSystemTime(Date.now() + 1 * MINUTE);
    expect((await signIn('sam', SAMS_PASSWORD)).status).toBe(200);
});

test('the 15 minutes start at the 5th wrong try, even when the tries were spread out', async () => {
    for (let tries = 0; tries < 5; tries++) {
        await signIn('sam', 'not-his-password');
        jest.setSystemTime(Date.now() + 3 * MINUTE); // one slip every 3 minutes
    }
    // the 5th try was 3 minutes ago, and the first one 15 minutes ago: still 12 minutes to wait
    expect((await signIn('sam', SAMS_PASSWORD)).status).toBe(429);

    jest.setSystemTime(Date.now() + 11 * MINUTE);
    expect((await signIn('sam', SAMS_PASSWORD)).status).toBe(429);

    jest.setSystemTime(Date.now() + 1 * MINUTE);
    expect((await signIn('sam', SAMS_PASSWORD)).status).toBe(200);
});

test('wrong tries for one username don\'t lock out another', async () => {
    await friendService.addFriend({ name: 'Gran', username: 'gran', password: 'knitting-123' });
    for (let tries = 0; tries < 5; tries++) await signIn('sam', 'not-his-password');

    expect((await signIn('gran', 'knitting-123')).status).toBe(200);
});

test('signing in right starts the count again, so a few old slips don\'t add up', async () => {
    for (let tries = 0; tries < 4; tries++) await signIn('sam', 'not-his-password');
    expect((await signIn('sam', SAMS_PASSWORD)).status).toBe(200);

    for (let tries = 0; tries < 4; tries++) await signIn('sam', 'not-his-password');

    expect((await signIn('sam', SAMS_PASSWORD)).status).toBe(200);
});

test('a password sign-in stops working after 1 hour, and asks to sign in again (401)', async () => {
    const { body } = await signIn('sam', SAMS_PASSWORD);

    jest.setSystemTime(Date.now() + 59 * MINUTE);
    expect((await asking('/me', body.signIn)).status).toBe(200);

    jest.setSystemTime(Date.now() + 2 * MINUTE);
    const late = await asking('/me', body.signIn);
    expect(late.status).toBe(401);
    expect(late.body.error).toBe('Please sign in.');
});

test('once I delete Sam, his password sign-in lets nobody in (401)', async () => {
    const { body } = await signIn('sam', SAMS_PASSWORD);
    await Friend.findByIdAndDelete(sam._id);

    const res = await asking('/me', body.signIn);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Please sign in.');
});

test('a sign-in signed with some other secret lets nobody in (401)', async () => {
    const madeUp = jwt.sign({ friendId: sam.id }, 'someone-elses-secret', { issuer: 'lending-shelf', expiresIn: '1h' });

    const res = await asking('/me', madeUp);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Please sign in.');
});

test('with no SIGN_IN_SECRET in the settings, password sign-in is off, and old ones stop working', async () => {
    const { body } = await signIn('sam', SAMS_PASSWORD);
    delete process.env.SIGN_IN_SECRET;

    const res = await signIn('sam', SAMS_PASSWORD);
    expect(res.status).toBe(503);
    expect(res.body.error).toBe("Password sign-in isn't set up yet.");
    expect((await asking('/me', body.signIn)).status).toBe(401);
});

test('a friend with a username but no password can\'t sign in with any password (401)', async () => {
    await friendService.addFriend({ name: 'Alex', username: 'alex' });

    const res = await signIn('alex', 'anything-at-all');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe(WRONG);
});
