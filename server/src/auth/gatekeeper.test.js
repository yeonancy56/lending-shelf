// Tests the gatekeeper in front of every address: who gets in, and who gets which addresses.
// "who is this?" is swapped for the pretend one in __mocks__, so Google is never asked.
jest.mock('./who-is-this');
const request = require('supertest');
const app = require('../app');
const { friendSignIn } = require('./who-is-this');
const Friend = require('../friends/friend.model');
const testDb = require('../../test-db');

beforeAll(testDb.start, 60000);
beforeEach(async () => {
    await testDb.clear();
    await Friend.create({ name: 'Sam', email: 'sam@gmail.com' });
});
afterAll(testDb.stop);

const AS_SAM = 'Bearer ' + friendSignIn('sam@gmail.com');

// every address only I (the owner) can use, so a new one can't slip past the gatekeeper unnoticed
const OWNER_ADDRESSES = [
    ['get', '/books'],
    ['get', '/books/some-id'],
    ['post', '/books'],
    ['put', '/books/some-id'],
    ['delete', '/books/some-id'],
    ['get', '/friends'],
    ['get', '/friends/some-id'],
    ['post', '/friends'],
    ['put', '/friends/some-id'],
    ['delete', '/friends/some-id'],
    ['get', '/friends/some-id/loans'],
    ['get', '/loans'],
    ['post', '/loans'],
    ['post', '/loans/some-id/return'],
];

// every address only a signed-in friend, like Sam, can use
const FRIEND_ADDRESSES = [
    ['get', '/shelf'],
    ['get', '/me/loans'],
];

// every address at all, plus "who am I?", which both of us can ask
const ADDRESSES = [...OWNER_ADDRESSES, ...FRIEND_ADDRESSES, ['get', '/me']];

test.each(ADDRESSES)('%s %s with no sign-in asks to sign in (401)', async (method, path) => {
    const res = await request(app)[method](path);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Please sign in.');
});

test.each(ADDRESSES)('%s %s with a stranger\'s sign-in says they\'re not on the list (401)', async (method, path) => {
    const res = await request(app)[method](path).set('Authorization', 'Bearer stranger-sign-in');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("You're not on the list.");
});

test.each(OWNER_ADDRESSES)('%s %s with Sam\'s sign-in is refused: it\'s only for the owner (403)', async (method, path) => {
    const res = await request(app)[method](path).set('Authorization', AS_SAM);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Only the owner can do that.');
});

test.each(FRIEND_ADDRESSES)('%s %s with my sign-in is refused: it\'s only for friends (403)', async (method, path) => {
    const res = await request(app)[method](path).set('Authorization', 'Bearer owner-sign-in');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Only a friend can do that.');
});

test('a friend whose email I removed is a stranger now (401)', async () => {
    await Friend.updateOne({ name: 'Sam' }, { $unset: { email: 1 } });

    const res = await request(app).get('/shelf').set('Authorization', AS_SAM);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("You're not on the list.");
});

test('an old or made-up sign-in asks to sign in again (401)', async () => {
    const res = await request(app).get('/books').set('Authorization', 'Bearer made-up');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Please sign in.');
});

test('the owner gets in', async () => {
    const res = await request(app).get('/books').set('Authorization', 'Bearer owner-sign-in');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
});

test('"who am I?" tells me I\'m the owner', async () => {
    const res = await request(app).get('/me').set('Authorization', 'Bearer owner-sign-in');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ who: 'owner' });
});

test('"who am I?" tells Sam they\'re a friend, called Sam', async () => {
    const res = await request(app).get('/me').set('Authorization', AS_SAM);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ who: 'friend', name: 'Sam' });
});

test('/health still answers with no sign-in, so Render can check the server is awake', async () => {
    const res = await request(app).get('/health');

    expect(res.text).toBe('ok');
});
