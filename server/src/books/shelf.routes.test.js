// Tests the friend shelf view, GET /shelf: the whole trip from Sam's sign-in to the pretend database and back.
// "who is this?" is the pretend one, so Sam signs in without Google.
jest.mock('../auth/who-is-this');
const request = require('supertest');
const app = require('../app');
const { friendSignIn } = require('../auth/who-is-this');
const Book = require('./book.model');
const Friend = require('../friends/friend.model');
const Loan = require('../loans/loan.model');
const Request = require('../requests/request.model');
const testDb = require('../../test-db');

// every request in this file is sent signed in as Sam
const asSam = request.agent(app).set('Authorization', 'Bearer ' + friendSignIn('sam@gmail.com'));

beforeAll(testDb.start, 60000);
beforeEach(testDb.clear);
afterAll(testDb.stop);

test('Sam sees every book, with "lent out" on Dune (out with Alex) and "on the shelf" on Matilda (200)', async () => {
    const sam = await Friend.create({ name: 'Sam', email: 'sam@gmail.com' });
    const alex = await Friend.create({ name: 'Alex', email: 'alex@gmail.com' });
    const dune = await Book.create({ title: 'Dune', author: 'Frank Herbert', copyNote: 'signed' });
    const matilda = await Book.create({ title: 'Matilda', author: 'Roald Dahl' });
    const hobbit = await Book.create({ title: 'The Hobbit', author: 'J.R.R. Tolkien' });
    await Loan.create({ book: dune.id, friend: alex.id });
    // Sam had The Hobbit once, but brought it back, so it's on the shelf again
    await Loan.create({ book: hobbit.id, friend: sam.id, returnedAt: new Date() });

    const res = await asSam.get('/shelf');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
        { _id: dune.id, title: 'Dune', author: 'Frank Herbert', copyNote: 'signed', state: 'lent out' },
        { _id: matilda.id, title: 'Matilda', author: 'Roald Dahl', state: 'on the shelf' },
        { _id: hobbit.id, title: 'The Hobbit', author: 'J.R.R. Tolkien', state: 'on the shelf' },
    ]);
});

test('Dune says "asked for" while Alex\'s request waits, and "on the shelf" again once it\'s cancelled', async () => {
    await Friend.create({ name: 'Sam', email: 'sam@gmail.com' });
    const alex = await Friend.create({ name: 'Alex', email: 'alex@gmail.com' });
    const dune = await Book.create({ title: 'Dune', author: 'Frank Herbert' });
    const request = await Request.create({ book: dune.id, friend: alex.id });

    const waiting = await asSam.get('/shelf');
    await Request.updateOne({ _id: request._id }, { status: 'cancelled', cancelledAt: new Date() });
    const cancelled = await asSam.get('/shelf');

    expect(waiting.body[0].state).toBe('asked for');
    expect(JSON.stringify(waiting.body)).not.toContain('Alex');
    expect(JSON.stringify(waiting.body)).not.toContain(alex.id);
    expect(cancelled.body[0].state).toBe('on the shelf');
});

test('the shelf never says who has a book: no friend names or ids anywhere in it', async () => {
    await Friend.create({ name: 'Sam', email: 'sam@gmail.com' });
    const alex = await Friend.create({ name: 'Alex', email: 'alex@gmail.com' });
    const dune = await Book.create({ title: 'Dune', author: 'Frank Herbert' });
    await Loan.create({ book: dune.id, friend: alex.id });

    const res = await asSam.get('/shelf');

    const everything = JSON.stringify(res.body);
    expect(everything).not.toContain('Alex');
    expect(everything).not.toContain(alex.id);
    expect(everything).not.toContain('alex@gmail.com');
});
