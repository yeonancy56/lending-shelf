// Tests my side of requests: the Requests list, approving, and Sam's requests in Sam's panel.
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

const DAY = 24 * 60 * 60 * 1000;
const asMe = request.agent(app).set('Authorization', 'Bearer owner-sign-in');
const asSam = request.agent(app).set('Authorization', 'Bearer ' + friendSignIn('sam@gmail.com'));

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
afterEach(() => jest.restoreAllMocks()); // put back anything a test made break on purpose
afterAll(testDb.stop);

// three more books, so Sam can get close to the 3-book limit
async function threeMoreBooks() {
    const books = [];
    for (const title of ['Matilda', 'Emma', 'Holes']) books.push(await Book.create({ title, author: 'Someone' }));
    return books;
}

test('my Requests list shows only waiting requests, oldest first, with book and friend names (200)', async () => {
    const [matilda, emma] = await threeMoreBooks();
    // saved newest, oldest, then a cancelled one, so the order they were saved in isn't the answer
    await Request.create({ book: dune.id, friend: sam.id, askedAt: new Date('2026-10-20T12:00:00Z') });
    await Request.create({ book: matilda.id, friend: alex.id, askedAt: new Date('2026-10-01T12:00:00Z') });
    await Request.create({ book: emma.id, friend: sam.id, askedAt: new Date('2026-09-01T12:00:00Z'), status: 'cancelled', cancelledAt: new Date() });

    const res = await asMe.get('/requests');

    expect(res.status).toBe(200);
    expect(res.body.map((r) => [r.friend.name, r.book.title])).toEqual([
        ['Alex', 'Matilda'],
        ['Sam', 'Dune'],
    ]);
});

test('approving Sam\'s request for Dune lends Dune to Sam now, and the request is approved and points to that loan (200)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id, askedAt: new Date(Date.now() - 3 * DAY) });
    const before = Date.now();

    const res = await asMe.post(`/requests/${asked.id}/approve`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(new Date(res.body.answeredAt).getTime()).toBeGreaterThanOrEqual(before);
    const loans = await Loan.find();
    expect(loans).toHaveLength(1); // exactly one loan
    expect(loans[0].book.toString()).toBe(dune.id);
    expect(loans[0].friend.toString()).toBe(sam.id);
    expect(loans[0].lentAt.getTime()).toBeGreaterThanOrEqual(before); // the 14 days start now, not when Sam asked
    expect(res.body.loan).toBe(loans[0].id);
});

test('Sam, with 2 books out, can have a 3rd request approved: Sam\'s own request doesn\'t block itself (200)', async () => {
    const [matilda, emma] = await threeMoreBooks();
    await Loan.create({ book: matilda.id, friend: sam.id });
    await Loan.create({ book: emma.id, friend: sam.id });
    const asked = await Request.create({ book: dune.id, friend: sam.id }); // Sam is at 3: 2 books + Dune

    const res = await asMe.post(`/requests/${asked.id}/approve`);

    expect(res.status).toBe(200);
    expect(await Loan.countDocuments({ friend: sam.id, returnedAt: null })).toBe(3);
});

test('Sam, with 2 books out and another waiting request, can\'t have Dune approved: that would be 4 (409)', async () => {
    const [matilda, emma, holes] = await threeMoreBooks();
    await Loan.create({ book: matilda.id, friend: sam.id });
    await Loan.create({ book: emma.id, friend: sam.id });
    await Request.create({ book: holes.id, friend: sam.id });
    // made by hand, past the rules, as if Sam got to 4 some other way
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    const res = await asMe.post(`/requests/${asked.id}/approve`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('this friend already has 3 books');
    expect((await Request.findById(asked.id)).status).toBe('waiting');
});

test('Sam\'s loan went overdue since Sam asked: approving says why, and the request keeps waiting (409)', async () => {
    const [matilda] = await threeMoreBooks();
    const asked = await Request.create({ book: dune.id, friend: sam.id });
    await Loan.create({ book: matilda.id, friend: sam.id, lentAt: new Date(Date.now() - 15 * DAY) });

    const res = await asMe.post(`/requests/${asked.id}/approve`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This friend has an overdue book');
    expect((await Request.findById(asked.id)).status).toBe('waiting');
    expect(await Loan.countDocuments({ book: dune.id })).toBe(0);
});

test('approving a request twice is refused, so Dune is lent only once (409)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    await asMe.post(`/requests/${asked.id}/approve`);
    const again = await asMe.post(`/requests/${asked.id}/approve`);

    expect(again.status).toBe(409);
    expect(again.body.error).toBe('This request has already been answered');
    expect(await Loan.countDocuments()).toBe(1);
});

test('clicking Approve twice at the same moment still lends Dune only once', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    const answers = await Promise.all([
        asMe.post(`/requests/${asked.id}/approve`),
        asMe.post(`/requests/${asked.id}/approve`),
    ]);

    expect(answers.map((a) => a.status).sort()).toEqual([200, 409]);
    expect(await Loan.countDocuments()).toBe(1);
});

