# Lending Shelf

The words this app uses for keeping track of which books I've lent to which friends.

## Things

**Book**:
One physical copy on my shelf, with a title and an author. If I own two copies of Dune, those are two books, and each can be lent on its own. Two books count as the same book when the title and author match, ignoring capital letters and extra spaces.
_Avoid_: title, copy, item

**Shelf**:
Every book I own, whether it's at home or lent out. If I own 12 books and Dune is with Sam, my shelf still has 12 books.
_Avoid_: library, collection

**At home**:
A book on my shelf that isn't lent out and that no one has asked for. Sam's page labels it "at home", like "Dune · at home", and only books at home can be asked for. Once Sam asks for Dune, it says "asked for" instead.
_Avoid_: on the shelf, available, in (as in "Dune is in")

**Copy note**:
A few words I write to describe one copy of a book, like "signed" or "Mum's copy", so I can tell two Dunes apart. It's optional, but every copy of the same book needs a different one.
_Avoid_: note, label, tag, edition, nickname

## People

**Friend**:
Someone I lend books to, like Sam.
_Avoid_: borrower, user, member

**Owner**:
Me. The one Google email that can do everything: lend, return, add, edit and delete. It's set in the server's settings, not in the code.
_Avoid_: admin, user

**Stranger**:
Someone who signs in with a real Google account whose email isn't on the list. They're told "You're not on the list." and see nothing.
_Avoid_: guest, unknown user

**Sign-in**:
What Google hands the page after someone clicks "Sign in with Google": a code with their email inside, checked by Google. The page sends it with every request. It runs out after about an hour.
_Avoid_: token, login, session

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

**Due back**:
The day an active loan should come back: 14 days after it was lent. Lent Monday 2 November, it's due back Monday 16 November. Returned loans don't have one.
_Avoid_: due date, deadline, return date (that's when it actually came back)

**Request**:
When a friend asks to borrow a book on my shelf that isn't lent out, like Sam asking for Dune. It waits until I approve or decline it. Only one friend can ask for a book at a time.
_Avoid_: borrow request, hold, reservation

**Waiting request**:
A request I haven't answered yet. While Sam's request waits, Dune is **asked for**, and no one else can ask for it.
_Avoid_: pending request, open request

**Approve**:
To say yes to a request. That lends the book straight away, so approving Sam's request for Dune starts a loan of Dune to Sam.
_Avoid_: accept, confirm

**Decline**:
To say no to a request. I can add a short note that the friend sees, like "I'm rereading it this week." Declining doesn't lend anything.
_Avoid_: reject, refuse, deny

**Cancel**:
When the friend takes back their own waiting request before I answer it. Only the friend who asked can cancel.
_Avoid_: withdraw, delete

**Return**:
When the friend gives the book back, which turns an active loan into a returned loan.
_Avoid_: check in, give back

## Ratings

**Rating**:
The 1 to 5 stars a friend gives one copy of a book. Sam can rate the signed Dune once he has returned it at least once, even if he has it again now. Each friend has at most one rating per copy, so if Sam borrows the signed Dune twice, he still has one rating for it. He can change it later but can't take it away. Two copies of Dune get separate ratings, because one copy can be nicer to read than the other. Only friends rate. I don't.
_Avoid_: review, score, vote

**Average rating**:
All the friends' stars for one copy, averaged, shown with how many friends rated it, like "★ 4.5 · 2 ratings". A copy no one has rated shows nothing. Sam sees the average and his own stars, never what Priya gave.
_Avoid_: score, overall rating

## Rules

**Lending rules**:
The checks before a book can be lent: the book isn't already lent out, no other friend has asked for it, the friend is under the 3-book limit, and the friend has nothing overdue. The same checks run when a friend asks for a book. If one fails, the rules say no.
_Avoid_: validation, restrictions

**3-book limit**:
A friend can have at most 3 active loans and waiting requests together. Returned loans don't count, so when Sam returns one of 3 books, Sam can borrow again. If Sam has 2 books and is waiting on a request for Dune, Sam can't ask for anything else.
_Avoid_: max loans, borrowing cap, quota
