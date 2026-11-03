// Looks for duplicates in the database that would stop the two database rules being set up (#82):
// one active loan per book, and one friend per email. Only reads, never changes anything.
// Run it from server/ with `npm run check-duplicates`. It uses MONGO_URL from .env
const mongoose = require('mongoose');
const Book = require('../src/books/book.model');
const Friend = require('../src/friends/friend.model');
const Loan = require('../src/loans/loan.model');
const tidyEmail = require('../src/tidy-email');

// Each friend's name, by id. A friend that's been deleted shows as "(deleted friend <id>)"
async function friendNames(ids) {
    const friends = await Friend.find({ _id: { $in: ids } });
    const names = new Map(friends.map((friend) => [friend._id.toString(), friend.name]));
    return (id) => names.get(id.toString()) ?? `(deleted friend ${id})`;
}

// Books with more than one active loan. Each comes back with its title and who has it, oldest loan first.
// "Active" here is exactly what the database rule counts (returnedAt saved as null).
// Loans are grouped by the book they point at, so a book deleted before 2 November is still found
async function findBooksLentTwice() {
    const activeLoans = await Loan.find({ returnedAt: { $type: 'null' } }).sort({ lentAt: 1 });
    const loansByBook = new Map();
    for (const loan of activeLoans) {
        const bookId = loan.book.toString();
        if (!loansByBook.has(bookId)) loansByBook.set(bookId, []);
        loansByBook.get(bookId).push(loan);
    }
    const lentTwice = [...loansByBook.entries()].filter(([, loans]) => loans.length > 1);

    const books = await Book.find({ _id: { $in: lentTwice.map(([bookId]) => bookId) } });
    const titles = new Map(books.map((book) => [book._id.toString(), book.title]));
    const nameOf = await friendNames(lentTwice.flatMap(([, loans]) => loans.map((loan) => loan.friend)));
    return lentTwice.map(([bookId, loans]) => ({
        title: titles.get(bookId) ?? `(deleted book ${bookId})`,
        friends: loans.map((loan) => nameOf(loan.friend)),
    }));
}

// Emails shared by more than one friend. "Sam@Gmail.com " and "sam@gmail.com" count as the same, like everywhere else in the app.
// Each friend's email is also given as it was saved, because only exactly the same email stops the database rule
async function findSharedEmails() {
    const friendsWithEmail = await Friend.find({ email: { $type: 'string' } }).sort({ _id: 1 });
    const byEmail = new Map();
    for (const friend of friendsWithEmail) {
        const email = tidyEmail(friend.email);
        if (!byEmail.has(email)) byEmail.set(email, { email, friends: [] });
        byEmail.get(email).friends.push({ name: friend.name, savedAs: friend.email });
    }
    return [...byEmail.values()].filter((shared) => shared.friends.length > 1);
}

async function findDuplicates() {
    return { books: await findBooksLentTwice(), emails: await findSharedEmails() };
}

// Whether the database really set up each rule. If duplicates were already there, it quietly skips the rule
async function hasUniqueRule(model, field) {
    const indexes = await model.collection.indexes();
    return indexes.some((index) => index.unique && index.key[field] === 1);
}

async function checkDatabaseRules() {
    return {
        oneLoanPerBook: await hasUniqueRule(Loan, 'book'),
        oneFriendPerEmail: await hasUniqueRule(Friend, 'email'),
    };
}

function printReport({ books, emails }, rules) {
    console.log('Books with more than one active loan:');
    if (books.length === 0) console.log('  none');
    for (const book of books) console.log(`  ${book.title}: lent to ${book.friends.join(', ')}`);

    console.log('Friends sharing an email:');
    if (emails.length === 0) console.log('  none');
    for (const shared of emails) {
        const savedAs = shared.friends.map((friend) => `${friend.name} (saved as "${friend.savedAs}")`);
        console.log(`  ${shared.email || '(empty email)'}: ${savedAs.join(', ')}`);
    }

    console.log('Database rules:');
    console.log(`  one active loan per book: ${rules.oneLoanPerBook ? 'on' : 'OFF'}`);
    console.log(`  one friend per email: ${rules.oneFriendPerEmail ? 'on' : 'OFF'}`);
    if (!rules.oneLoanPerBook || !rules.oneFriendPerEmail) {
        console.log('A rule that is OFF gets set up the next time the server starts, once its duplicates are fixed.');
    }
}

async function main() {
    require('dotenv').config();
    // autoIndex off, so connecting doesn't try to set up the rules. This script only reads
    await mongoose.connect(process.env.MONGO_URL, { autoIndex: false });
    try {
        printReport(await findDuplicates(), await checkDatabaseRules());
    } finally {
        await mongoose.disconnect();
    }
}

// only run when started from the command line, not when the tests load this file
if (require.main === module) {
    main().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = { findDuplicates, checkDatabaseRules };
