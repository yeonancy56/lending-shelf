// Tests me declining Sam's requests, with or without a note, and what Sam sees afterwards.
// The whole trip from a sign-in to the pretend database and back. "who is this?" is the pretend one.
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

const asMe = request.agent(app).set('Authorization', 'Bearer owner-sign-in');
const asSam = request.agent(app).set('Authorization', 'Bearer ' + friendSignIn('sam@gmail.com'));

let sam;
let dune;

beforeAll(testDb.start, 60000);
beforeEach(async () => {
    await testDb.clear();
    sam = await Friend.create({ name: 'Sam', email: 'sam@gmail.com' });
    dune = await Book.create({ title: 'Dune', author: 'Frank Herbert' });
});
afterAll(testDb.stop);

test('declining Sam\'s request for Dune with a note marks it declined, with when and the note, and lends nothing (200)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });
    const before = Date.now();

    const res = await asMe.post(`/requests/${asked.id}/decline`).send({ note: "I'm rereading it this week" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('declined');
    expect(res.body.note).toBe("I'm rereading it this week");
    expect(new Date(res.body.answeredAt).getTime()).toBeGreaterThanOrEqual(before);
    expect(await Loan.countDocuments()).toBe(0);
});

test('declining with no note at all keeps the note empty (200)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    const res = await asMe.post(`/requests/${asked.id}/decline`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('declined');
    expect(res.body.note).toBe('');
});

test('a note sent as null counts as no note (200)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    const res = await asMe.post(`/requests/${asked.id}/decline`).send({ note: null });

    expect(res.status).toBe(200);
    expect(res.body.note).toBe('');
});

test('a note of only spaces counts as no note (200)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    const res = await asMe.post(`/requests/${asked.id}/decline`).send({ note: '     ' });

    expect(res.status).toBe(200);
    expect(res.body.note).toBe('');
});

test('spaces around a note are trimmed, so they don\'t count toward the 200 (200)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    const res = await asMe.post(`/requests/${asked.id}/decline`).send({ note: '  ' + 'a'.repeat(200) + '  ' });

    expect(res.status).toBe(200);
    expect(res.body.note).toBe('a'.repeat(200));
});

test('a note that isn\'t words is refused, and the request keeps waiting (400)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    const res = await asMe.post(`/requests/${asked.id}/decline`).send({ note: { long: true } });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('The note must be words.');
    expect((await Request.findById(asked.id)).status).toBe('waiting');
});

test('a note of exactly 200 characters is fine (200)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    const res = await asMe.post(`/requests/${asked.id}/decline`).send({ note: 'a'.repeat(200) });

    expect(res.status).toBe(200);
    expect(res.body.note).toHaveLength(200);
});

test('a note longer than 200 characters is refused, and the request keeps waiting (400)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    const res = await asMe.post(`/requests/${asked.id}/decline`).send({ note: 'a'.repeat(201) });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Keep the note to 200 characters or fewer.');
    expect((await Request.findById(asked.id)).status).toBe('waiting');
});

test('declining a request twice is refused, and the first note stays (409)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    await asMe.post(`/requests/${asked.id}/decline`).send({ note: 'Not this week' });
    const again = await asMe.post(`/requests/${asked.id}/decline`).send({ note: 'Changed my words' });

    expect(again.status).toBe(409);
    expect(again.body.error).toBe('This request has already been answered');
    expect((await Request.findById(asked.id)).note).toBe('Not this week');
});

test('declining a request I already approved is refused, and Sam keeps Dune (409)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });
    await asMe.post(`/requests/${asked.id}/approve`);

    const res = await asMe.post(`/requests/${asked.id}/decline`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This request has already been answered');
    expect((await Request.findById(asked.id)).status).toBe('approved');
    expect(await Loan.countDocuments({ book: dune.id, returnedAt: null })).toBe(1);
});

test('declining a request Sam cancelled is refused (409)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id, status: 'cancelled', cancelledAt: new Date() });

    const res = await asMe.post(`/requests/${asked.id}/decline`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This request was cancelled');
    expect((await Request.findById(asked.id)).status).toBe('cancelled');
});

test('approving a request I declined is refused, and nothing is lent (409)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });
    await asMe.post(`/requests/${asked.id}/decline`);

    const res = await asMe.post(`/requests/${asked.id}/approve`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This request has already been answered');
    expect(await Loan.countDocuments()).toBe(0);
});

test('Sam can\'t cancel a request I declined (409)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });
    await asMe.post(`/requests/${asked.id}/decline`);

    const res = await asSam.post(`/requests/${asked.id}/cancel`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This request has already been answered');
    expect((await Request.findById(asked.id)).status).toBe('declined');
});

test('after I decline, Sam sees it as declined with my note, Dune is at home, and my Requests list is empty', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    await asMe.post(`/requests/${asked.id}/decline`).send({ note: "I'm rereading it this week" });
    const samsRequests = await asSam.get('/me/requests');
    const samsPanel = await asMe.get(`/friends/${sam.id}/requests`);
    const shelf = await asSam.get('/shelf');
    const myList = await asMe.get('/requests');

    expect(samsRequests.body.map((r) => [r.book.title, r.status, r.note])).toEqual([['Dune', 'declined', "I'm rereading it this week"]]);
    expect(samsPanel.body.map((r) => [r.book.title, r.status, r.note])).toEqual([['Dune', 'declined', "I'm rereading it this week"]]);
    expect(shelf.body.find((b) => b.title === 'Dune').state).toBe('at home');
    expect(myList.body).toEqual([]);
});

test('Sam can ask for Dune again straight after I decline (201)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });
    await asMe.post(`/requests/${asked.id}/decline`);

    const res = await asSam.post('/requests').send({ bookId: dune.id });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('waiting');
});

test('a declined request stops counting toward Sam\'s 3, so Sam can ask for another book (201)', async () => {
    const books = [];
    for (const title of ['Matilda', 'Emma', 'Holes']) books.push(await Book.create({ title, author: 'Someone' }));
    await Loan.create({ book: books[0].id, friend: sam.id });
    await Loan.create({ book: books[1].id, friend: sam.id });
    const asked = await Request.create({ book: dune.id, friend: sam.id }); // Sam is at 3: 2 books + Dune
    await asMe.post(`/requests/${asked.id}/decline`);

    const res = await asSam.post('/requests').send({ bookId: books[2].id });

    expect(res.status).toBe(201);
});

test('declining a request that isn\'t there says so (404)', async () => {
    const nothing = new mongoose.Types.ObjectId().toString();

    const missing = await asMe.post(`/requests/${nothing}/decline`);
    const wrongShape = await asMe.post('/requests/abc/decline');

    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe('Request not found');
    expect(wrongShape.status).toBe(404);
});
