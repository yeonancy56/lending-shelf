## 2026-10-16 — Set up Git before GitHub
Chose: Git before GitHub
Other option: GitHub before Git
Why: GitHub stores snapshots of Git, so without Git there would be nothing for GitHub to store

## 2026-10-16 — Make .gitignore before the first commit
Chose: make .gitignore before the first commit
Other option: make the first commit before .gitignore
Why: if I commit first, node_modules and .env would get included and uploaded to GitHub

## 2026-10-19 — Protect main with CI
Chose: turn on branch protection for main
Other option: leave main unprotected
Why: so CI always checks the code, even if I forget, and broken code can't get into main

## 2026-10-29 — Keep decisions in DECISIONS.md, not a docs/adr folder
Chose: keep writing every decision in the one DECISIONS.md file
Other option: start a docs/adr folder with a separate file for each decision
Why: I already have a list of decisions in DECISIONS.md, and one file is easier to read top to bottom than lots of small files

## 2026-10-29 — Turn branches and pull requests back on
Chose: every ticket gets its own branch and a pull request, and main only accepts changes after the tests pass
Other option: keep making changes straight on main, like we did after 2026-10-22
Why: I want to follow Matt Pocock's method exactly, and it uses a branch and a pull request for every ticket. It also means the tests always run before anything lands in main

## 2026-10-29 — Sort the server files by feature
Chose: one folder for each feature (books, friends, loans), with all 5 files for that feature inside
Other option: keep one folder per job, like all the "check the rules" files together and all the "talk to the database" files together
Why: when I work on loans, everything I need is in one folder instead of spread across five. It also fits building one small feature at a time, all the way through

## 2026-10-29 — Move one feature at a time
Chose: move books, check the app, then friends, check, then loans, check
Other option: move everything at once and check at the end
Why: if something breaks, I know exactly which step broke it

## 2026-10-29 — Check by hand, plus one small "server starts" test
Chose: try the app by hand after each move, and add one test that checks the server can find all its files and start
Other option: write real tests for the loan rules first, before moving anything
Why: the only test we had checked 1 + 1 = 2, so it couldn't catch anything. Moving files can break a file path, and the new test catches that. Tests for the loan rules are a bigger job, so they belong in tickets #5 and #6

## 2026-10-29 — Delete the 1 + 1 = 2 test
Chose: delete it
Other option: keep it next to the new "server starts" test
Why: it never checked anything about my app, so it only made the test count look bigger than it really is

## 2026-10-30 — Test the loan rules with a fake helper instead of a database
Chose: swap the database helper for a fake one that answers whatever each test needs, like "yes, Dune is already out"
Other option: run the tests against a pretend database that we fill with books and friends
Why: the rules only care about the answer, not where it comes from. The fake is quicker and needs no setup. Also, when we tried the pretend database inside our test tool (Jest), it crashed, and fixing that is a job for ticket #3

## 2026-10-30 — Keep each test file next to the file it tests
Chose: put the loan rule tests in the loans folder, right next to the loan rules
Other option: put all tests together in a separate tests folder
Why: we just sorted the server by feature, so everything about loans, tests included, should be in the loans folder

## 2026-10-30 — Test books against a pretend database, not my real one
Chose: a pretend database that starts empty for the tests and is thrown away after
Other option: run the tests against my real database
Why: tests that add Dune every time would fill my real shelf with copies of Dune. Also, CI runs on GitHub's computers, which can't reach my real database

## 2026-10-30 — Every test starts with an empty shelf and sets itself up
Chose: empty the pretend database before each test, and have each test add the books it needs
Other option: let a test use the books an earlier test added
Why: then each test works on its own and in any order, and an old copy of Dune can't sneak into the next test

