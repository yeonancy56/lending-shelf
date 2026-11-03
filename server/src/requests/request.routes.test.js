// Tests asking for a book and cancelling: the whole trip from Sam's sign-in to the pretend database and back.
// "who is this?" is the pretend one, so Sam and Alex sign in without Google.
jest.mock('../auth/who-is-this');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const { friendSignIn } = require('../auth/who-is-this');
const Book = require('../books/book.model');
const Friend = require('../friends/friend.model');
const Loan = require('../loans/loan.model');
const Request = require('./request.model');
const testDb = require('../../test-db');

const DAY = 24 * 60 * 60 * 1000;
const asSam = request.agent(app).set('Authorization', 'Bearer ' + friendSignIn('sam@gmail.com'));
const asAlex = request.agent(app).set('Authorization', 'Bearer ' + friendSignIn('alex@gmail.com'));

let sam;
let alex;
let dune;

beforeAll(testDb.start, 60000);
beforeEach(async () => {
    await testDb.clear();
    sam = await Friend.create({ name: 'Sam', email: 'sam@gmail.com' });
    alex = await Friend.create({ name: 'Alex', email: 'alex@gmail.com' });
    dune = await Book.create({ title: 'Dune', author: 'Frank Herbert' });
});
afterAll(testDb.stop);

test('Sam asks for Dune, and gets a waiting request (201)', async () => {
    const res = await asSam.post('/requests').send({ bookId: dune.id });

    expect(res.status).toBe(201);
    expect(res.body.book).toBe(dune.id);
    expect(res.body.friend).toBe(sam.id);
    expect(res.body.status).toBe('waiting');
    expect(res.body.askedAt).toBeDefined();
    expect(res.body.cancelledAt).toBeNull();
    expect(await Request.countDocuments()).toBe(1);
});

test('the request is always Sam\'s, even if the page sends Alex\'s id', async () => {
    const res = await asSam.post('/requests').send({ bookId: dune.id, friendId: alex.id });

    expect(res.status).toBe(201);
    expect(res.body.friend).toBe(sam.id);
});

test('Sam can\'t ask for Dune while it\'s lent out (409)', async () => {
    await Loan.create({ book: dune.id, friend: alex.id });

    const res = await asSam.post('/requests').send({ bookId: dune.id });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This book is already lent out');
    expect(await Request.countDocuments()).toBe(0);
});

test('Sam can\'t ask for a book that doesn\'t exist (400)', async () => {
    const nothing = new mongoose.Types.ObjectId().toString(); // looks like a real ID, but no book has it

    const missing = await asSam.post('/requests').send({ bookId: nothing });
    const empty = await asSam.post('/requests').send({});

    expect(missing.status).toBe(400);
    expect(missing.body.error).toBe('That book does not exist');
    expect(empty.status).toBe(400);
    expect(await Request.countDocuments()).toBe(0);
});

// three more books, so Sam can reach the 3-book limit
async function threeMoreBooks() {
    const books = [];
    for (const title of ['Matilda', 'Emma', 'Holes']) books.push(await Book.create({ title, author: 'Someone' }));
    return books;
}

test('Sam, with 3 books out, is told straight away (409)', async () => {
    for (const book of await threeMoreBooks()) await Loan.create({ book: book.id, friend: sam.id });

    const res = await asSam.post('/requests').send({ bookId: dune.id });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('You already have 3 books and requests');
    expect(await Request.countDocuments()).toBe(0);
});

test('Sam, with 2 books out and 1 waiting request, can\'t ask for a 4th (409)', async () => {
    const [matilda, emma, holes] = await threeMoreBooks();
    await Loan.create({ book: matilda.id, friend: sam.id });
    await Loan.create({ book: emma.id, friend: sam.id });
    await Request.create({ book: holes.id, friend: sam.id });

    const res = await asSam.post('/requests').send({ bookId: dune.id });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('You already have 3 books and requests');
});

test('Sam, with an overdue book, is told to bring it back first (409)', async () => {
    const [matilda] = await threeMoreBooks();
    await Loan.create({ book: matilda.id, friend: sam.id, lentAt: new Date(Date.now() - 15 * DAY) });

    const res = await asSam.post('/requests').send({ bookId: dune.id });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('You have an overdue book. Please bring it back first');
    expect(await Request.countDocuments()).toBe(0);
});

test('Alex can\'t ask for Dune while Sam\'s request waits, and isn\'t told it was Sam (409)', async () => {
    await Request.create({ book: dune.id, friend: sam.id });

    const res = await asAlex.post('/requests').send({ bookId: dune.id });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Someone has already asked for this book');
    expect(await Request.countDocuments()).toBe(1);
});

