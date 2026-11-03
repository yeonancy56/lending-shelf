// Tests the whole trip for books: request -> route -> controller -> service -> DAO -> database, and back.
// Uses the pretend database from test-db.js, so real books are never touched.
jest.mock('../auth/who-is-this'); // the pretend "who is this?", so Google is never asked
const request = require('supertest');
const app = require('../app');
// every request in this file is sent signed in as the owner, like me using the page
const owner = request.agent(app).set('Authorization', 'Bearer owner-sign-in');
const Book = require('./book.model');
const Friend = require('../friends/friend.model');
const Loan = require('../loans/loan.model');
const Request = require('../requests/request.model');
const testDb = require('../../test-db');

const DUNE = { title: 'Dune', author: 'Frank Herbert' };

beforeAll(testDb.start, 60000); // the first run downloads the pretend database, so allow up to a minute
beforeEach(testDb.clear);         // every test starts with an empty shelf
afterAll(testDb.stop);

test('POST /books adds Dune', async () => {
    const res = await owner.post('/books').send(DUNE);

    expect(res.status).toBe(201);
    const saved = await Book.findOne({ title: 'Dune' });
    expect(saved).not.toBeNull();                      // Dune really got saved
    expect(res.body._id).toBe(saved._id.toString());   // and the server sent back the saved Dune, not just what we typed
    expect(res.body).toMatchObject(DUNE);
});

test('GET /books lists Dune', async () => {
    await Book.create(DUNE); // put Dune straight on the shelf, so this test doesn't depend on POST working

    const res = await owner.get('/books');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject(DUNE);
});