## 2026-10-30 — Fix the pretend database so it opens inside our test tool
Chose: when the tests open the pretend database, hand it one small piece it needs (Node's "os" tool) ourselves
Other option: switch on a setting in our test tool (Jest) that's still marked "experimental"
Why: the pretend shelf wouldn't open inside Jest, so we couldn't test adding Dune at all. Jest was blocking the way the database code fetches that piece. Handing it over ourselves is one line in one place, and it doesn't rely on an experimental setting that might change

## 2026-10-30 — Two different kinds of "no" when lending a book
Chose: one kind of "no" for "your request has a mistake" (nothing picked, or a book or friend that isn't on the shelf), and a different kind for "the rules say no" (like Dune already being out). The code numbers for these are 400 and 409
Other option: give the same "no" every time, like before
Why: they mean different things. Asking the librarian for "___" means you need to fix your request. Asking for Dune while Sam has it means your request was fine, but the rules say no. Before this, the app even let you lend to a friend who didn't exist

## 2026-10-30 — Check "nothing picked" first, and "is it real?" a step later
Chose: the part of the app that first receives the request checks that a book and a friend were picked. The part that knows the lending rules then checks that Dune and Sam are really on the list, before checking the three rules
Other option: do both checks in the same place
Why: spotting "nothing picked" only needs a look at the request, so it's answered straight away. Checking that Dune and Sam are real means looking them up in the saved data, which belongs with the lending rules. And there's no point checking the rules for a book that isn't there

## 2026-10-30 — Lending asks the books and friends folders directly "does this exist?"
Chose: the lending code asks the books folder "is Dune real?" and the friends folder "is Sam real?" itself
Other option: go through the books and friends rule code instead, or copy the look-up into the loans folder
Why: it's a simple yes/no question with no rules attached, so going the long way would add steps for nothing. And copying it would mean two places to fix if it ever changes

## 2026-10-30 — Check for a missing author or name ourselves, before saving
Chose: when a book or friend arrives, look at it straight away, and if the title, author or name is missing, say so in our own words
Other option: try to save it anyway, and turn the database's complaint into a message
Why: the database's complaint reads like "Path 'author' is required", which is computer-speak. Checking first lets us say "Please fill in the title and author"

## 2026-10-30 — Only spaces counts as missing
Chose: an author or name made of just spaces is treated as empty
Other option: accept it, since the box isn't technically empty
Why: spaces aren't a real author. Without this, "Matilda by (blank)" could end up on the shelf, and the tests showed it really did

## 2026-10-30 — Keep what you typed when adding fails
Chose: if adding Matilda fails, "Matilda" stays in the box and the red message appears
Other option: clear the form every time, like before
Why: you only need to add the author, not type everything again

## 2026-10-30 — Anything that isn't words counts as missing too
Chose: if the title, author or name is a number or something else that isn't words, treat it as missing
Other option: only check for empty boxes and spaces
Why: the page always sends words, so anything else means something went wrong. Saying "Please fill in…" is simpler than writing a new message for a mistake you can't make from the page

## 2026-10-30 — Copy the small "is it blank?" check into books and friends, instead of sharing one
Chose: books and friends each have their own 3-line "is it blank?" check
Other option: put one shared copy in a separate place that both use
Why: each folder stays complete on its own, like we chose when we sorted things by feature. It's only 3 lines, so having two isn't much to keep in step. If a third folder needs it, we'll share it then

## 2026-10-30 — Use Vitest to test the page
Chose: Vitest, a test tool made to work with Vite (the tool that already runs our page)
Other option: Jest, the same tool the server uses
Why: Jest would need extra setup to understand the page's code, and Vitest reads it the same way Vite does. The tests look almost the same as the server ones, so there's not much new to learn

## 2026-10-30 — Test the lend form with a pretend server
Chose: swap the part of the page that talks to the server for a fake. The fake says the shelf has Dune and Sam, and answers "This book is already lent out" when you click Lend
Other option: start the real server and database for the test
Why: it's the same idea as the fake helper in the loan rule tests. The test only cares that the page shows the message it's given, and it runs in under a second with nothing else switched on

## 2026-10-30 — Check the message isn't there before clicking Lend
Chose: the test checks the red message is missing first, then clicks Lend, then checks it's there
Other option: only check it's there at the end
Why: otherwise a message that was always on the page would still pass. Checking first proves clicking Lend is what made it show up

## 2026-10-30 — Run the page tests inside the same CI check as the server tests
Chose: add the page tests as extra steps in the existing "test" check
Other option: give the page tests their own separate check
Why: main only blocks a merge when the check called "test" fails. A separate check wouldn't block anything unless we also changed that setting

## 2026-10-30 — The helpers the page test uses
Chose: run the test in a pretend browser (jsdom), use a helper that picks and clicks like a real person would, and wipe the page clean after each test
Other option: open a real browser like Chrome for every test, and press buttons with lower-level code
Why: a pretend browser is fast and needs nothing else installed. Clicking like a person checks what you'd really do on the page. And wiping it after each test is the same idea as the empty shelf in the server tests, so one test can't mess up the next

## 2026-10-30 — Use "Every friend needs a name" as the missing-name message
Chose: "Every friend needs a name"
Other option: "Your friend needs a name", which another branch changed the same line to (a merge conflict made on purpose, to practise fixing one)
Why: git couldn't pick between two changes to the same line, so it stopped and asked. Either message works. This one was picked when fixing the conflict by hand

## 2026-10-30 — Put the app online with Atlas, Render and Vercel
Chose: the data on MongoDB Atlas, the server on Render, and the page on Vercel, all on free plans, the same as Just Eat This
Other option: put everything on one paid host
Why: they're free, they update by themselves when main changes, and it's a setup I've already used once

## 2026-10-30 — The page asks for the book list at its own address, and gets passed on to the server
Chose: when the page wants the list with Dune on it, it asks its own address, with "/api" at the front. On my computer Vite passes the question on to the server, and online Vercel passes it on to Render
Other option: write the server's address straight into the page
Why: the page works the same on my computer and online. If the server's address ever changes, only one small settings file changes

## 2026-10-30 — The server uses whatever door number Render gives it
Chose: the server opens the door number Render picks, and door 4000 when there isn't one (on my computer)
Other option: always use door 4000
Why: Render decides which door the server must use. If the server kept using 4000, nobody online could reach it

## 2026-10-30 — The database password lives only in Render's settings
Chose: on Render, paste the Atlas link into its settings page. On my computer it stays in .env, which never goes to GitHub. A .env.example file lists the name (MONGO_URL) with no value
Other option: put the link in the code
Why: anyone who can see the code could copy the password and read or wipe my shelf

## 2026-10-30 — Render only goes live after the tests pass
Chose: Render waits until CI's tests pass before putting a new version of the server online
Other option: go live the moment main changes
Why: main is already protected, but this is a second safety net, so a broken version never reaches the live shelf

## 2026-10-30 — The "/api" part is dropped on the way to the server
Chose: whoever passes the question on (Vite or Vercel) removes "/api" first, so the server still gets the plain "books" question it always has
Other option: change the server so it answers at "/api/books" too
Why: the server and its tests don't need to change at all. Vite and Vercel must both drop it, though, or the online shelf would get "not found"

## 2026-10-30 — Let my server restart by itself when I save, using what Node already has
Chose: a new "npm run dev" command for my computer. If I save a change to the loans code, the server picks it up by itself, with no stopping and starting
Other option: install nodemon, a separate add-on that does the same thing
Why: Node can already do this, so there's nothing extra to install or keep updated. Render keeps starting the server the normal way, so the live shelf isn't affected

## 2026-10-30 — Keep my VS Code settings off GitHub
Chose: tell git to ignore the .vscode folder
Other option: share it in the repo
Why: it holds settings for my own editor, not for the shelf app. One got saved into a PR by accident, so ignoring the folder stops that from happening again

## 2026-10-30 — A loan stays a loan after the book comes back
Chose: when Sam returns Dune, the loan is kept with its return date, as a record of what happened
Other option: only call it a loan while the book is out, and forget it after
Why: I can look back at who borrowed what. The app already keeps returned loans, so the word matches what it does

## 2026-10-30 — Each copy on my shelf is its own book
Chose: two copies of Dune are two books, and each can be lent on its own
Other option: a book means the title, so once any Dune is lent out, Dune is out
Why: if I really own two, I should be able to lend both. The app already works this way, though nothing on the page tells two Dunes apart yet

## 2026-10-30 — Overdue means 14 days to the exact time, and only while the book is still out
Chose: a loan becomes overdue just after 14 days to the minute, and stops being overdue once the book comes back
Other option: count whole days, or keep a "late" mark on the loan forever
Why: it's what the app already does, and it's fair to Sam: once Dune is back, Sam can borrow again straight away

## 2026-10-30 — Tell two copies of Dune apart with a short copy note I type
Chose: a few words I write myself, like "signed" or "Mum's copy", shown as "Dune (signed)"
Other option: number the copies automatically ("Dune (2)"), or give each copy a different font colour
Why: a note describes the real book in my hand. A number only helps if I also write it inside the book, and "the blue Dune" means nothing when I'm looking at my shelf. Colours also don't work for people who can't see them well

## 2026-10-30 — The copy note is optional, and always shown when there is one
Chose: I can leave it empty, and when a book has one, the page always shows it, even if it's my only Dune
Other option: make every book need a note, or only show notes when there's a second copy
Why: most books are my only copy, so asking every time is extra work. And notes that appear and disappear depending on what else is on my shelf would be confusing

## 2026-10-30 — Show the copy note everywhere a book appears, in brackets
Chose: "Dune (signed)" in the books list, the "Pick a book" list and the loans list. A book with no note shows as just "Dune"
Other option: a dash ("Dune – signed"), or smaller grey text
Why: the "Pick a book" list is where I choose which copy goes to Sam, and the loans list is where I check who has which. Brackets look the same in all three places, and the "Pick a book" list can't show grey or small text

## 2026-10-30 — Copy notes are only typed when adding a book, for now
Chose: the note box is on the add-book form only
Other option: also let me edit a book's note later
Why: there's no way to edit a book at all yet. That's a whole feature of its own, so it can wait for its own ticket

## 2026-10-30 — Call it a "copy note"
Chose: "copy note" in the glossary and the code. The box on the page just says "Note (optional, like 'signed')"
Other option: "note", "label", "tag" or "edition"
Why: "note" could mean a note about anything, "label" and "tag" sound like groups like "sci-fi", and "edition" already means something real for books

## 2026-10-30 — A copy note of only spaces is no copy note, and 30 letters is the most
Chose: spaces around a note are trimmed, only spaces counts as no note, and anything over 30 letters gets a red "Keep the note short" message
Other option: save it exactly as typed, with no limit
Why: same idea as "spaces aren't a real author". The page never shows "Dune (   )", and a long sentence would stretch the "Pick a book" list

## 2026-10-30 — A second copy of the same book needs a copy note
Chose: if I already have Dune by Frank Herbert and add another one with no note, the app says "You already have Dune. Add a note, like 'signed', to tell them apart." My first Dune can stay without a note
Other option: let me add two plain "Dune"s, or make me go back and add a note to the first one too
Why: two identical "Dune"s in the "Pick a book" list means I can't tell which copy I'm giving Sam. Only the new copy needs a note, so books I own one of stay quick to add

## 2026-10-30 — Every copy's note must be different, even from lent-out copies
Chose: if a Dune already has the note "paperback", a new Dune can't use "paperback" too. "Paperback" and " paperback " count as the same note. The Dune Sam has right now counts as well
Other option: only check copies that are on the shelf right now, or count capital letters as different
Why: two "Dune (paperback)"s look the same on the page, so I'd be back to not telling them apart. Sam's copy comes back one day, and then there'd be two

## 2026-10-30 — Capitals and extra spaces don't make a different book, but a different author does
Chose: "dune" by "frank herbert " is the same book as "Dune" by "Frank Herbert". "Dune" by someone else is a different book and needs no note
Other option: count only exact matches as the same book, or look at the title only
Why: a lowercase letter or a stray space shouldn't sneak a second plain Dune past the check. But two different books that happen to share a title aren't copies of each other

## 2026-10-30 — The "You already have" message uses the name already on my shelf
Chose: if I type "dune" and I already have "Dune", the message says "You already have Dune", the way it's written on my shelf
Other option: repeat what I typed, so it says "You already have dune"
Why: the message is telling me about the book I already own, so it should name it the way the Books list does

## 2026-11-02 — The red messages say "note", not "copy note"
Chose: messages like "Use a different note" and "Keep the note short" just say "note"
Other option: say "copy note" in the messages too, the way the glossary and the code do
Why: the box I just typed in says "Note (optional, like 'signed')", so the message should use the same word as the box. "Copy note" stays the proper name everywhere behind the page

## 2026-11-02 — Only known mistakes get a red message
Chose: when I break a rule ("This book is already lent out") or fill in the form wrong ("You already have Dune…"), the page shows that message in red. If something really breaks, like the database being down, the server just says something went wrong
Other option: treat every problem as if I broke a rule, and show whatever the server said in red
Why: a breakdown isn't my mistake, and its message is computer talk nobody can act on. Books and loans now both work this way. It also fixed a small thing: returning a loan that doesn't exist now says "Loan not found" instead of a confusing message

## 2026-11-02 — Helpers that books and loans both use live at the top of the server folder
Chose: the shared "your form has a mistake" and "a rule says no" helpers live in one file next to app.js, not inside books or loans
Other option: keep a copy inside each feature folder
Why: both books and loans need them, so putting them in one feature's folder would be odd, and two copies could drift apart. app.js and db.js already sit there for the same reason

## 2026-11-02 — When the server really breaks, the page says "Something went wrong. Try again."
Chose: if the database is down or the wifi drops, the page shows "Something went wrong. Try again." in red under the form I used, and keeps what I typed. This works for Add book, Add Friend, Lend and Return
Other option: show nothing, like before, or show the server's own computer talk
Why: before, clicking Lend just did nothing, and an old red message could stay up and look like it was about this click. "Try again" tells me the one thing I can do

## 2026-11-02 — The page sorts the server's answers in one place, api.js
Chose: api.js checks the answer every time I click a button (Add book, Add Friend, Lend, Return) before the page sees it. A known mistake keeps its own words, and anything else becomes "Something went wrong". The lists that load when the page opens aren't checked yet; that's a separate ticket
Other option: let each button (Add book, Add Friend, Lend, Return) check for itself
Why: four buttons would mean four copies of the same check, which could drift apart. It's the same idea as keeping the server's mistake helpers in one file

## 2026-11-02 — Returning a book can show a red message now
Chose: if Return fails, the message shows in the red spot under the Lend form
Other option: give each loan in the list its own red spot
Why: Loans already has one red spot, and only one thing can go wrong at a time

## 2026-11-02 — "Loan not found" counts as a known mistake
Chose: if I click Return on a loan that's already gone, the page says "Loan not found", the way the server wrote it
Other option: change the server so "not found" uses the same code as "your form has a mistake", or let it fall into "Something went wrong"
Why: "Try again" would be bad advice here, because trying again can never work. Fixing it on the page was one small line, and the list of known mistakes now sits in one spot in api.js

## 2026-11-02 — The new look is a touch-up, not a redesign
Chose: keep the same page and the same order (Books, Friends, Loans). Only the colors, fonts and spacing change
Other option: also show things more clearly, like an "overdue" tag on a book, or build a whole new layout
Why: it's the smallest change that makes the app nicer to use, and I can follow every part of it

## 2026-11-02 — Lending Shelf should feel warm and cozy
Chose: a cream background with brown and green, like a bookshelf at home
Other option: clean and calm, with white or light grey and one soft color
Why: the app is about lending books from my own shelf to friends, so a homey feel fits

## 2026-11-02 — Clear out the sample leftovers before the new look
Chose: delete the sample styling and pictures the app never uses, and change the browser tab name from "client" to "Lending Shelf"
Other option: leave them and add the new look on top
Why: old rules that do nothing would sit next to the new ones, and I'd have a hard time telling which ones matter

## 2026-11-02 — The look lives in one plain CSS file
Chose: write all the colors, fonts and spacing myself in one file, index.css, which the app already uses
Other option: add an extra add-on that comes with ready-made styles
Why: the app is one page, and writing the styles myself is the basic thing to learn first. An add-on would mean more to learn without making the page better

## 2026-11-02 — Keep dark mode, with cozy colors in both
Chose: if my computer is set to dark mode, the page still turns dark. There will be two sets of cozy colors: cream for light, and a dim reading-room look for dark
Other option: only one set of colors, always light
Why: it already works today, so dropping it would be a step back for anyone who reads at night

## 2026-11-02 — The page gets the "wooden shelf" look
Chose: a wooden band at the top with the app's name, and a wooden shelf board under Books, Friends and Loans. Books stand on the shelf like spines. Round green buttons
Other option: paper cards on a cream background, or a lined notebook page with no boxes
Why: I tried all three on my real page and liked this one best. It looks the most like my own bookshelf

## 2026-11-02 — A book's spine never cuts off its name
Chose: the whole name and note always show on the spine, like "Dune (signed)". A long name wraps onto a second line, so that spine gets a bit thicker. The author shows in smaller letters
Other option: cut long names with "…" so every spine is the same size, or leave the author off
Why: I decided before that the note must show everywhere, so I can tell my two copies of Dune apart. A cut-off spine could hide exactly that part

## 2026-11-02 — On a spine, the title and the author have different colors
Chose: the book's name (like "Dune (signed)") is cream and a bit bold. The author is a soft gold and smaller. The gold spine got darker so the words on it are easy to read
Other option: one color for both
Why: it's easier to see where the name ends and the author starts. The author is also smaller, so people who can't tell colors apart still see the difference

## 2026-11-02 — All red messages use one shared red
Chose: the red messages under Books, Friends and Loans all use one softer red, set in one place. It's a bit lighter in dark mode so it's still easy to read
Other option: each message picks its own plain "red", like now
Why: same idea as api.js. One place means the three can't drift apart, and the softer red fits the wooden shelf colors

## 2026-11-02 — The new look is two tickets
Chose: ticket 1 clears out the sample leftovers and renames the tab. Ticket 2 adds the wooden shelf look
Other option: do it all in one ticket
Why: ticket 1 is small and changes almost nothing I can see, so ticket 2 only has the new look in it and is easier to follow

## 2026-11-02 — Tests check that a message is marked as an error, not its exact red
Chose: each red message gets a hidden label that says "this is a warning", and the tests check for that label
Other option: make the tests check the exact new red, or stop checking at all
Why: the tests can't see colors from the styles file. Checking "this is a warning" is what really matters. Also, for people who can't see the screen and have the computer read the page out loud, a warning gets read out right away

## 2026-11-02 — Boxes for typing get their own solid color in dark mode
Chose: the boxes are a soft cream in light mode and a dark brown in dark mode. In dark mode, their edge is a lighter brown
Other option: one see-through white for both, with the same wood-brown edge, like in the prototype
Why: in dark mode, see-through white turns the boxes grey, and my light words on grey were hard to read. The darker edge almost disappeared against the dark page, so I couldn't see where a box was

## 2026-11-02 — CI runs the lint check too
Chose: every pull request now runs the lint check (a tool that reads the code and points out common mistakes), right after the tests. If it finds a mistake, the pull request can't be merged
Other option: keep running only the tests, and run the lint check by hand when I remember
Why: the lint check was already set up, but nothing ran it, so a mistake sat there unnoticed. Now it can't hide

## 2026-11-02 — Fix the lint mistake by rewriting the step, not by turning the rule off
Chose: when the page opens, it fills in the books, friends and loans lists only once the server answers. The page works the same as before
Other option: tell the lint check to skip that one line, or turn that rule off for the whole page
Why: turning the rule off would also stop it from checking any new code I write later. Rewriting the step keeps the check fully on
