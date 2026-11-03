// Tests the whole trip for friends: request -> route -> controller -> service -> DAO -> database, and back.
// Uses the pretend database from test-db.js, so real friends are never touched.
jest.mock('../auth/who-is-this'); // the pretend "who is this?", so Google is never asked
const request = require('supertest');
const app = require('../app');
// every request in this file is sent signed in as the owner, like me using the page
const owner = request.agent(app).set('Authorization', 'Bearer owner-sign-in');
const Friend = require('./friend.model');
const Book = require('../books/book.model');
const Loan = require('../loans/loan.model');
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

test('DELETE /friends/:id refuses to delete Sam while Sam has Dune (409)', async () => {
    const sam = await Friend.create({ name: 'Sam' });
    const dune = await Book.create({ title: 'Dune', author: 'Frank Herbert' });
    await Loan.create({ book: dune._id, friend: sam._id });

    const res = await owner.delete(`/friends/${sam._id}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("This friend has borrowed before, so they can't be deleted. Their loans need them.");
    const friends = await owner.get('/friends');
    expect(friends.body).toHaveLength(1); // Sam is still on the list
});

test('DELETE /friends/:id refuses to delete Sam after Sam gave Dune back, because the past loan needs Sam (409)', async () => {
    const sam = await Friend.create({ name: 'Sam' });
    const dune = await Book.create({ title: 'Dune', author: 'Frank Herbert' });
    await Loan.create({ book: dune._id, friend: sam._id, returnedAt: new Date() });

    const res = await owner.delete(`/friends/${sam._id}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("This friend has borrowed before, so they can't be deleted. Their loans need them.");
    const friends = await owner.get('/friends');
    expect(friends.body).toHaveLength(1); // Sam is still on the list
});

test('DELETE /friends/:id deletes Alex, who never borrowed (204)', async () => {
    const alex = await Friend.create({ name: 'Alex' });

    const res = await owner.delete(`/friends/${alex._id}`);

    expect(res.status).toBe(204);
    const friends = await owner.get('/friends');
    expect(friends.body).toHaveLength(0); // Alex is gone
});

test('DELETE /friends/:id for a friend who isn\'t there says so (404)', async () => {
    const gone = await Friend.create({ name: 'Sam' });
    await Friend.findByIdAndDelete(gone._id);

    const res = await owner.delete(`/friends/${gone._id}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Friend not found');
});
