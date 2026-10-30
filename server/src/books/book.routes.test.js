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

test('POST /books without an author asks for one (400)', async () => {
    const res = await request(app).post('/books').send({ title: 'Matilda' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please fill in the title and author');
    expect(await Book.countDocuments()).toBe(0); // Matilda didn't get saved
});

test('POST /books without a title asks for one (400)', async () => {
    const res = await request(app).post('/books').send({ author: 'Roald Dahl' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please fill in the title and author');
    expect(await Book.countDocuments()).toBe(0);
});

test('POST /books with nothing sent at all still gets a clear message (400)', async () => {
    const res = await request(app).post('/books'); // no form at all, not even an empty one

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please fill in the title and author');
});

test('POST /books with only spaces as the author asks for one (400)', async () => {
    const res = await request(app).post('/books').send({ title: 'Matilda', author: '   ' }); // spaces aren't a real author

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please fill in the title and author');
    expect(await Book.countDocuments()).toBe(0);
});

test('POST /books saves a copy note, without the spaces around it', async () => {
    const res = await request(app).post('/books').send({ ...DUNE, copyNote: ' signed ' });

    expect(res.status).toBe(201);
    expect(res.body.copyNote).toBe('signed');
    const saved = await Book.findById(res.body._id);
    expect(saved.copyNote).toBe('signed');
});

test('POST /books treats a copy note of only spaces as no copy note', async () => {
    const res = await request(app).post('/books').send({ ...DUNE, copyNote: '   ' });

    expect(res.status).toBe(201);
    const saved = await Book.findById(res.body._id);
    expect(saved.copyNote).toBeUndefined(); // so the page never shows "Dune (   )"
});

test('POST /books refuses a copy note longer than 30 letters (400)', async () => {
    const res = await request(app).post('/books').send({ ...DUNE, copyNote: 'the one Mum gave me for my birthday' }); // 35 letters

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Keep the note short (30 letters or fewer).');
    expect(await Book.countDocuments()).toBe(0);
});

test('POST /books allows a copy note of exactly 30 letters', async () => {
    const res = await request(app).post('/books').send({ ...DUNE, copyNote: 'a'.repeat(30) }); // right on the limit

    expect(res.status).toBe(201);
    expect(res.body.copyNote).toBe('a'.repeat(30));
});
