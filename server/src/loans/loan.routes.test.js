// Tests the whole trip for lending: request -> route -> controller -> service -> DAO -> database, and back.
// Uses the pretend database from test-db.js, so real books and loans are never touched.
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const Book = require('../books/book.model');
const Friend = require('../friends/friend.model');
const Loan = require('./loan.model');
const testDb = require('../../test-db');

let dune;
let sam;

beforeAll(testDb.start, 60000); // the first run downloads the pretend database, so allow up to a minute
beforeEach(async () => {
    await testDb.clear(); // every test starts with an empty shelf...
    dune = await Book.create({ title: 'Dune', author: 'Frank Herbert' }); // ...plus Dune and Sam
    sam = await Friend.create({ name: 'Sam' });
});
afterAll(testDb.stop);

test('lends Dune to Sam (201)', async () => {
    const res = await request(app).post('/loans').send({ bookId: dune.id, friendId: sam.id });

    expect(res.status).toBe(201);
    expect(res.body.book).toBe(dune.id);
    expect(res.body.friend).toBe(sam.id);
    expect(await Loan.countDocuments()).toBe(1);
});

test('does not lend Dune when Dune is already out (409)', async () => {
    await Loan.create({ book: dune.id, friend: sam.id }); // Dune is already with Sam

    const res = await request(app).post('/loans').send({ bookId: dune.id, friendId: sam.id });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This book is already lent out');
    expect(await Loan.countDocuments()).toBe(1); // no second loan
});

test('asks to pick a book when none was picked (400)', async () => {
    const res = await request(app).post('/loans').send({ bookId: '', friendId: sam.id });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Pick a book and a friend');
    expect(await Loan.countDocuments()).toBe(0);
});

test('asks to pick a friend when none was picked (400)', async () => {
    const res = await request(app).post('/loans').send({ bookId: dune.id });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Pick a book and a friend');
    expect(await Loan.countDocuments()).toBe(0);
});

test('says the book does not exist when the ID is not a real ID (400)', async () => {
    const res = await request(app).post('/loans').send({ bookId: 'not-an-id', friendId: sam.id });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('That book does not exist');
    expect(await Loan.countDocuments()).toBe(0);
});

test('says the friend does not exist when no friend has that ID (400)', async () => {
    const nobody = new mongoose.Types.ObjectId().toString(); // looks like a real ID, but no friend has it

    const res = await request(app).post('/loans').send({ bookId: dune.id, friendId: nobody });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('That friend does not exist');
    expect(await Loan.countDocuments()).toBe(0);
});

test('lends two copies of Dune at the same time, because each copy is its own book', async () => {
    const signed = await Book.create({ title: 'Dune', author: 'Frank Herbert', copyNote: 'signed' });
    const ana = await Friend.create({ name: 'Ana' });
    await request(app).post('/loans').send({ bookId: signed.id, friendId: sam.id }); // Sam has the signed Dune

    const res = await request(app).post('/loans').send({ bookId: dune.id, friendId: ana.id }); // the other Dune is still free

    expect(res.status).toBe(201);
    expect(await Loan.countDocuments()).toBe(2);
});

test('does not lend Sam a 4th book (409)', async () => {
    for (const title of ['Matilda', 'Emma', 'Holes']) {
        const book = await Book.create({ title, author: 'Someone' });
        await Loan.create({ book: book.id, friend: sam.id }); // Sam already has 3 books
    }

    const res = await request(app).post('/loans').send({ bookId: dune.id, friendId: sam.id });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('this friend already has 3 books');
});

test('does not lend to Sam when Sam has an overdue book (409)', async () => {
    const matilda = await Book.create({ title: 'Matilda', author: 'Roald Dahl' });
    await Loan.create({ book: matilda.id, friend: sam.id, lentAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }); // out for 15 days

    const res = await request(app).post('/loans').send({ bookId: dune.id, friendId: sam.id });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This friend has an overdue book');
});

