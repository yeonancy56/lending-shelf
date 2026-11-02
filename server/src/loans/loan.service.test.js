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

// Before each test: the fake DAOs say "all clear" (Dune and Sam exist, Dune is free, Sam has no books out).
// Each test then changes only the one answer it cares about.
beforeEach(() => {
    jest.resetAllMocks();
    bookDao.exists.mockResolvedValue(true);
    friendDao.exists.mockResolvedValue(true);
    loanDao.findActiveByBook.mockResolvedValue(null);
    loanDao.countActiveByFriend.mockResolvedValue(0);
    loanDao.findActiveByFriend.mockResolvedValue([]);
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

// a pretend loan of Matilda to Sam, still out, lent at the given moment
function matildaLoan(lentAt) {
    const loan = { book: 'matilda-id', friend: SAM, lentAt: new Date(lentAt), returnedAt: null };
    return { ...loan, toObject: () => loan };
}

// rule 3: Sam has a book out for more than 14 days
test('does not lend to Sam when Sam has an overdue book', async () => {
    loanDao.findActiveByFriend.mockResolvedValue([matildaLoan(Date.now() - 15 * 24 * 60 * 60 * 1000)]); // out for 15 days

    await expect(loanService.lendBook(DUNE, SAM)).rejects.toThrow('This friend has an overdue book');
    expect(loanDao.findActiveByFriend).toHaveBeenCalledWith(SAM); // checked Sam, not Dune
    expect(loanDao.create).not.toHaveBeenCalled();
});

// the exact moment, from the glossary: lent Monday 2 November at 8pm, overdue from just after 8pm on Monday 16 November.
// The red line and rule 3 must agree, so each test checks both
test('at exactly 14 days, Matilda is not overdue yet, and Sam can still borrow', async () => {
    const matilda = matildaLoan('2026-11-02T20:00:00Z');
    loanDao.findActiveByFriend.mockResolvedValue([matilda]);
    loanDao.findAll.mockResolvedValue([matilda]);
    jest.useFakeTimers().setSystemTime(new Date('2026-11-16T20:00:00Z')); // 14 days to the second

    const [listed] = await loanService.listLoans();
    expect(listed.overdue).toBe(false);
    await loanService.lendBook(DUNE, SAM);
    expect(loanDao.create).toHaveBeenCalled();
});

test('one second after 14 days, Matilda is overdue, and Sam can not borrow', async () => {
    const matilda = matildaLoan('2026-11-02T20:00:00Z');
    loanDao.findActiveByFriend.mockResolvedValue([matilda]);
    loanDao.findAll.mockResolvedValue([matilda]);
    jest.useFakeTimers().setSystemTime(new Date('2026-11-16T20:00:01Z')); // one second later

    const [listed] = await loanService.listLoans();
    expect(listed.overdue).toBe(true);
    await expect(loanService.lendBook(DUNE, SAM)).rejects.toThrow('This friend has an overdue book');
    expect(loanDao.create).not.toHaveBeenCalled();
});

// returning: Dune can't be returned twice
test('does not return Dune twice', async () => {
    loanDao.findById.mockResolvedValue({ book: DUNE, returnedAt: new Date() });

    await expect(loanService.returnBook(DUNE_LOAN)).rejects.toThrow('This book was already returned');
    expect(loanDao.markReturned).not.toHaveBeenCalled();
});
