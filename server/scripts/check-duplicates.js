// Looks for duplicates in the database that would stop the two database rules being set up (#82):
// one loan out per book, and one friend per email. Only reads, never changes anything.
// Run it from server/ with `npm run check-duplicates`. It uses MONGO_URL from .env
const mongoose = require('mongoose');
require('../src/books/book.model'); // loaded so each loan can look up its book's title
const Friend = require('../src/friends/friend.model');
const Loan = require('../src/loans/loan.model');
const tidyEmail = require('../src/tidy-email');

// Books with more than one loan still out. Each comes back with its title and who has it, oldest loan first
async function findBooksLentTwice() {
    const loansOut = await Loan.find({ returnedAt: null }).sort({ lentAt: 1 }).populate('book').populate('friend');
    const byBook = new Map();
    for (const loan of loansOut) {
        const id = loan.book._id.toString();
        if (!byBook.has(id)) byBook.set(id, { title: loan.book.title, friends: [] });
        byBook.get(id).friends.push(loan.friend.name);
    }
    return [...byBook.values()].filter((book) => book.friends.length > 1);
}

// Emails shared by more than one friend. "Sam@Gmail.com " and "sam@gmail.com" count as the same, like everywhere else in the app
async function findSharedEmails() {
    const friendsWithEmail = await Friend.find({ email: { $type: 'string' } }).sort({ _id: 1 });
    const byEmail = new Map();
    for (const friend of friendsWithEmail) {
        const email = tidyEmail(friend.email);
        if (!byEmail.has(email)) byEmail.set(email, { email, friends: [] });
        byEmail.get(email).friends.push(friend.name);
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

async function findRulesSwitchedOn() {
    return {
        oneLoanPerBook: await hasUniqueRule(Loan, 'book'),
        oneFriendPerEmail: await hasUniqueRule(Friend, 'email'),
    };
}

function printReport({ books, emails }, rules) {
    console.log('Books with more than one loan still out:');
    if (books.length === 0) console.log('  none');
    for (const book of books) console.log(`  ${book.title}: lent to ${book.friends.join(', ')}`);

    console.log('Friends sharing an email:');
    if (emails.length === 0) console.log('  none');
    for (const shared of emails) console.log(`  ${shared.email || '(empty email)'}: ${shared.friends.join(', ')}`);

    console.log('Database rules:');
    console.log(`  one loan out per book: ${rules.oneLoanPerBook ? 'on' : 'OFF'}`);
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
        printReport(await findDuplicates(), await findRulesSwitchedOn());
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

module.exports = { findDuplicates, findRulesSwitchedOn };
