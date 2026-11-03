// Tests Sam rating a copy, PUT /me/ratings/:bookId: the whole trip from Sam's sign-in to the pretend database and back.
// "who is this?" is the pretend one, so Sam signs in without Google.
jest.mock('../auth/who-is-this');
const request = require('supertest');
const app = require('../app');
const { friendSignIn } = require('../auth/who-is-this');
const Book = require('../books/book.model');
const Friend = require('../friends/friend.model');
const Loan = require('../loans/loan.model');
const testDb = require('../../test-db');

const asSam = request.agent(app).set('Authorization', 'Bearer ' + friendSignIn('sam@gmail.com'));

beforeAll(testDb.start, 60000);
beforeEach(testDb.clear);
afterAll(testDb.stop);

// Sam, and the signed Dune that Sam borrowed once and brought back
async function samReturnedDune() {
    const sam = await Friend.create({ name: 'Sam', email: 'sam@gmail.com' });
    const dune = await Book.create({ title: 'Dune', author: 'Frank Herbert', copyNote: 'signed' });
    await Loan.create({ book: dune.id, friend: sam.id, returnedAt: new Date() });
    return { sam, dune };
}

test('Sam gives the signed Dune 4 stars after returning it (200)', async () => {
    const { dune } = await samReturnedDune();

    const res = await asSam.put('/me/ratings/' + dune.id).send({ stars: 4 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ book: dune.id, stars: 4 });
});

test('Sam can\'t rate Dune while he has it for the first time: he hasn\'t returned it yet (409)', async () => {
    const sam = await Friend.create({ name: 'Sam', email: 'sam@gmail.com' });
    const dune = await Book.create({ title: 'Dune', author: 'Frank Herbert' });
    await Loan.create({ book: dune.id, friend: sam.id });

    const res = await asSam.put('/me/ratings/' + dune.id).send({ stars: 4 });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'This book can be rated once you\'ve returned it' });
});

test('Sam can\'t rate Mum\'s copy, which only Alex has borrowed (409)', async () => {
    await samReturnedDune();
    const alex = await Friend.create({ name: 'Alex', email: 'alex@gmail.com' });
    const mumsDune = await Book.create({ title: 'Dune', author: 'Frank Herbert', copyNote: "Mum's copy" });
    await Loan.create({ book: mumsDune.id, friend: alex.id, returnedAt: new Date() });

    const res = await asSam.put('/me/ratings/' + mumsDune.id).send({ stars: 4 });

    expect(res.status).toBe(409);
});

test('Sam can rate the signed Dune while he has it again, because he returned it once before (200)', async () => {
    const { sam, dune } = await samReturnedDune();
    await Loan.create({ book: dune.id, friend: sam.id });

    const res = await asSam.put('/me/ratings/' + dune.id).send({ stars: 5 });

    expect(res.status).toBe(200);
});

test.each([0, 6, 3.5, '4', null])('%p stars is refused: stars are a whole number from 1 to 5 (400)', async (stars) => {
    const { dune } = await samReturnedDune();

    const res = await asSam.put('/me/ratings/' + dune.id).send({ stars });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Pick from 1 to 5 stars' });
});

test('sending no stars at all is refused (400)', async () => {
    const { dune } = await samReturnedDune();

    const res = await asSam.put('/me/ratings/' + dune.id);

    expect(res.status).toBe(400);
});

test('I can\'t rate: only friends rate (403)', async () => {
    const { dune } = await samReturnedDune();

    const res = await request(app).put('/me/ratings/' + dune.id).set('Authorization', 'Bearer owner-sign-in').send({ stars: 5 });

    expect(res.status).toBe(403);
});

test('a stranger can\'t rate (401)', async () => {
    const { dune } = await samReturnedDune();

    const res = await request(app).put('/me/ratings/' + dune.id).set('Authorization', 'Bearer stranger-sign-in').send({ stars: 5 });

    expect(res.status).toBe(401);
});

