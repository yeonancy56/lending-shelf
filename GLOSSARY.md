# Lending Shelf

The words this app uses for keeping track of which books I've lent to which friends.

## Things

**Book**:
One physical copy on my shelf, with a title and an author. If I own two copies of Dune, those are two books, and each can be lent on its own. Two books count as the same book when the title and author match, ignoring capital letters and extra spaces.
_Avoid_: title, copy, item

**Copy note**:
A few words I write to describe one copy of a book, like "signed" or "Mum's copy", so I can tell two Dunes apart. It's optional, but every copy of the same book needs a different one.
_Avoid_: note, label, tag, edition, nickname

## People

**Friend**:
Someone I lend books to, like Sam.
_Avoid_: borrower, user, member

## Lending

**Loan**:
One time I lent one book to one friend, like Dune to Sam. It stays a loan after the book comes back, as a record of what happened.
_Avoid_: checkout, borrowing

**Active loan**:
A loan where the book hasn't come back yet. While it has one, the book is **lent out**.
_Avoid_: open loan, current loan

**Returned loan**:
A loan where the book has come back. It's kept, not deleted.
_Avoid_: closed loan, finished loan

**Lend**:
To give a book to a friend, which starts a new loan.
_Avoid_: check out, borrow (that's the friend's side)

**Overdue**:
An active loan that has been out for more than 14 days, counted to the exact time it was lent. Lent Monday 2 November at 8pm, it's overdue from just after 8pm on Monday 16 November. Once the book comes back, the loan is no longer overdue.
_Avoid_: late, past due

**Return**:
When the friend gives the book back, which turns an active loan into a returned loan.
_Avoid_: check in, give back

## Rules

**Lending rules**:
The three checks before a book can be lent: the book isn't already lent out, the friend is under the 3-book limit, and the friend has nothing overdue. If one fails, the rules say no.
_Avoid_: validation, restrictions

**3-book limit**:
A friend can have at most 3 active loans at once. Returned loans don't count, so when Sam returns one of 3 books, Sam can borrow again.
_Avoid_: max loans, borrowing cap, quota
