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