test('a book ID in the wrong shape, like "abc", is "Book not found" (404)', async () => {
    await samReturnedDune();

    const res = await asSam.put('/me/ratings/abc').send({ stars: 4 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Book not found' });
});

test('Sam can\'t rate a book that was deleted, even if an old loan says he returned it (404)', async () => {
    const { dune } = await samReturnedDune();
    await Book.deleteOne({ _id: dune.id }); // before 2 November, a lent book could still be deleted

    const res = await asSam.put('/me/ratings/' + dune.id).send({ stars: 4 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Book not found' });
});

// the shelf tells Sam where he can rate, and his own stars, through GET /shelf
describe('Sam\'s stars on the shelf', () => {
    test('a copy Sam returned says he can rate it, with his stars once he has; others say neither', async () => {
        const { sam, dune } = await samReturnedDune();
        const mumsDune = await Book.create({ title: 'Dune', author: 'Frank Herbert', copyNote: "Mum's copy" });
        const matilda = await Book.create({ title: 'Matilda', author: 'Roald Dahl' });
        await Loan.create({ book: mumsDune.id, friend: sam.id, returnedAt: new Date() });
        await asSam.put('/me/ratings/' + dune.id).send({ stars: 4 });

        const res = await asSam.get('/shelf');

        expect(res.body).toEqual([
            { _id: dune.id, title: 'Dune', author: 'Frank Herbert', copyNote: 'signed', state: 'at home', canRate: true, myStars: 4, averageStars: 4, ratingCount: 1 },
            { _id: mumsDune.id, title: 'Dune', author: 'Frank Herbert', copyNote: "Mum's copy", state: 'at home', canRate: true },
            { _id: matilda.id, title: 'Matilda', author: 'Roald Dahl', state: 'at home' },
        ]);
    });

    test('the signed Dune and Mum\'s copy each keep their own stars', async () => {
        const { sam, dune } = await samReturnedDune();
        const mumsDune = await Book.create({ title: 'Dune', author: 'Frank Herbert', copyNote: "Mum's copy" });
        await Loan.create({ book: mumsDune.id, friend: sam.id, returnedAt: new Date() });
        await asSam.put('/me/ratings/' + dune.id).send({ stars: 5 });
        await asSam.put('/me/ratings/' + mumsDune.id).send({ stars: 2 });

        const res = await asSam.get('/shelf');

        expect(res.body.map((book) => book.myStars)).toEqual([5, 2]);
    });

    test('rating Dune again changes Sam\'s stars from 3 to 5, and the first stars are gone', async () => {
        const { dune } = await samReturnedDune();

        await asSam.put('/me/ratings/' + dune.id).send({ stars: 3 });
        const again = await asSam.put('/me/ratings/' + dune.id).send({ stars: 5 });
        const res = await asSam.get('/shelf');

        expect(again.body).toEqual({ book: dune.id, stars: 5 });
        expect(res.body[0].myStars).toBe(5);
    });

    test('Sam never sees Alex\'s stars, even on a copy they both rated', async () => {
        const { dune } = await samReturnedDune();
        const alex = await Friend.create({ name: 'Alex', email: 'alex@gmail.com' });
        await Loan.create({ book: dune.id, friend: alex.id, returnedAt: new Date() });
        const asAlex = request.agent(app).set('Authorization', 'Bearer ' + friendSignIn('alex@gmail.com'));
        await asAlex.put('/me/ratings/' + dune.id).send({ stars: 1 });
        await asSam.put('/me/ratings/' + dune.id).send({ stars: 4 });

        const samsShelf = await asSam.get('/shelf');
        const alexsShelf = await asAlex.get('/shelf');

        expect(samsShelf.body[0].myStars).toBe(4);
        expect(alexsShelf.body[0].myStars).toBe(1);
        expect(JSON.stringify(samsShelf.body)).not.toContain(alex.id);
    });
});

// every friend's stars for one copy, averaged, with how many rated it. On Sam's shelf (GET /shelf) and on mine (GET /books)
describe('the average rating', () => {
    const asOwner = request.agent(app).set('Authorization', 'Bearer owner-sign-in');

    // Alex has returned this copy too, and can rate it
    async function alexReturned(book) {
        const alex = await Friend.create({ name: 'Alex', email: 'alex@gmail.com' });
        await Loan.create({ book: book.id, friend: alex.id, returnedAt: new Date() });
        return request.agent(app).set('Authorization', 'Bearer ' + friendSignIn('alex@gmail.com'));
    }

    test('Sam gives the signed Dune 4 and Alex gives it 5: both shelves say 4.5 from 2 ratings', async () => {
        const { dune } = await samReturnedDune();
        const asAlex = await alexReturned(dune);
        await asSam.put('/me/ratings/' + dune.id).send({ stars: 4 });
        await asAlex.put('/me/ratings/' + dune.id).send({ stars: 5 });

        const samsShelf = await asSam.get('/shelf');
        const myShelf = await asOwner.get('/books');

        expect(samsShelf.body[0]).toMatchObject({ myStars: 4, averageStars: 4.5, ratingCount: 2 });
        expect(myShelf.body[0]).toMatchObject({ averageStars: 4.5, ratingCount: 2 });
    });

    test('a copy no one has rated has no average and no count, not 0', async () => {
        await samReturnedDune();

        const samsShelf = await asSam.get('/shelf');
        const myShelf = await asOwner.get('/books');

        expect(samsShelf.body[0]).not.toHaveProperty('averageStars');
        expect(samsShelf.body[0]).not.toHaveProperty('ratingCount');
        expect(myShelf.body[0]).not.toHaveProperty('averageStars');
        expect(myShelf.body[0]).not.toHaveProperty('ratingCount');
    });

    test('the signed Dune and Mum\'s copy each have their own average', async () => {
        const { sam, dune } = await samReturnedDune();
        const mumsDune = await Book.create({ title: 'Dune', author: 'Frank Herbert', copyNote: "Mum's copy" });
        await Loan.create({ book: mumsDune.id, friend: sam.id, returnedAt: new Date() });
        await asSam.put('/me/ratings/' + dune.id).send({ stars: 5 });
        await asSam.put('/me/ratings/' + mumsDune.id).send({ stars: 2 });

        const res = await asOwner.get('/books');

        expect(res.body.map((book) => [book.averageStars, book.ratingCount])).toEqual([[5, 1], [2, 1]]);
    });

    test('Sam changes his 3 stars to 5: the average uses the 5, and he still counts once', async () => {
        const { dune } = await samReturnedDune();
        const asAlex = await alexReturned(dune);
        await asAlex.put('/me/ratings/' + dune.id).send({ stars: 4 });
        await asSam.put('/me/ratings/' + dune.id).send({ stars: 3 });
        await asSam.put('/me/ratings/' + dune.id).send({ stars: 5 });

        const res = await asOwner.get('/books');

        expect(res.body[0]).toMatchObject({ averageStars: 4.5, ratingCount: 2 });
    });

    test('my shelf shows only the average and count, never who gave what', async () => {
        const { sam, dune } = await samReturnedDune();
        await asSam.put('/me/ratings/' + dune.id).send({ stars: 4 });

        const res = await asOwner.get('/books');

        expect(res.body[0]).not.toHaveProperty('myStars');
        expect(JSON.stringify(res.body)).not.toContain(sam.id);
    });
});
