// Tests the duplicate check against the pretend database from test-db.js, so real data is never touched.
const Book = require('../src/books/book.model');
const Friend = require('../src/friends/friend.model');
const Loan = require('../src/loans/loan.model');
const testDb = require('../test-db');
const { findDuplicates, findRulesSwitchedOn } = require('./check-duplicates');

// The pretend database switches on the two database rules, so it would refuse the duplicates these tests need.
// Switch them off, like a live database where they couldn't be set up
async function switchRulesOff() {
    await Loan.init();   // wait until the rules are set up, so they aren't set up again after we remove them
    await Friend.init();
    await Loan.collection.dropIndexes();
    await Friend.collection.dropIndexes();
}

beforeAll(async () => {
    await testDb.start();
    await switchRulesOff();
}, 60000); // the first run downloads the pretend database, so allow up to a minute
beforeEach(testDb.clear);
afterAll(testDb.stop);

test('finds Dune when it has two loans still out', async () => {
    const dune = await Book.create({ title: 'Dune', author: 'Frank Herbert' });
    const sam = await Friend.create({ name: 'Sam' });
    const alex = await Friend.create({ name: 'Alex' });
    await Loan.create({ book: dune._id, friend: sam._id, lentAt: new Date('2026-10-01') });
    await Loan.create({ book: dune._id, friend: alex._id, lentAt: new Date('2026-10-02') });

    const { books } = await findDuplicates();

    expect(books).toEqual([{ title: 'Dune', friends: ['Sam', 'Alex'] }]);
});

test("doesn't count a loan that came back", async () => {
    const dune = await Book.create({ title: 'Dune', author: 'Frank Herbert' });
    const sam = await Friend.create({ name: 'Sam' });
    const alex = await Friend.create({ name: 'Alex' });
    await Loan.create({ book: dune._id, friend: sam._id, returnedAt: new Date('2026-10-10') });
    await Loan.create({ book: dune._id, friend: alex._id });

    const { books } = await findDuplicates();

    expect(books).toEqual([]);
});

test('finds two friends with the same email, even written differently', async () => {
    await Friend.create({ name: 'Sam', email: 'sam@gmail.com' });
    await Friend.create({ name: 'Sammy', email: ' Sam@Gmail.com' });

    const { emails } = await findDuplicates();

    expect(emails).toEqual([{ email: 'sam@gmail.com', friends: ['Sam', 'Sammy'] }]);
});

test("doesn't count friends with no email", async () => {
    await Friend.create({ name: 'Gran' });
    await Friend.create({ name: 'Grandad' });

    const { emails } = await findDuplicates();

    expect(emails).toEqual([]);
});

// an empty email is still an email to the database, so two of them would stop the rule being set up
test('finds two friends saved with an empty email', async () => {
    await Friend.create({ name: 'Gran', email: '' });
    await Friend.create({ name: 'Grandad', email: '' });

    const { emails } = await findDuplicates();

    expect(emails).toEqual([{ email: '', friends: ['Gran', 'Grandad'] }]);
});

test('tells whether each database rule is switched on', async () => {
    expect(await findRulesSwitchedOn()).toEqual({ oneLoanPerBook: false, oneFriendPerEmail: false });

    await Loan.syncIndexes();   // switch the rules back on, like a database where they were set up
    await Friend.syncIndexes();
    expect(await findRulesSwitchedOn()).toEqual({ oneLoanPerBook: true, oneFriendPerEmail: true });

    await switchRulesOff(); // so a test added below this one starts the same as the others
});
