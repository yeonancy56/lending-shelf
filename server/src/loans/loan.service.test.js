// Tests for the loan rules. No database needed:
// the real DAO is swapped for a fake one, and each test tells the fake what to answer.
jest.mock('./loan.dao');
const loanDao = require('./loan.dao');
const loanService = require('./loan.service');

const DUNE = 'dune-id';
const SAM = 'sam-id';

// Before each test: the fake DAO says "all clear" (Dune is free, Sam has no books, nothing overdue).
// Each test then changes only the one answer it cares about.
beforeEach(() => {
    jest.resetAllMocks();
    loanDao.findActiveByBook.mockResolvedValue(null);
    loanDao.countActiveByFriend.mockResolvedValue(0);
    loanDao.findOverdueByFriend.mockResolvedValue(null);
    loanDao.create.mockImplementation(async (data) => data);
});

afterEach(() => {
    jest.useRealTimers(); // put the real clock back, even if a test failed
});

// happy path: Sam has 2 books, Dune is free -> lending works
test('lends Dune to Sam when no rule is broken', async () => {
    loanDao.countActiveByFriend.mockResolvedValue(2);

    const loan = await loanService.lendBook(DUNE, SAM);

    expect(loan).toEqual({ book: DUNE, friend: SAM });
});

// rule 1: Dune is already lent out
test('does not lend Dune when Dune is already out', async () => {
    loanDao.findActiveByBook.mockResolvedValue({ book: DUNE });

    await expect(loanService.lendBook(DUNE, SAM)).rejects.toThrow('This book is already lent out');
    expect(loanDao.create).not.toHaveBeenCalled();
});

// rule 2: Sam already has 3 books
test('does not lend Sam a 4th book', async () => {
    loanDao.countActiveByFriend.mockResolvedValue(3);

    await expect(loanService.lendBook(DUNE, SAM)).rejects.toThrow('this friend already has 3 books');
    expect(loanDao.create).not.toHaveBeenCalled();
});

// rule 3: Sam has a book out for more than 14 days
test('does not lend to Sam when Sam has an overdue book', async () => {
    loanDao.findOverdueByFriend.mockResolvedValue({ friend: SAM });

    await expect(loanService.lendBook(DUNE, SAM)).rejects.toThrow('This friend has an overdue book');
    expect(loanDao.create).not.toHaveBeenCalled();
});

// rule 3, part 2: "overdue" means older than 14 days, not some other number
test('counts a loan as overdue after 14 days', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-30'));

    await loanService.lendBook(DUNE, SAM);

    const cutoff = loanDao.findOverdueByFriend.mock.calls[0][1];
    expect(cutoff).toEqual(new Date('2026-10-16')); // 14 days before today
});

// returning: Dune can't be returned twice
test('does not return Dune twice', async () => {
    loanDao.findById.mockResolvedValue({ book: DUNE, returnedAt: new Date() });

    await expect(loanService.returnBook('loan-id')).rejects.toThrow('This book was already returned');
    expect(loanDao.markReturned).not.toHaveBeenCalled();
});
