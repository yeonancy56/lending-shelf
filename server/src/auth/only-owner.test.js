// Tests the gatekeeper in front of every address: only the owner gets in.
// "who is this?" is swapped for the pretend one in __mocks__, so Google is never asked.
jest.mock('./who-is-this');
const request = require('supertest');
const app = require('../app');
const testDb = require('../../test-db');

beforeAll(testDb.start, 60000);
beforeEach(testDb.clear);
afterAll(testDb.stop);

// every address the app has today, so a new one can't slip past the gatekeeper unnoticed
const ADDRESSES = [
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

test('/health still answers with no sign-in, so Render can check the server is awake', async () => {
    const res = await request(app).get('/health');

    expect(res.text).toBe('ok');
});
