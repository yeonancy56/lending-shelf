// Tests the whole trip for friends: request -> route -> controller -> service -> DAO -> database, and back.
// Uses the pretend database from test-db.js, so real friends are never touched.
jest.mock('../auth/who-is-this'); // the pretend "who is this?", so Google is never asked
const request = require('supertest');
const app = require('../app');
// every request in this file is sent signed in as the owner, like me using the page
const owner = request.agent(app).set('Authorization', 'Bearer owner-sign-in');
const Friend = require('./friend.model');
const Book = require('../books/book.model');
const Loan = require('../loans/loan.model');
const testDb = require('../../test-db');

beforeAll(testDb.start, 60000); // the first run downloads the pretend database, so allow up to a minute
beforeEach(testDb.clear);         // every test starts with an empty friends list
afterAll(testDb.stop);

test('POST /friends adds Sam', async () => {
    const res = await owner.post('/friends').send({ name: 'Sam' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Sam');
    expect(await Friend.countDocuments()).toBe(1);
});

test('POST /friends without a name asks for one (400)', async () => {
    const res = await owner.post('/friends').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Every friend needs a name");
    expect(await Friend.countDocuments()).toBe(0);
});

test('POST /friends with nothing sent at all still gets a clear message (400)', async () => {
    const res = await owner.post('/friends'); // no form at all, not even an empty one

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Every friend needs a name");
});

test('POST /friends with only spaces as the name asks for one (400)', async () => {
    const res = await owner.post('/friends').send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Every friend needs a name");
    expect(await Friend.countDocuments()).toBe(0);
});

// Friend emails: optional, so Sam can sign in later. My owner email comes from the server's settings
describe('a friend\'s Google email', () => {
    beforeEach(() => {
        process.env.OWNER_EMAIL = 'nancy@gmail.com';
    });

    test('is optional: Gran saves with no email, like today', async () => {
        const res = await owner.post('/friends').send({ name: 'Gran' });

        expect(res.status).toBe(201);
        expect(res.body.email).toBeUndefined();
    });

    test('an empty email box counts as no email', async () => {
        const res = await owner.post('/friends').send({ name: 'Gran', email: '   ' });

        expect(res.status).toBe(201);
        expect(res.body.email).toBeUndefined();
    });

    test('is saved without the extra spaces and in small letters', async () => {
        const res = await owner.post('/friends').send({ name: 'Sam', email: ' Sam@Gmail.com ' });

        expect(res.status).toBe(201);
        expect(res.body.email).toBe('sam@gmail.com');
    });

    test('two friends without an email is fine', async () => {
        await owner.post('/friends').send({ name: 'Gran' });
        const res = await owner.post('/friends').send({ name: 'Grandad' });

        expect(res.status).toBe(201);
    });

    test('an email another friend already has is refused, ignoring capitals and spaces', async () => {
        await owner.post('/friends').send({ name: 'Sam', email: 'sam@gmail.com' });

        const res = await owner.post('/friends').send({ name: 'Alex', email: ' SAM@gmail.com ' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Sam already has this email.');
        expect(await Friend.countDocuments()).toBe(1);
    });

    test('my own owner email is refused, ignoring capitals and spaces', async () => {
        const res = await owner.post('/friends').send({ name: 'Sam', email: ' Nancy@Gmail.com' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("That's your own email. A friend needs their own.");
        expect(await Friend.countDocuments()).toBe(0);
    });

    test('can be added to a friend who had none', async () => {
        const sam = await owner.post('/friends').send({ name: 'Sam' });

        const res = await owner.put('/friends/' + sam.body._id).send({ name: 'Sam', email: ' Sam@Gmail.com ' });

        expect(res.status).toBe(200);
        expect(res.body.email).toBe('sam@gmail.com');
    });

    test('can be changed', async () => {
        const sam = await owner.post('/friends').send({ name: 'Sam', email: 'sam@gmail.com' });

        await owner.put('/friends/' + sam.body._id).send({ name: 'Sam', email: 'sam.new@gmail.com' });

        expect((await owner.get('/friends/' + sam.body._id)).body.email).toBe('sam.new@gmail.com');
    });

    test('can be removed by emptying the box, and then another friend can use it', async () => {
        const sam = await owner.post('/friends').send({ name: 'Sam', email: 'sam@gmail.com' });

        const res = await owner.put('/friends/' + sam.body._id).send({ name: 'Sam', email: '' });

        expect(res.status).toBe(200);
        expect((await owner.get('/friends/' + sam.body._id)).body.email).toBeUndefined();
        expect((await owner.post('/friends').send({ name: 'Alex', email: 'sam@gmail.com' })).status).toBe(201);
    });

    test('saving Sam with Sam\'s own email again isn\'t a clash with Sam', async () => {
        const sam = await owner.post('/friends').send({ name: 'Sam', email: 'sam@gmail.com' });

        const res = await owner.put('/friends/' + sam.body._id).send({ name: 'Sammy', email: 'SAM@gmail.com' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Sammy');
    });

    test('changing to an email another friend has is refused, and Sam keeps the old one', async () => {
        await owner.post('/friends').send({ name: 'Alex', email: 'alex@gmail.com' });
        const sam = await owner.post('/friends').send({ name: 'Sam', email: 'sam@gmail.com' });

        const res = await owner.put('/friends/' + sam.body._id).send({ name: 'Sam', email: 'Alex@gmail.com' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Alex already has this email.');
        expect((await owner.get('/friends/' + sam.body._id)).body.email).toBe('sam@gmail.com');
    });

    test('changing to my own owner email is refused', async () => {
        const sam = await owner.post('/friends').send({ name: 'Sam' });

        const res = await owner.put('/friends/' + sam.body._id).send({ name: 'Sam', email: 'nancy@gmail.com' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("That's your own email. A friend needs their own.");
    });

    test('editing a friend that doesn\'t exist says so (404)', async () => {
        const res = await owner.put('/friends/000000000000000000000000').send({ name: 'Sam', email: 'sam@gmail.com' });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Friend not found');
    });
});

test('editing a friend to have no name asks for one (400), now that the page can edit names', async () => {
    const sam = await owner.post('/friends').send({ name: 'Sam' });

    const res = await owner.put('/friends/' + sam.body._id).send({ name: '  ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Every friend needs a name');
    expect((await owner.get('/friends/' + sam.body._id)).body.name).toBe('Sam');
});

test('DELETE /friends/:id refuses to delete Sam while Sam has Dune (409)', async () => {
    const sam = await Friend.create({ name: 'Sam' });
    const dune = await Book.create({ title: 'Dune', author: 'Frank Herbert' });
    await Loan.create({ book: dune._id, friend: sam._id });

    const res = await owner.delete(`/friends/${sam._id}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("This friend has borrowed before, so they can't be deleted. Their loans need them.");
    const friends = await owner.get('/friends');
    expect(friends.body).toHaveLength(1); // Sam is still on the list
});

test('DELETE /friends/:id refuses to delete Sam after Sam gave Dune back, because the past loan needs Sam (409)', async () => {
    const sam = await Friend.create({ name: 'Sam' });
    const dune = await Book.create({ title: 'Dune', author: 'Frank Herbert' });
    await Loan.create({ book: dune._id, friend: sam._id, returnedAt: new Date() });

    const res = await owner.delete(`/friends/${sam._id}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("This friend has borrowed before, so they can't be deleted. Their loans need them.");
    const friends = await owner.get('/friends');
    expect(friends.body).toHaveLength(1); // Sam is still on the list
});

test('DELETE /friends/:id deletes Alex, who never borrowed (204)', async () => {
    const alex = await Friend.create({ name: 'Alex' });

    const res = await owner.delete(`/friends/${alex._id}`);

    expect(res.status).toBe(204);
    const friends = await owner.get('/friends');
    expect(friends.body).toHaveLength(0); // Alex is gone
});

test('DELETE /friends/:id for a friend who isn\'t there says so (404)', async () => {
    const gone = await Friend.create({ name: 'Sam' });
    await Friend.findByIdAndDelete(gone._id);

    const res = await owner.delete(`/friends/${gone._id}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Friend not found');
});
