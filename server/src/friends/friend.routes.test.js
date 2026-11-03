// Tests the whole trip for friends: request -> route -> controller -> service -> DAO -> database, and back.
// Uses the pretend database from test-db.js, so real friends are never touched.
jest.mock('../auth/who-is-this'); // the pretend "who is this?", so Google is never asked
const request = require('supertest');
const app = require('../app');
// every request in this file is sent signed in as the owner, like me using the page
const owner = request.agent(app).set('Authorization', 'Bearer owner-sign-in');
const Friend = require('./friend.model');
const testDb = require('../../test-db');

beforeAll(testDb.start, 60000); // the first run downloads the pretend database, so allow up to a minute
beforeEach(testDb.clear);         // every test starts with an empty friends list
afterAll(testDb.stop);

test('POST /friends adds Sam', async () => {
    const res = await owner.post('/friends').send({ name: 'Sam' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Sam');
    expect(await Friend.countDocuments()).toBe(1);
});

test('POST /friends without a name asks for one (400)', async () => {
    const res = await owner.post('/friends').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Every friend needs a name");
    expect(await Friend.countDocuments()).toBe(0);
});

test('POST /friends with nothing sent at all still gets a clear message (400)', async () => {
    const res = await owner.post('/friends'); // no form at all, not even an empty one

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Every friend needs a name");
});

test('POST /friends with only spaces as the name asks for one (400)', async () => {
    const res = await owner.post('/friends').send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Every friend needs a name");
    expect(await Friend.countDocuments()).toBe(0);
});
