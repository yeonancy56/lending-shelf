// Tests for the loan rules. No database needed:
// the real DAO is swapped for a fake one, and each test tells the fake what to answer.
jest.mock('./loan.dao');
jest.mock('../books/book.dao');
jest.mock('../friends/friend.dao');
const loanDao = require('./loan.dao');
const bookDao = require('../books/book.dao');
const friendDao = require('../friends/friend.dao');
const loanService = require('./loan.service');

const DUNE = 'dune-id';
const SAM = 'sam-id';
const DUNE_LOAN = 'dune-loan-id';

// Before each test: the fake DAOs say "all clear" (Dune and Sam exist, Dune is free, Sam has no books, nothing overdue).
// Each test then changes only the one answer it cares about.
beforeEach(() => {
    jest.resetAllMocks();
    bookDao.exists.mockResolvedValue(true);
    friendDao.exists.mockResolvedValue(true);
    loanDao.findActiveByBook.mockResolvedValue(null);
    loanDao.countActiveByFriend.mockResolvedValue(0);
    loanDao.findOverdueByFriend.mockResolvedValue(null);
});

afterEach(() => {
    jest.useRealTimers(); // put the real clock back, even if a test failed
});

// happy path: Sam has 2 books, Dune is free -> lending works
test('lends Dune to Sam when no rule is broken', async () => {
    loanDao.countActiveByFriend.mockResolvedValue(2);

    await loanService.lendBook(DUNE, SAM);

    expect(loanDao.create).toHaveBeenCalledWith({ book: DUNE, friend: SAM });
});

// before any rule: Dune or Sam isn't real -> stop straight away
test('does not lend a book that does not exist', async () => {
    bookDao.exists.mockResolvedValue(false);

    await expect(loanService.lendBook(DUNE, SAM)).rejects.toThrow('That book does not exist');
    expect(bookDao.exists).toHaveBeenCalledWith(DUNE);
    expect(loanDao.findActiveByBook).not.toHaveBeenCalled(); // never got as far as the rules
    expect(loanDao.create).not.toHaveBeenCalled();
});

test('does not lend to a friend who does not exist', async () => {
    friendDao.exists.mockResolvedValue(false);

    await expect(loanService.lendBook(DUNE, SAM)).rejects.toThrow('That friend does not exist');
    expect(friendDao.exists).toHaveBeenCalledWith(SAM);
    expect(loanDao.findActiveByBook).not.toHaveBeenCalled();
    expect(loanDao.create).not.toHaveBeenCalled();
});

// rule 1: Dune is already lent out
test('does not lend Dune when Dune is already out', async () => {
    loanDao.findActiveByBook.mockResolvedValue({ book: DUNE });

    await expect(loanService.lendBook(DUNE, SAM)).rejects.toThrow('This book is already lent out');
    expect(loanDao.findActiveByBook).toHaveBeenCalledWith(DUNE); // asked about Dune, not Sam
    expect(loanDao.create).not.toHaveBeenCalled();
});

// rule 2: Sam already has 3 books
test('does not lend Sam a 4th book', async () => {
    loanDao.countActiveByFriend.mockResolvedValue(3);

    await expect(loanService.lendBook(DUNE, SAM)).rejects.toThrow('this friend already has 3 books');
    expect(loanDao.countActiveByFriend).toHaveBeenCalledWith(SAM); // counted Sam's books, not Dune's
    expect(loanDao.create).not.toHaveBeenCalled();
});

// rule 3: Sam has a book out for more than 14 days
test('does not lend to Sam when Sam has an overdue book', async () => {
    loanDao.findOverdueByFriend.mockResolvedValue({ friend: SAM });

    await expect(loanService.lendBook(DUNE, SAM)).rejects.toThrow('This friend has an overdue book');
    expect(loanDao.findOverdueByFriend).toHaveBeenCalledWith(SAM, expect.any(Date)); // checked Sam, not Dune
    expect(loanDao.create).not.toHaveBeenCalled();
});

// rule 3, part 2: the service asks for loans older than 14 days, not some other number.
// (The "older than" check itself happens in the database, so the DAO's own tests would cover that.)
test('asks for loans older than 14 days', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-30'));

    await loanService.lendBook(DUNE, SAM);

    expect(loanDao.findOverdueByFriend).toHaveBeenCalledWith(SAM, new Date('2026-10-16')); // 14 days before today
});

// returning: Dune can't be returned twice
test('does not return Dune twice', async () => {
    loanDao.findById.mockResolvedValue({ book: DUNE, returnedAt: new Date() });

    await expect(loanService.returnBook(DUNE_LOAN)).rejects.toThrow('This book was already returned');
    expect(loanDao.markReturned).not.toHaveBeenCalled();
});
