# Coding standards

The rules code in Lending Shelf should follow. Each one comes from a decision in
`DECISIONS.md`, named in brackets, so you can read the reason there. The lint
check already catches small slips, so they aren't repeated here.

If a change breaks one of these on purpose, it needs a new DECISIONS.md entry
saying so.

## Words

1. **Use the glossary's words in code.** A copy's note is `copyNote` / "copy
   note", never "note", "label" or "tag". A friend is a friend, never a
   "borrower" or "user". Say "active loan", not "open loan" or "loan still out".
   (Call it a "copy note"; GLOSSARY.md)
2. **Words on the page match the box, not the code.** Red messages say "note",
   like "Keep the note short", because the box says "Note". "Copy note" stays
   the name behind the page. (The red messages say "note", not "copy note")
3. **Messages start with a capital and have no stray spaces.** A rule message
   says "This book…" or "This friend…", not the book's or friend's name.
   (The 3-book message starts with a capital letter; "Loan not found" loses its
   extra space; The "can't delete" message says "This book…")

## Server

4. **Sorted by feature.** Each feature (`books/`, `friends/`, `loans/`,
   `requests/`) has its own folder with the layers route → controller →
   service → DAO, named like `book.routes.js`, `book.controller.js`,
   `book.service.js`, `book.dao.js`. Only `app.js` plugs the folders in.
   `auth/` and `scripts/` skip the layers because they don't save data for the
   page. (Sort the server files by feature; Requests get their own routes file;
   Sign-in gets its own folder; The duplicate check skips the app's four layers)
5. **Another folder's yes/no question goes straight to its DAO.** Lending asks
   the books DAO "is Dune real?". The rule that uses the answer stays in its own
   folder. (Lending asks the books and friends folders directly; The books
   folder asks the lending folder "has Dune ever been lent?")
6. **Helpers two or more features use live at the top of `server/src/`**, like
   `errors.js` and `tidy-email.js`, not copied into each folder. One exception:
   the 3-line `isBlank` check is copied in books and friends on purpose.
   (Helpers that books and loans both use live at the top; Copy the small "is
   it blank?" check)
7. **Known mistakes use `errors.js`.** A bad form or a missing book is
   `badRequest` (400). A lending rule saying no is `ruleBroken` (409).
   Controllers answer them with `answerKnownMistake`. Anything else is a real
   breakdown: pass it on to Express, and never send its message to the page.
   (Two different kinds of "no"; Only known mistakes get a red message)
8. **Check what arrives before saving.** Missing, only spaces, or not words
   counts as missing, and it gets our own message, not the database's. Trim
   spaces before saving. (Check for a missing author or name ourselves; Only
   spaces counts as missing; Anything that isn't words counts as missing too)
9. **Look before you change.** Editing or deleting first checks the thing
   exists, and answers "Book not found" / "Friend not found". A wrong-shaped id
   counts as "not found", not a crash. (Deleting a book first checks the book is
   there; Looking up one book or friend treats a wrong-shaped address as "not
   there")
10. **Each rule lives in one place on the server.** "14 days", "overdue" and
    "3 books" are worked out by the server, and the page only shows them.
    (The server works out "due back" and "overdue"; "Is it overdue?" is decided
    in one spot; The server answers "what are Sam's loans?")
11. **Everything is locked.** Every address goes through the sign-in gatekeeper,
    except the health check. Each address belongs to the owner or to a friend,
    never both. (Everything is locked, except the health check; Sam's addresses
    are only for friends)

## Page

12. **Every red message uses `ErrorMessage.jsx`.** Never write
    `className="error" role="alert"` by hand. (The red messages are one shared
    piece; The red message piece moves to its own file)
13. **Every talk with the server goes through `api.js`.** A known mistake keeps
    its own words. Anything else becomes "Something went wrong. Try again."
    (The page sorts the server's answers in one place; An answer the app can't
    read counts as "Something went wrong")
14. **The look lives in `index.css`.** Colors are set once at the top for light
    and dark mode, and every red uses the one shared red. (The look lives in one
    plain CSS file; All red messages use one shared red)

## Tests

15. **A test file sits next to the file it tests**, like `book.routes.test.js`
    next to `book.routes.js`. (Keep each test file next to the file it tests)
16. **Each test starts empty and sets itself up.** No test relies on data
    another test added. (Every test starts with an empty shelf)
17. **Fake the far side, not the thing being tested.** Rule tests use a fake
    DAO. Page tests use a fake server. Route tests use a pretend database, never
    the real one. (Test the loan rules with a fake helper; Test books against a
    pretend database; Test the lend form with a pretend server)
18. **Prove the click did it.** Check a message isn't there before the click,
    then check it is after. Check the alert mark (`role="alert"`), not the
    color. (Check the message isn't there before clicking Lend; Tests check that
    a message is marked as an error)

## DECISIONS.md

19. **Every decision gets an entry, and the entry must match the code.** If a
    change undoes an older decision, say so: add "Replaced by: …" under the old
    one, or say "this changes the earlier choice" in the new one. (Copy notes
    are only typed when adding a book; The red message piece moves to its own
    file)