test('POST /books without an author asks for one (400)', async () => {
    const res = await owner.post('/books').send({ title: 'Matilda' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please fill in the title and author');
    expect(await Book.countDocuments()).toBe(0); // Matilda didn't get saved
});

test('POST /books without a title asks for one (400)', async () => {
    const res = await owner.post('/books').send({ author: 'Roald Dahl' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please fill in the title and author');
    expect(await Book.countDocuments()).toBe(0);
});

test('POST /books with nothing sent at all still gets a clear message (400)', async () => {
    const res = await owner.post('/books'); // no form at all, not even an empty one

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please fill in the title and author');
});

test('POST /books with only spaces as the author asks for one (400)', async () => {
    const res = await owner.post('/books').send({ title: 'Matilda', author: '   ' }); // spaces aren't a real author

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please fill in the title and author');
    expect(await Book.countDocuments()).toBe(0);
});

test('POST /books saves a copy note, without the spaces around it', async () => {
    const res = await owner.post('/books').send({ ...DUNE, copyNote: ' signed ' });

    expect(res.status).toBe(201);
    expect(res.body.copyNote).toBe('signed');
    const saved = await Book.findById(res.body._id);
    expect(saved.copyNote).toBe('signed');
});

test('POST /books treats a copy note of only spaces as no copy note', async () => {
    const res = await owner.post('/books').send({ ...DUNE, copyNote: '   ' });

    expect(res.status).toBe(201);
    const saved = await Book.findById(res.body._id);
    expect(saved.copyNote).toBeUndefined(); // so the page never shows "Dune (   )"
});

test('POST /books refuses a copy note longer than 30 letters (400)', async () => {
    const res = await owner.post('/books').send({ ...DUNE, copyNote: 'the one Mum gave me for my birthday' }); // 35 letters

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Keep the note short (30 letters or fewer).');
    expect(await Book.countDocuments()).toBe(0);
});

test('POST /books allows a copy note of exactly 30 letters', async () => {
    const res = await owner.post('/books').send({ ...DUNE, copyNote: 'a'.repeat(30) }); // right on the limit

    expect(res.status).toBe(201);
    expect(res.body.copyNote).toBe('a'.repeat(30));
});

test('POST /books refuses a second Dune with no copy note (400)', async () => {
    await Book.create(DUNE);

    const res = await owner.post('/books').send(DUNE);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("You already have Dune. Add a note, like 'signed', to tell them apart.");
    expect(await Book.countDocuments()).toBe(1); // the second Dune didn't get saved
});

test('POST /books refuses a Dune whose copy note matches one I already have (400)', async () => {
    await Book.create(DUNE);
    await Book.create({ ...DUNE, copyNote: 'paperback' });

    const res = await owner.post('/books').send({ ...DUNE, copyNote: ' Paperback ' }); // capitals and spaces don't make it different

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You already have Dune (paperback). Use a different note.');
    expect(await Book.countDocuments()).toBe(2);
});

test('POST /books counts "dune" by "frank herbert " as the same book as Dune by Frank Herbert (400)', async () => {
    await Book.create(DUNE);

    const res = await owner.post('/books').send({ title: 'dune', author: 'frank herbert ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("You already have Dune. Add a note, like 'signed', to tell them apart.");
    expect(await Book.countDocuments()).toBe(1);
});

test('POST /books adds a second Dune with a different copy note', async () => {
    await Book.create(DUNE);

    const res = await owner.post('/books').send({ ...DUNE, copyNote: 'signed' });

    expect(res.status).toBe(201);
    expect(await Book.countDocuments()).toBe(2);
});

test('POST /books needs a third Dune to have a copy note different from both others', async () => {
    await Book.create(DUNE);
    await Book.create({ ...DUNE, copyNote: 'signed' });

    const sameAsSecond = await owner.post('/books').send({ ...DUNE, copyNote: 'signed' });
    const different = await owner.post('/books').send({ ...DUNE, copyNote: 'paperback' });

    expect(sameAsSecond.status).toBe(400);
    expect(sameAsSecond.body.error).toBe('You already have Dune (signed). Use a different note.');
    expect(different.status).toBe(201);
    expect(await Book.countDocuments()).toBe(3);
});

test('POST /books adds a book with the same title but a different author, with no copy note', async () => {
    await Book.create(DUNE);

    const res = await owner.post('/books').send({ title: 'Dune', author: 'Someone Else' });

    expect(res.status).toBe(201);
    expect(res.body.copyNote).toBeUndefined();
});

test('POST /books counts a lent-out Dune too', async () => {
    const lentDune = await Book.create(DUNE);
    const sam = await Friend.create({ name: 'Sam' });
    await Loan.create({ book: lentDune._id, friend: sam._id }); // Sam has my only Dune right now

    const res = await owner.post('/books').send(DUNE);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("You already have Dune. Add a note, like 'signed', to tell them apart.");
    expect(await Book.countDocuments()).toBe(1);
});

test('POST /books treats a title with search symbols as plain letters', async () => {
    await Book.create({ title: 'Why', author: 'Ann' });

    const res = await owner.post('/books').send({ title: 'Why?', author: 'Ann' }); // "Why?" isn't the same book as "Why"

    expect(res.status).toBe(201);
});

test('PUT /books/:id fixes a spelling mistake in the author', async () => {
    const dune = await Book.create({ title: 'Dune', author: 'Frank Hebert' });

    const res = await owner.put(`/books/${dune._id}`).send(DUNE);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(DUNE);
    const saved = await Book.findById(dune._id);
    expect(saved.author).toBe('Frank Herbert');
});

test('PUT /books/:id with only spaces as the author asks for one (400)', async () => {
    const dune = await Book.create(DUNE);

    const res = await owner.put(`/books/${dune._id}`).send({ title: 'Dune', author: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please fill in the title and author');
    expect((await Book.findById(dune._id)).author).toBe('Frank Herbert'); // Dune didn't change
});

test('PUT /books/:id with a blank title asks for one (400)', async () => {
    const dune = await Book.create(DUNE);

    const res = await owner.put(`/books/${dune._id}`).send({ title: '', author: 'Frank Herbert' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please fill in the title and author');
    expect((await Book.findById(dune._id)).title).toBe('Dune');
});

test('PUT /books/:id refuses a copy note longer than 30 letters (400)', async () => {
    const dune = await Book.create(DUNE);

    const res = await owner.put(`/books/${dune._id}`).send({ ...DUNE, copyNote: 'the one Mum gave me for my birthday' }); // 35 letters

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Keep the note short (30 letters or fewer).');
    expect((await Book.findById(dune._id)).copyNote).toBeUndefined(); // the long note didn't get saved
});

test('PUT /books/:id refuses to rename a book into a second Dune with no copy note (400)', async () => {
    await Book.create(DUNE);
    const typo = await Book.create({ title: 'Dun', author: 'Frank Herbert' }); // a typo, so it didn't clash when it was added

    const res = await owner.put(`/books/${typo._id}`).send(DUNE);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("You already have Dune. Add a note, like 'signed', to tell them apart.");
    expect((await Book.findById(typo._id)).title).toBe('Dun'); // still the typo
});

test('PUT /books/:id refuses to give a Dune the same copy note as another Dune (400)', async () => {
    await Book.create({ ...DUNE, copyNote: 'paperback' });
    const signed = await Book.create({ ...DUNE, copyNote: 'signed' });

    const res = await owner.put(`/books/${signed._id}`).send({ ...DUNE, copyNote: 'Paperback' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You already have Dune (paperback). Use a different note.');
    expect((await Book.findById(signed._id)).copyNote).toBe('signed'); // still signed
});

test('PUT /books/:id saves a Dune with no changes, because it doesn\'t clash with itself', async () => {
    const dune = await Book.create(DUNE); // my only Dune, with no copy note

    const res = await owner.put(`/books/${dune._id}`).send(DUNE);

    expect(res.status).toBe(200);
});

test('PUT /books/:id takes the copy note away when I empty the note box', async () => {
    const dune = await Book.create({ ...DUNE, copyNote: 'signed' });

    const res = await owner.put(`/books/${dune._id}`).send({ ...DUNE, copyNote: '' });

    expect(res.status).toBe(200);
    expect((await Book.findById(dune._id)).copyNote).toBeUndefined(); // so the page shows "Dune", not "Dune ()"
});

test('PUT /books/:id edits a Dune that Sam has, and the loan shows the fixed name', async () => {
    const dune = await Book.create({ title: 'Dune', author: 'Frank Hebert' });
    const sam = await Friend.create({ name: 'Sam' });
    await Loan.create({ book: dune._id, friend: sam._id });

    const res = await owner.put(`/books/${dune._id}`).send(DUNE);

    expect(res.status).toBe(200);
    const loans = await owner.get('/loans');
    expect(loans.body[0].book.author).toBe('Frank Herbert');
});

test('PUT /books/:id for a book that isn\'t there says so (404)', async () => {
    const gone = await Book.create(DUNE);
    await Book.findByIdAndDelete(gone._id);

    const res = await owner.put(`/books/${gone._id}`).send(DUNE);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Book not found');
});

test('PUT /books/:id with an ID in the wrong shape says the book isn\'t there (404)', async () => {
    const res = await owner.put('/books/abc').send(DUNE);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Book not found');
});

test('DELETE /books/:id refuses to delete Dune while Sam has it (409)', async () => {
    const dune = await Book.create(DUNE);
    const sam = await Friend.create({ name: 'Sam' });
    await Loan.create({ book: dune._id, friend: sam._id });

    const res = await owner.delete(`/books/${dune._id}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("This book has been lent before, so it can't be deleted. Its loans need it.");
    const shelf = await owner.get('/books');
    expect(shelf.body).toHaveLength(1); // Dune is still on the shelf
});

test('DELETE /books/:id refuses to delete Dune after Sam gave it back, because the past loan needs it (409)', async () => {
    const dune = await Book.create(DUNE);
    const sam = await Friend.create({ name: 'Sam' });
    await Loan.create({ book: dune._id, friend: sam._id, returnedAt: new Date() });

    const res = await owner.delete(`/books/${dune._id}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("This book has been lent before, so it can't be deleted. Its loans need it.");
    const shelf = await owner.get('/books');
    expect(shelf.body).toHaveLength(1); // Dune is still on the shelf
});

// requests are kept forever, so a book anyone ever asked for stays, whatever happened to the request.
// These are all the statuses a request can have
const REQUEST_STATUSES = ['waiting', 'approved', 'declined', 'cancelled'];

test.each(REQUEST_STATUSES)('DELETE /books/:id refuses to delete Dune after Sam asked for it, even when the request is %s (409)', async (status) => {
    const dune = await Book.create(DUNE);
    const sam = await Friend.create({ name: 'Sam' });
    await Request.create({ book: dune._id, friend: sam._id, status });

    const res = await owner.delete(`/books/${dune._id}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("This book has been asked for before, so it can't be deleted. Its requests need it.");
    const shelf = await owner.get('/books');
    expect(shelf.body).toHaveLength(1); // Dune is still on the shelf
});

test('DELETE /books/:id deletes Matilda, who was never lent or asked for (204)', async () => {
    const matilda = await Book.create({ title: 'Matilda', author: 'Roald Dahl' });
    // Sam asked for Dune, not Matilda, so that request doesn't hold Matilda back
    const dune = await Book.create(DUNE);
    const sam = await Friend.create({ name: 'Sam' });
    await Request.create({ book: dune._id, friend: sam._id });

    const res = await owner.delete(`/books/${matilda._id}`);

    expect(res.status).toBe(204);
    const shelf = await owner.get('/books');
    expect(shelf.body).toHaveLength(1); // Matilda is gone, only Dune is left
});

test('DELETE /books/:id for a book that isn\'t there says so (404)', async () => {
    const gone = await Book.create(DUNE);
    await Book.findByIdAndDelete(gone._id);

    const res = await owner.delete(`/books/${gone._id}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Book not found');
});

test('DELETE /books/:id with an ID in the wrong shape says the book isn\'t there (404)', async () => {
    const res = await owner.delete('/books/abc');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Book not found');
});