test('Sam sees all of Sam\'s requests, newest first, with each book\'s name and status, and never Alex\'s (200)', async () => {
    const [matilda, emma] = await threeMoreBooks();
    // saved oldest, newest, middle, so the order they were saved in isn't the answer
    await Request.create({ book: matilda.id, friend: sam.id, askedAt: new Date('2026-10-01T12:00:00Z'), status: 'cancelled', cancelledAt: new Date('2026-10-02T12:00:00Z') });
    await Request.create({ book: dune.id, friend: sam.id, askedAt: new Date('2026-10-20T12:00:00Z') });
    await Request.create({ book: emma.id, friend: sam.id, askedAt: new Date('2026-10-10T12:00:00Z'), status: 'cancelled', cancelledAt: new Date('2026-10-11T12:00:00Z') });
    const holes = await Book.create({ title: 'Holes', author: 'Louis Sachar' });
    await Request.create({ book: holes.id, friend: alex.id });

    const res = await asSam.get('/me/requests');

    expect(res.status).toBe(200);
    expect(res.body.map((r) => [r.book.title, r.status])).toEqual([
        ['Dune', 'waiting'],
        ['Emma', 'cancelled'],
        ['Matilda', 'cancelled'],
    ]);
    expect(res.body[1].cancelledAt).toBe('2026-10-11T12:00:00.000Z');
});

test('Sam cancels Sam\'s waiting request for Dune: it\'s kept, marked cancelled, with when (200)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    const res = await asSam.post(`/requests/${asked.id}/cancel`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
    expect(res.body.cancelledAt).not.toBeNull();
    const saved = await Request.findById(asked.id); // never deleted, just marked
    expect(saved.status).toBe('cancelled');
});

test('Sam can\'t cancel a request twice (409)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id, status: 'cancelled', cancelledAt: new Date() });

    const res = await asSam.post(`/requests/${asked.id}/cancel`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This request was cancelled');
});

test('Sam can\'t cancel Alex\'s request: as far as Sam can tell, it isn\'t there (404)', async () => {
    const alexs = await Request.create({ book: dune.id, friend: alex.id });

    const res = await asSam.post(`/requests/${alexs.id}/cancel`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Request not found');
    expect((await Request.findById(alexs.id)).status).toBe('waiting');
});

test('cancelling a request that isn\'t there says so (404)', async () => {
    const nothing = new mongoose.Types.ObjectId().toString();

    const missing = await asSam.post(`/requests/${nothing}/cancel`);
    const wrongShape = await asSam.post('/requests/abc/cancel');

    expect(missing.status).toBe(404);
    expect(wrongShape.status).toBe(404);
});

test('after Sam cancels, Dune is free for Alex, and no longer counts toward Sam\'s 3', async () => {
    const [matilda, emma] = await threeMoreBooks();
    await Loan.create({ book: matilda.id, friend: sam.id });
    await Loan.create({ book: emma.id, friend: sam.id });
    const asked = await Request.create({ book: dune.id, friend: sam.id }); // Sam is at 3: 2 books + Dune
    const holes = await Book.findOne({ title: 'Holes' });

    await asSam.post(`/requests/${asked.id}/cancel`);
    const samAsksForHoles = await asSam.post('/requests').send({ bookId: holes.id });
    const alexAsksForDune = await asAlex.post('/requests').send({ bookId: dune.id });

    expect(samAsksForHoles.status).toBe(201);
    expect(alexAsksForDune.status).toBe(201);
});

test('Sam can ask for Dune again after cancelling (201)', async () => {
    const first = await asSam.post('/requests').send({ bookId: dune.id });
    await asSam.post(`/requests/${first.body._id}/cancel`);

    const again = await asSam.post('/requests').send({ bookId: dune.id });

    expect(again.status).toBe(201);
    expect(await Request.countDocuments({ book: dune.id })).toBe(2); // the cancelled one is kept
});

test('Sam and Alex ask for Dune at the same moment: only one gets a waiting request', async () => {
    await Request.init(); // make sure the database's own "one waiting request per book" rule is in place

    const [samsAnswer, alexsAnswer] = await Promise.all([
        asSam.post('/requests').send({ bookId: dune.id }),
        asAlex.post('/requests').send({ bookId: dune.id }),
    ]);

    expect([samsAnswer.status, alexsAnswer.status].sort()).toEqual([201, 409]);
    const refused = samsAnswer.status === 409 ? samsAnswer : alexsAnswer;
    expect(refused.body.error).toBe('Someone has already asked for this book');
    expect(await Request.countDocuments({ book: dune.id, status: 'waiting' })).toBe(1);
});
