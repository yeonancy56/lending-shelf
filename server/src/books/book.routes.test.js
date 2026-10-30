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
    const saved = await Book.findOne({ title: 'Dune' });
    expect(saved).not.toBeNull();                      // Dune really got saved
    expect(res.body._id).toBe(saved._id.toString());   // and the server sent back the saved Dune, not just what we typed
    expect(res.body).toMatchObject(DUNE);
});

test('GET /books lists Dune', async () => {
    await Book.create(DUNE); // put Dune straight on the shelf, so this test doesn't depend on POST working

    const res = await request(app).get('/books');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject(DUNE);
});