test('does not return Dune twice (409)', async () => {
    const loan = await Loan.create({ book: dune.id, friend: sam.id, returnedAt: new Date() }); // Dune is already back

    const res = await request(app).post(`/loans/${loan.id}/return`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This book was already returned');
});

test('says the loan was not found when the ID is not a real ID (404)', async () => {
    const res = await request(app).post('/loans/not-an-id/return');

    expect(res.status).toBe(404);
});

test('the loans list says when each book is due back, and which ones are overdue', async () => {
    const matilda = await Book.create({ title: 'Matilda', author: 'Roald Dahl' });
    const emma = await Book.create({ title: 'Emma', author: 'Jane Austen' });
    await Loan.create({ book: dune.id, friend: sam.id, lentAt: new Date('2026-10-01T12:00:00Z') }); // out for weeks
    await Loan.create({ book: matilda.id, friend: sam.id, lentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }); // out for 2 days
    await Loan.create({ book: emma.id, friend: sam.id, lentAt: new Date('2026-10-01T12:00:00Z'), returnedAt: new Date() }); // already back

    const res = await request(app).get('/loans');
    const loanOf = (title) => res.body.find((loan) => loan.book.title === title);

    expect(res.status).toBe(200);
    expect(loanOf('Dune').dueBack).toBe('2026-10-15T12:00:00.000Z'); // 14 days after it was lent
    expect(loanOf('Dune').overdue).toBe(true);
    expect(loanOf('Matilda').overdue).toBe(false);
    expect(loanOf('Emma').dueBack).toBeUndefined(); // back on the shelf, so no due back day...
    expect(loanOf('Emma').overdue).toBe(false); // ...and never overdue
});

test('GET /friends/:id/loans sends what Sam has now, Sam\'s past loans, and the 3-book limit', async () => {
    const emma = await Book.create({ title: 'Emma', author: 'Jane Austen' });
    await Loan.create({ book: dune.id, friend: sam.id, lentAt: new Date('2026-10-01T12:00:00Z') }); // out for weeks
    await Loan.create({ book: emma.id, friend: sam.id, lentAt: new Date('2026-09-01T12:00:00Z'), returnedAt: new Date('2026-09-10T12:00:00Z') }); // already back

    const res = await request(app).get(`/friends/${sam.id}/loans`);

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(3);
    expect(res.body.current).toHaveLength(1);
    expect(res.body.current[0].book.title).toBe('Dune'); // the book's name, not just its ID
    expect(res.body.current[0].dueBack).toBe('2026-10-15T12:00:00.000Z'); // 14 days after it was lent
    expect(res.body.current[0].overdue).toBe(true);
    expect(res.body.past).toHaveLength(1);
    expect(res.body.past[0].book.title).toBe('Emma');
    expect(res.body.past[0].lentAt).toBe('2026-09-01T12:00:00.000Z');
    expect(res.body.past[0].returnedAt).toBe('2026-09-10T12:00:00.000Z');
});

test('GET /friends/:id/loans puts Sam\'s newest past loan first', async () => {
    const emma = await Book.create({ title: 'Emma', author: 'Jane Austen' });
    const matilda = await Book.create({ title: 'Matilda', author: 'Roald Dahl' });
    // added oldest, newest, middle, so the order they were saved in isn't the answer
    await Loan.create({ book: dune.id, friend: sam.id, lentAt: new Date('2026-07-01T12:00:00Z'), returnedAt: new Date('2026-07-05T12:00:00Z') });
    await Loan.create({ book: emma.id, friend: sam.id, lentAt: new Date('2026-09-01T12:00:00Z'), returnedAt: new Date('2026-09-05T12:00:00Z') });
    await Loan.create({ book: matilda.id, friend: sam.id, lentAt: new Date('2026-08-01T12:00:00Z'), returnedAt: new Date('2026-08-05T12:00:00Z') });

    const res = await request(app).get(`/friends/${sam.id}/loans`);

    expect(res.body.past.map((loan) => loan.book.title)).toEqual(['Emma', 'Matilda', 'Dune']);
});

test('GET /friends/:id/loans for a friend who isn\'t there says so (404)', async () => {
    const gone = await Friend.create({ name: 'Alex' });
    await Friend.findByIdAndDelete(gone._id);

    const missing = await request(app).get(`/friends/${gone.id}/loans`);
    const wrongShape = await request(app).get('/friends/abc/loans'); // an ID like "abc" can't belong to anyone

    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe('Friend not found');
    expect(wrongShape.status).toBe(404);
    expect(wrongShape.body.error).toBe('Friend not found');
});
