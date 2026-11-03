// Tests GET /me/loans, Sam's own loans: the whole trip from Sam's sign-in to the pretend database and back.
// "who is this?" is the pretend one, so Sam signs in without Google.
jest.mock('../auth/who-is-this');
const request = require('supertest');
const app = require('../app');
const { friendSignIn } = require('../auth/who-is-this');
const Book = require('../books/book.model');
const Friend = require('../friends/friend.model');
const Loan = require('./loan.model');
const testDb = require('../../test-db');

const DAY = 24 * 60 * 60 * 1000;
const asSam = request.agent(app).set('Authorization', 'Bearer ' + friendSignIn('sam@gmail.com'));

let sam;
let alex;
let dune;
let matilda;

beforeAll(testDb.start, 60000);
beforeEach(async () => {
    await testDb.clear();
    sam = await Friend.create({ name: 'Sam', email: 'sam@gmail.com' });
    alex = await Friend.create({ name: 'Alex', email: 'alex@gmail.com' });
    dune = await Book.create({ title: 'Dune', author: 'Frank Herbert' });
    matilda = await Book.create({ title: 'Matilda', author: 'Roald Dahl' });
});
afterAll(testDb.stop);

test('Sam sees Dune (out now, overdue, with its due back day) and Matilda (returned) (200)', async () => {
    const lentAt = new Date(Date.now() - 15 * DAY); // 15 days ago, so 1 day past due back
    await Loan.create({ book: dune.id, friend: sam.id, lentAt });
    await Loan.create({ book: matilda.id, friend: sam.id, lentAt: new Date(Date.now() - 30 * DAY), returnedAt: new Date() });

    const res = await asSam.get('/me/loans');

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(3);
    expect(res.body.active).toHaveLength(1);
    expect(res.body.active[0].book.title).toBe('Dune');
    expect(res.body.active[0].dueBack).toBe(new Date(lentAt.getTime() + 14 * DAY).toISOString());
    expect(res.body.active[0].overdue).toBe(true);
    expect(res.body.returned).toHaveLength(1);
    expect(res.body.returned[0].book.title).toBe('Matilda');
});

test('Sam never sees Alex\'s loans, only Sam\'s own', async () => {
    await Loan.create({ book: dune.id, friend: alex.id });

    const res = await asSam.get('/me/loans');

    expect(res.body.active).toEqual([]);
    expect(res.body.returned).toEqual([]);
});

test('Sam can\'t look at Alex\'s loans through my address for Alex\'s panel (403)', async () => {
    await Loan.create({ book: dune.id, friend: alex.id });

    const res = await asSam.get(`/friends/${alex.id}/loans`);

    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain('Dune');
});
