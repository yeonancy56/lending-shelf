// Tests the whole trip for books: request -> route -> controller -> service -> DAO -> database, and back.
// Uses the pretend database from test-db.js, so real books are never touched.
const request = require('supertest');
const app = require('../app');
const Book = require('./book.model');
const testDb = require('../../test-db');

const DUNE = { title: 'Dune', author: 'Frank Herbert' };

beforeAll(testDb.start, 60000); // the first run downloads the pretend database, so allow up to a minute
beforeEach(testDb.clear);         // every test starts with an empty shelf
afterAll(testDb.stop);

test('POST /books adds Dune', async () => {
    const res = await request(app).post('/books').send(DUNE);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(DUNE);
    expect(await Book.countDocuments()).toBe(1); // Dune really got saved
});

test('GET /books lists Dune', async () => {
    await request(app).post('/books').send(DUNE); // this test adds Dune itself, it doesn't rely on the test above

    const res = await request(app).get('/books');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1); // only one Dune, so the shelf really was emptied
    expect(res.body[0]).toMatchObject(DUNE);
});