test('if lending Dune breaks while I approve, the request goes back to waiting, on my list and Sam\'s', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });
    jest.spyOn(Loan, 'create').mockRejectedValueOnce(new Error('the database is down')); // saving the loan breaks, once

    const res = await asMe.post(`/requests/${asked.id}/approve`);
    const myList = await asMe.get('/requests');
    const samsRequests = await asSam.get('/me/requests');

    expect(res.status).toBe(500); // a real breakdown, not a red message
    expect(await Loan.countDocuments()).toBe(0);
    expect(myList.body.map((r) => r._id)).toEqual([asked.id]);
    expect(samsRequests.body.map((r) => [r.book.title, r.status])).toEqual([['Dune', 'waiting']]);
});

test('after a broken approve puts the request back, approving again lends Dune (200)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });
    jest.spyOn(Loan, 'create').mockRejectedValueOnce(new Error('the database is down'));
    await asMe.post(`/requests/${asked.id}/approve`);

    const again = await asMe.post(`/requests/${asked.id}/approve`);

    expect(again.status).toBe(200);
    expect(again.body.status).toBe('approved');
    expect(await Loan.countDocuments({ book: dune.id })).toBe(1);
});

test('approving a request Sam cancelled is refused (409)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id, status: 'cancelled', cancelledAt: new Date() });

    const res = await asMe.post(`/requests/${asked.id}/approve`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This request was cancelled');
    expect(await Loan.countDocuments()).toBe(0);
});

test('approving a request that isn\'t there says so (404)', async () => {
    const nothing = new mongoose.Types.ObjectId().toString();

    const missing = await asMe.post(`/requests/${nothing}/approve`);
    const wrongShape = await asMe.post('/requests/abc/approve');

    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe('Request not found');
    expect(wrongShape.status).toBe(404);
});

test('after I approve, Sam sees the request as approved, Dune is lent out, and my Requests list is empty', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });

    await asMe.post(`/requests/${asked.id}/approve`);
    const samsRequests = await asSam.get('/me/requests');
    const shelf = await asSam.get('/shelf');
    const myList = await asMe.get('/requests');

    expect(samsRequests.body.map((r) => [r.book.title, r.status])).toEqual([['Dune', 'approved']]);
    expect(shelf.body.find((b) => b.title === 'Dune').state).toBe('lent out');
    expect(myList.body).toEqual([]);
});

test('Sam can\'t cancel a request I approved (409)', async () => {
    const asked = await Request.create({ book: dune.id, friend: sam.id });
    await asMe.post(`/requests/${asked.id}/approve`);

    const res = await asSam.post(`/requests/${asked.id}/cancel`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This request has already been answered');
    expect((await Request.findById(asked.id)).status).toBe('approved');
});

test('Sam\'s panel shows all of Sam\'s requests, newest first, and never Alex\'s (200)', async () => {
    const [matilda, emma] = await threeMoreBooks();
    await Request.create({ book: matilda.id, friend: sam.id, askedAt: new Date('2026-10-01T12:00:00Z'), status: 'cancelled', cancelledAt: new Date() });
    await Request.create({ book: dune.id, friend: sam.id, askedAt: new Date('2026-10-20T12:00:00Z') });
    await Request.create({ book: emma.id, friend: alex.id });

    const res = await asMe.get(`/friends/${sam.id}/requests`);

    expect(res.status).toBe(200);
    expect(res.body.map((r) => [r.book.title, r.status])).toEqual([
        ['Dune', 'waiting'],
        ['Matilda', 'cancelled'],
    ]);
});

test('requests for a friend who isn\'t there says so (404)', async () => {
    const nothing = new mongoose.Types.ObjectId().toString();

    const res = await asMe.get(`/friends/${nothing}/requests`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Friend not found');
});
