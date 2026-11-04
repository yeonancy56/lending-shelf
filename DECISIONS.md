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
Replaced by: "Editing a book follows the same checks as adding one" (2026-11-02). Now I can change a note when I edit a book

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

## 2026-11-02 — The look lives in one plain styles file
Chose: write all the colors, fonts and spacing myself in one styles file, index.css, which the app already uses. A styles file tells the browser how the page should look
Other option: add an extra add-on that comes with ready-made styles
Why: the app is one page, and writing the styles myself is the basic thing to learn first. An add-on would mean more to learn without making the page better

## 2026-11-02 — Keep dark mode, with cozy colors in both
Chose: if my computer is set to dark mode, the page still turns dark. There will be two sets of cozy colors: cream for light, and a dim reading-room look for dark
Other option: only one set of colors, always light
Why: it already works today, so dropping it would be a step back for anyone who reads at night
Replaced by: "At night, the page is all greys, buttons too" and "A Day / Night button, as its own ticket" (2026-11-03). The night look is charcoal now, not a dim reading room, and my pick on the button wins over the computer

## 2026-11-02 — The page gets the "wooden shelf" look
Chose: a wooden band at the top with the app's name, and a wooden shelf board under Books, Friends and Loans. Books stand on the shelf like spines. Round green buttons
Other option: paper cards on a cream background, or a lined notebook page with no boxes
Why: I tried all three on my real page and liked this one best. It looks the most like my own bookshelf

## 2026-11-02 — A book's spine never cuts off its name
Chose: the whole name and copy note always show on the spine, like "Dune (signed)". A long name wraps onto a second line, so that spine gets a bit thicker. The author shows in smaller letters
Other option: cut long names with "…" so every spine is the same size, or leave the author off
Why: I decided before that the copy note must show everywhere, so I can tell my two copies of Dune apart. A cut-off spine could hide exactly that part

## 2026-11-02 — On a spine, the title and the author have different colors
Chose: the book's name (like "Dune (signed)") is cream and a bit bold. The author is a soft gold and smaller. The gold spine got darker so the words on it are easy to read
Other option: one color for both
Why: it's easier to see where the name ends and the author starts. The author is also smaller, so people who can't tell colors apart still see the difference
Replaced by: "At night, the page is all greys, buttons too" (2026-11-03). Only at night: there, the author is a light grey instead of gold

## 2026-11-02 — All red messages use one shared red
Chose: the red messages under Books, Friends and Loans all use one softer red, set in one place. It's a bit lighter in dark mode so it's still easy to read
Other option: each message picks its own plain "red", like now
Why: same idea as api.js. One place means the three can't drift apart, and the softer red fits the wooden shelf colors

## 2026-11-02 — The new look is two tickets
Chose: ticket 1 clears out the sample leftovers and renames the tab. Ticket 2 adds the wooden shelf look
Other option: do it all in one ticket
Why: ticket 1 is small and changes almost nothing I can see, so ticket 2 only has the new look in it and is easier to follow

## 2026-11-02 — Tests check that a message is marked as an error, not its exact red
Chose: each red message gets an alert mark, a hidden sign that says "this is an alert", and the tests check for that mark
Other option: make the tests check the exact new red, or stop checking at all
Why: the tests can't see colors from the styles file. Checking for the alert mark is what really matters. Also, for people who can't see the screen and have the computer read the page out loud, an alert gets read out right away

## 2026-11-02 — Boxes for typing get their own solid color in dark mode
Chose: the boxes are a soft cream in light mode and a dark brown in dark mode. In dark mode, their edge is a lighter brown
Other option: one see-through white for both, with the same wood-brown edge, like in my first try-out of the look
Why: in dark mode, see-through white turns the boxes grey, and my light words on grey were hard to read. The darker edge almost disappeared against the dark page, so I couldn't see where a box was
Replaced by: "At night, the page is all greys, buttons too" (2026-11-03). Only at night: there, the boxes are dark grey with a lighter grey edge

## 2026-11-02 — CI runs the lint check too
Chose: every pull request now runs the lint check (a tool that reads the code and points out common mistakes), right after the tests. If it finds a mistake, the pull request can't be merged
Other option: keep running only the tests, and run the lint check by hand when I remember
Why: the lint check was already set up, but nothing ran it, so a mistake sat there unnoticed. Now it can't hide

## 2026-11-02 — Fix the lint mistake by rewriting how a list fills in, not by turning the rule off
Chose: the three steps that fill in the books, friends and loans lists are written a little differently, so the lint check can see they only fill in once the server answers. The page uses the same steps when it opens and after adding a book, friend or loan, and it works the same as before
Other option: tell the lint check to skip that one line, or turn that rule off for the whole page
Why: the rule is there to catch a page that keeps redrawing itself over and over. Turning it off for the whole page would also stop it checking new code I write later. Skipping one line would hide the warning instead of fixing the code

## 2026-11-02 — When the lists can't load, one red message shows at the top
Chose: if the server can't be reached or breaks when the page opens, one "Something went wrong. Try again." shows at the top, under "Lending Shelf". It stays until every list that broke has loaded again, so adding a book can't hide that Loans is still missing. The lists go through the same check in api.js as the buttons
Other option: one message under each list that failed (Books, Friends and Loans)
Why: when the server is down, all three lists fail together, so three of the same message would just repeat. Before, the page looked like I had no books, no friends and no loans, with nothing saying why

## 2026-11-02 — An answer the app can't read counts as "Something went wrong"
Chose: if the server says "OK" (or a rule says no, like Dune already being with Sam) but sends back a web page instead of the list of books or the reason why, api.js shows the usual "Something went wrong. Try again." It catches this in the same place it already catches the wifi being down
Other option: let each part of the page catch it on its own, or show a new, different message
Why: before, the lists just stayed empty and the buttons did nothing, with no message at all. Catching it in api.js means every button and list is covered at once, and one wording means I only have one message to look after

## 2026-11-02 — The red messages are one shared piece
Chose: one small piece of the page, called ErrorMessage, draws every red message. Books, Friends, Loans and the message at the top all use it. It lives in App.jsx, next to the piece that writes a book's name like "Dune (signed)"
Other option: keep writing out the red message by hand in all four places, or give the piece its own file
Why: four hand-written copies could drift apart. One might lose its alert mark, and then the computer wouldn't read it out loud right away for people who can't see the screen. The page is still just one file, so a separate file would only be one more place to look

## 2026-11-02 — Only books still out show a "due back" date
Chose: "Dune → Sam, due back 16 Nov" for a book Sam still has. A returned loan just says "(returned)", like now
Other option: show "due back" on every loan, returned ones too
Why: once Dune is back, the date doesn't help me, and it would make the list busier

## 2026-11-02 — "Due back" shows the day, not the time
Chose: "due back 16 Nov". The rule stays exact, so Dune lent at 8pm turns red after 8pm on the 16th
Other option: "due back 16 Nov, 8:00pm"
Why: it reads like a library slip. Turning red later that same day is close enough

## 2026-11-02 — An overdue loan's whole line turns red and says "overdue"
Chose: "Dune → Sam, due back 16 Nov · overdue", with the whole line in the shared red
Other option: only the date in red, or red with no word
Why: the whole line is easy to spot. The word helps people who can't see red, and gets read out by a screen reader

## 2026-11-02 — The server works out "due back" and "overdue"
Chose: the server sends each loan with its "due back" day and whether it's overdue. The page only shows them
Other option: the page adds 14 days to the lent date itself
Why: then "14 days" lives in one place. If I ever change it, the red lines and the "Sam can't borrow" rule can't disagree

## 2026-11-02 — "Is it overdue?" is decided in one spot
Chose: the server fetches the books Sam has right now, and one small check decides which are overdue. The red lines and the "Sam can't borrow" rule both use that same check
Other option: keep asking the database "does Sam have a book out longer than 14 days?" for the rule, with a separate check for the red lines
Why: two checks could slowly drift apart, so Dune might look fine in the list while the rules say Sam is overdue. Sam has 3 books at most, so fetching them all costs nothing

## 2026-11-02 — Editing a book follows the same checks as adding one
Chose: no blank title or author, the note is 30 letters at most, and a second Dune needs its own note. The book I'm editing doesn't count as a clash with itself
Other option: only check for blanks when editing
Why: otherwise an edit could sneak in the mix-ups adding stops, like two "Dune (paperback)"s

## 2026-11-02 — I can edit a book while it's lent out
Chose: yes. If Sam has Dune and I fix the author, the loans list shows the fixed name straight away
Other option: wait until Sam returns it
Why: fixing a spelling mistake doesn't change who has the book. A loan points at the book, so it always shows the book's name as it is now

## 2026-11-02 — Click a spine to edit that book in the form above the shelf
Chose: clicking a spine fills the book form with that book. The button says "Save", with a "Cancel" next to it, and the spine gets a highlight. Afterwards it goes back to "Add book"
Other option: an "Edit" button on every spine, or a pop-up box
Why: it uses the boxes I already have, and the shelf keeps its look

## 2026-11-02 — A spine is a button, so the keyboard can pick it too
Chose: each spine is a button that keeps the spine's look. Tab gets to it and Enter picks it, and a screen reader says which one is picked
Other option: make the spine clickable with the mouse only
Why: some people don't use a mouse. A button gives them the same way in, for free

## 2026-11-02 — A friend's page is a panel on the same page, not a new page
Chose: click "Sam" in the Friends list, and a box opens under Friends with Sam's loans and a "Close" button
Other option: a real separate page with its own address, which needs an extra add-on (React Router)
Why: it's the same click-and-fill idea as editing a book, with nothing new to install. Bookmarkable pages can be their own ticket later

## 2026-11-02 — What Sam's panel shows
Chose: "2 of 3 books" at the top. Then what Sam has now, with "due back" and red for overdue, like the loans list. Then past loans, newest first, with when each was lent and returned. Empty parts say "Nothing right now" and "No past loans yet"
Other option: past loans with no dates, and no "2 of 3"
Why: the dates show what really happened, which is why I keep returned loans. "2 of 3" tells me if I can lend Sam another before I try

## 2026-11-02 — The server answers "what are Sam's loans?"
Chose: a new server question that sends the books Sam has now, Sam's past loans, and the 3-book limit
Other option: the page picks Sam's loans out of the full loans list it already has
Why: the 3-book limit stays in one place, like "14 days". And the page doesn't have to sift through everyone's history to find Sam's

## 2026-11-02 — If Sam's loans can't load, the panel says so
Chose: the panel still opens, with the red "Something went wrong" message inside it and the "Close" button
Other option: show nothing, or put the message at the top of the page
Why: I clicked Sam, so the answer belongs where I'm looking. And without this, the page would break

## 2026-11-02 — Where the "Sam's loans" question lives in the server code
Chose: the address starts with /friends (/friends/Sam/loans), but the loans code answers it
Other option: let the friends code answer it, or use an address like /loans?friend=Sam
Why: the address reads like "Sam's loans", which is what it is. And the loans code already knows about loans, due back days and the 3-book limit, so nothing gets copied

## 2026-11-02 — "Newest first" means the book lent most recently
Chose: Sam's past loans are sorted by the day each book was lent, newest at the top
Other option: sort by the day each book came back
Why: lending is where every loan starts, so it's the simplest order to explain. Usually the two orders are the same anyway

## 2026-11-02 — Search filters the shelf as I type, right on the page
Chose: a search box above the shelf. As I type, only matching books stay. "dune" or "herb" both find "Dune by Frank Herbert", because capitals don't matter and part of a word is enough. The page does this with the books it already has
Other option: the server does the search, or I press a "Search" button
Why: it's instant and the simplest way. A home shelf is small enough to load all at once, and there's no rule here that could disagree with the server

## 2026-11-02 — Search only changes the shelf, and only looks at title and author
Chose: the "Pick a book" list in Loans always shows every book. If nothing matches, the shelf says "No books match 'xyz'". Copy notes aren't searched
Other option: also filter "Pick a book", or also search copy notes like "signed"
Why: if search quietly hid books in Loans, I could think a book was missing. Searching notes can be added later if I want it

## 2026-11-02 — Adding or saving a book empties the search
Chose: after I add or save a book, the search box empties and the whole shelf comes back
Other option: keep the search, even if the book I just saved doesn't match it
Why: if I've searched "herb" and add Matilda, she'd never show up, and I'd think adding her didn't work

## 2026-11-02 — Old loans keep showing the book's name, even if the book leaves the shelf
Chose: a past loan of Dune always says "Dune", so a book that's been lent can't be wiped out completely
Other option: really delete the book, and old loans say "(deleted book)"
Why: loans are my history, and the glossary already says they're kept. "(deleted book)" wouldn't tell me what Sam borrowed

## 2026-11-02 — The server won't delete a book that has ever been lent
Chose: if any loan points to Dune, now or in the past, deleting Dune is refused. A book that was never lent can still be deleted
Other option: "removing" a book just hides it from the shelf, but old loans still know it
Why: it fixes the crash with a small change. Hiding is a bigger new feature, and there's no Delete button yet anyway. It can be its own ticket later

## 2026-11-02 — The "can't delete" message says "This book…", like the other rules
Chose: "This book has been lent before, so it can't be deleted. Its loans need it."
Other option: name the book, like "Dune has been lent before…"
Why: none of the other rule messages name the book, and naming it would mean an extra lookup just for the message

## 2026-11-02 — The page doesn't get a "just in case" fix for a loan with no book
Chose: only the server rule. The page still expects every loan to have its book
Other option: the page shows "(unknown book)" instead of crashing
Why: the rule lives in one place. A safety net could quietly hide a real problem, and my database has no broken loans today

## 2026-11-02 — The books folder asks the lending folder "has Dune ever been lent?"
Chose: the books code asks the lending folder that one yes/no question itself, before it deletes Dune
Other option: go through the lending rule code, or copy the question into the books folder
Why: it's the same idea as lending asking "is Dune real?": a simple yes/no question with no rules attached. The rule itself ("can't delete") stays in the books folder

## 2026-11-02 — Friends ask for a book themselves, in the app
Chose: Sam opens the app and asks for Dune on their own. So friends will need a way to sign in
Other option: Sam texts me, and I type the request into the app myself
Why: I want friends to use the app too, not just me. Signing in is a big new piece, so it will take more than one ticket

## 2026-11-02 — Friends sign in with Google
Chose: Sam uses "Sign in with Google" to prove it's Sam
Other option: a secret link just for Sam, or an email and password
Why: a secret link works for anyone Sam forwards it to. Passwords mean I'd have to keep them safe and build "forgot my password". Google does that part for me, even though setting it up is fiddly
Changed by: "Friends can sign in with a username and password too" (2026-11-03). Google still works, but it's no longer the only way

## 2026-11-02 — Only friends I've added can sign in
Chose: I type Sam's Google email when I add Sam. Only someone signing in with that email is Sam. Anyone else is turned away
Other option: let anyone sign in, then I pick which friend they are
Why: strangers never get in, and there's no waiting step for me

## 2026-11-02 — I sign in with Google too, as the owner
Chose: I sign in with my own Google email. That email is the owner, who can do everything I can do today
Other option: only friends sign in, and the app stays open for me like now
Why: if I didn't sign in, anyone who found the page could delete Dune. Signing in is what keeps my side safe

## 2026-11-02 — Sam sees the whole shelf, but not who has what
Chose: Sam sees every book. Books that are out say "lent out", but not who has them. Sam also sees their own loans and requests
Other option: hide books that are out, or show Sam everything I see
Why: Sam can see Dune exists even while it's out, and other friends' borrowing stays private

## 2026-11-02 — Sam can only ask for books on the shelf
Chose: the ask button only shows on books that aren't lent out
Other option: let Sam ask for Dune while Alex has it, like a waiting list
Why: a waiting list brings its own questions, like who goes first. It can be a later feature
Replaced by: "Sam's page says at home" (2026-11-03). Same choice, but the word is "at home" now, because my shelf means every book I own

## 2026-11-02 — The lending rules are checked when Sam asks, and again when I approve
Chose: if Sam already has 3 books or an overdue one, Sam is told right away and the request never reaches me. The rules run again when I say yes
Other option: only check when I approve
Why: Sam finds out straight away, and I don't get requests I can't say yes to. The second check catches anything that changed in between

## 2026-11-02 — Waiting requests count toward the 3-book limit
Chose: books Sam has plus Sam's waiting requests can't go over 3
Other option: only count books Sam has, so Sam can ask for as many as they like
Why: otherwise I'd get requests that are bound to fail once I say yes to one

## 2026-11-02 — Only one friend can ask for a book at a time
Chose: while Sam's request for Dune waits, Dune shows "asked for" and Alex can't ask. If I say no to Sam, Alex can ask then
Other option: let both ask, and I pick who gets Dune. The other one gets an automatic no
Why: it's simpler, and nobody gets turned down without me deciding

## 2026-11-02 — Saying yes lends the book right away
Chose: when I approve Sam's request for Dune, Dune is lent to Sam on the spot, and the 14 days start then
Other option: approving just means "come get it", and I click "lent" later when I hand it over
Why: fewer steps, and my lending rules work as they are. A day or two of pickup time out of Sam's 14 days is fine among friends

## 2026-11-02 — When I say no, I can add a short note
Chose: when I decline, I can type a few words, like "I'm rereading it this week", and Sam sees them. I can also leave it blank
Other option: no note at all, or always have to give a reason
Why: sometimes a reason is kind and saves a text. Making it required would be a chore

## 2026-11-02 — After a no, Sam can ask again any time
Chose: Sam can ask for Dune again straight away, as long as Dune is on the shelf and the rules allow it
Other option: Sam has to wait a few days before asking for Dune again
Why: these are my friends, so a waiting period feels unfriendly. If Sam asks too often, I can text them
Replaced by: "Sam's page says at home" (2026-11-03). Same choice, but the word is "at home" now, because my shelf means every book I own

## 2026-11-02 — Sam can take back a request before I answer
Chose: Sam can cancel a waiting request. Dune goes back to being free for anyone to ask for
Other option: Sam has to wait for me to say no
Why: otherwise Dune stays "asked for" for nothing, and the request keeps counting toward Sam's 3

## 2026-11-02 — Answered and cancelled requests are kept
Chose: every request stays as a record. Sam's page shows things like "Dune — declined: rereading it" or "Dune — cancelled". A yes points to the loan it started
Other option: a request disappears once it's answered or cancelled
Why: it matches loans, which stay after the book comes back. And Sam can still read my note later

## 2026-11-02 — A waiting request never runs out by itself
Chose: Sam's request waits until I answer it or Sam cancels it
Other option: after 7 days it's turned down automatically
Why: an automatic no could feel like I said no. Sam can cancel if they get tired of waiting

## 2026-11-02 — I see requests in a list at the top of my page
Chose: when I sign in, a "Requests" list shows "Sam asked for Dune" with Approve and Decline buttons. Nothing is sent to me
Other option: also get an email every time someone asks
Why: sending emails is a separate chunk of work. It can be its own ticket later

## 2026-11-02 — I can still lend a book without a request
Chose: the lend form I use today stays. Requests are an extra way to start a loan, not the only way
Other option: every loan has to start as a request
Why: it's how I lend today, and not every friend will bother signing in

## 2026-11-02 — I answer Sam's request before lending that book to someone else
Chose: if Sam has asked for Dune, the lend form tells me "Sam has asked for this book". I decline Sam first (maybe with a note), then lend Dune to Alex
Other option: lend Dune to Alex, and Sam's request is turned down automatically
Why: it's one extra click, and Sam never gets a no I didn't choose

## 2026-11-02 — I can't delete a book anyone has ever asked for
Chose: if anyone has ever asked for Dune, even if I said no, Dune can't be deleted. Same as books that have been lent
Other option: delete Dune and its old requests with it
Why: it's the rule I already have for loans, and Sam's history never ends up with holes in it

## 2026-11-02 — "Can't delete a friend with history" is its own ticket
Chose: write it up as a separate issue: I can't delete Sam if Sam has ever borrowed or asked for a book
Other option: fix it as part of the requests work
Why: it's broken today, with or without requests. Keeping it apart keeps each change small and easy to follow

## 2026-11-02 — A friend's email is optional
Chose: I can leave out a friend's email. Friends without one can't sign in, and I lend to them like today
Other option: every friend must have an email
Why: not everyone will sign in, like my gran. My friends already in the app keep working without me filling anything in

## 2026-11-02 — Friend requests come in five tickets
Chose: 1) I sign in, 2) friends sign in, 3) Sam asks and cancels, 4) I approve or decline, 5) can't delete a book anyone asked for
Other option: one big ticket, or friends first and me later
Why: each ticket works on its own. Locking my side first means the app is never open to strangers, even halfway through

## 2026-11-02 — The page shows the Google button, and sends the sign-in with every request
Chose: Google gives the page a sign-in after I click its button. The page keeps it in the browser and sends it along every time it talks to the server. The server asks Google "is this real, and whose is it?"
Other option: the server remembers me after the first sign-in, like a shop that stamps your hand at the door
Why: the server doesn't have to remember anyone, and Google does the hard checking. Hand-stamping is more setup, because the page (on Vercel) and the server (on Render) are two separate places

## 2026-11-02 — A sign-in lasts about an hour
Chose: Google's sign-in runs out after about an hour. After that, the server says "I don't know you" and the page goes back to the Google button
Other option: keep me signed in for weeks, with something extra that quietly renews the sign-in
Why: it's the simplest thing that's safe. Reloading within the hour keeps me in. If signing in every hour gets annoying, renewing can be its own ticket later

## 2026-11-02 — A stranger is told they're not on the list
Chose: the server tells apart "a real Google sign-in, but not on the list" and "no sign-in, or an old one". A stranger sees "You're not on the list." An old sign-in just says "Please sign in."
Other option: one message for both
Why: if my own sign-in runs out, I shouldn't be told I'm not on the list. That would be scary and wrong

## 2026-11-02 — Everything is locked, except the health check
Chose: one gatekeeper stands in front of everything the server does. Only the health check stays open
Other option: lock each part (books, friends, loans) one by one
Why: anything new I add is locked by itself, so I can't forget one. The health check is a tiny "are you awake?" question Render asks the server. It shows no books, so it can stay open
Changed by: "The sign-in address is open, like the health check" (2026-11-03). POST /sign-in is open too

## 2026-11-02 — Sign-in gets its own folder, without the usual layers
Chose: a new "auth" folder on the server holds the gatekeeper and the part that asks Google "who is this?"
Other option: put sign-in inside the books, friends or loans folder, or give it all four layers like the others
Why: sign-in isn't about books, friends or loans. It stands in front of all of them. It doesn't store anything, so it has no use for the layers that save and load data

## 2026-11-02 — The server won't let anyone in if a setting is missing
Chose: if my owner email or the Google client id is missing from the server's settings, nobody gets in, not even me
Other option: carry on without it
Why: without the client id, Google's checker skips "was this sign-in made for my app?". Then a sign-in made for some other website could get into my shelf

## 2026-11-02 — I edit a friend from their panel
Chose: Sam's panel gets an Edit button. It puts Sam's name and email in the friend form at the top, with Save and Cancel, like clicking a book's spine
Other option: an edit box inside Sam's panel, or an Edit button next to each name in the list
Why: it works the same way as editing a book, so there's nothing new to learn. The panel is already where I go to look at Sam

## 2026-11-02 — Sam's addresses are only for friends, even for me
Chose: the friend shelf view and "my loans" answer only a signed-in friend. If I ask for them, the server says "Only a friend can do that." Each address belongs to one side: mine, or a friend's
Other option: let me see the friend shelf view too, since it shows nothing secret
Why: I have no loans of my own, so "my loans" means nothing for me. And one simple rule, "every address is mine or a friend's", is easier to check than a mix

## 2026-11-02 — Sam's own request also stops my lend form lending Dune to Sam
Chose: if Sam is waiting on Dune, my lend form says "Sam has asked for this book", even when I pick Sam. I answer Sam's request instead
Other option: let the lend form lend Dune to Sam, since Sam is the one who asked
Why: otherwise Sam would have Dune and a request for Dune still waiting at the same time. Saying yes to the request does the same lending, and keeps the two connected

## 2026-11-02 — When a book was both lent and asked for, I hear about the loan
Chose: if Dune has been lent and also asked for, deleting it says "This book has been lent before…". The "asked for" message only shows when there's no loan. Sam works the same way
Other option: one message that names both, or the "asked for" one first
Why: an approved request always comes with a loan, so the loan message covers it. One clear reason is enough to know why Dune stays

## 2026-11-02 — Sam's panel asks for Sam's requests separately
Chose: Sam's panel asks the server twice: once for Sam's loans (like today) and once for Sam's requests
Other option: one answer with both loans and requests in it
Why: loans and requests live in different folders on the server. Asking twice keeps each folder in charge of its own things, and the loans answer stays the same as before

## 2026-11-02 — My decline note is optional, and short
Chose: when I say no to Sam, I can write a note of up to 200 letters and spaces, or nothing at all. A longer note is turned away with a plain message, and Sam's request keeps waiting. No note is saved as an empty note
Other option: make a note required, or let it be as long as I like
Why: sometimes "no" needs no reason. 200 is plenty for "I'm rereading it this week", and it keeps the note a few words, not a letter

## 2026-11-02 — Declining is one click, with the note box always showing
Chose: each waiting request in my Requests list has its note box out all the time, next to Approve and Decline. I type a note if I want, then click Decline. No "are you sure?" step
Other option: click Decline first to open the note box, or ask me to confirm
Why: it's the quickest way to answer Sam. A decline lends nothing and Sam can ask again straight away, so a slip is easy to fix

## 2026-11-02 — If lending breaks while I approve, the request goes back to waiting
Chose: approving still says yes first, so two clicks lend Dune only once. But if saving the loan then fails, my yes is undone. Sam's request is back on my Requests list, and Sam sees it waiting again
Other option: leave it marked "approved", even though Dune was never lent
Why: an "approved" with no loan is a lie. Sam would think Dune is coming, and I'd have nothing left to click. Putting it back means I can just click Approve again
Replaced by: "Approving lends the book first, then says yes" (2026-11-03). Now my yes comes last, so there's no yes to undo

## 2026-11-02 — The database itself stops Dune having two active loans
Chose: the database refuses a second loan of Dune while one is still out. If that ever happens, I see the usual "This book is already lent out"
Other option: rely only on the lending rules, which already check this
Why: if my lend form and my Approve button lend Dune at the very same moment, both can pass the rules before either is saved. Then Dune would be with Sam and Alex at once. It's the same guard that already stops two waiting requests for one book

## 2026-11-02 — The database itself stops two friends having the same email
Chose: the database refuses a second friend with an email that's already taken. Friends with no email don't count. If it happens, I see the usual "Sam already has this email."
Other option: rely only on the friend form's check
Why: the same "two clicks at once" problem. Two friends with one email would mean sign-in can't tell who it is

## 2026-11-02 — A decline note of only spaces is no note
Chose: spaces around my note are trimmed. A note of only spaces is saved as no note, so Sam just sees "declined"
Other option: save it exactly as typed
Why: same idea as "spaces aren't a real author". Sam would otherwise see an empty note in quotes. Spaces also don't eat into the 200 letters

## 2026-11-02 — Requests get their own routes file, like books, friends and loans
Chose: every requests address now lives in requests/request.routes.js, each one still marked as mine or Sam's. Sam's shelf view and Sam's loans moved out of app.js the same way, into the books and loans folders. The addresses didn't change
Other option: keep listing them one by one in app.js
Why: app.js should only plug the folders in. When I work on requests, all of it is in one folder, like we chose when we sorted the server by feature

## 2026-11-02 — Leave the rare "approved with no loan" gap for now
Chose: leave it, and say so in the pull request. While I approve Sam's request for Dune, there's a split second where Dune isn't "asked for". If Alex asks right then and saving the loan also fails, Sam's request stays "approved" with no loan
Other option: keep Dune "asked for" for the whole approve, or decline Sam's request by itself if this happens
Why: it needs a click and a broken database in the same fraction of a second. Keeping Dune asked for is more code to get right, and an automatic decline would tell Sam no when I never said it
Replaced by: "Approving lends the book first, then says yes" (2026-11-03). The gap is closed now

## 2026-11-03 — Deleting a book first checks the book is there
Chose: before deleting, the server checks the book exists, the same check editing uses. An address like /books/abc now gets "Book not found" instead of a crash
Other option: catch the crash and turn it into "Book not found"
Why: editing a book already works this way, so delete now matches it. Checking first is plainer than waiting for something to break

## 2026-11-03 — The red message piece moves to its own file
Chose: ErrorMessage now lives in its own small file, ErrorMessage.jsx. App.jsx and the Google sign-in file both use it, so the "Sign-in isn't set up yet" message is drawn the same way as every other red message
Other option: leave it in App.jsx, and keep writing the sign-in message out by hand
Why: this changes the earlier choice to keep it in App.jsx. That made sense while only App.jsx needed it. Now the sign-in file needs it too, and it shouldn't borrow from App.jsx, because App.jsx already uses the sign-in file. Two files that lean on each other are confusing and easy to break. With its own file, both can use it

## 2026-11-03 — Claude offers its learning questions instead of always asking
Chose: before a ticket, after a ticket, and at the start of a session, Claude offers its questions, and I can say "skip"
Other option: keep asking every time, as before
Why: I was skipping most of them, often because we had already talked the plan through. An offer still keeps the questions there for when I want them
Replaced by: "One quiz offer per ticket, not two" (2026-11-03), for the start of a session only. A new conversation no longer starts with questions

## 2026-11-03 — Deleting a friend first checks the friend is there
Chose: before deleting, the server checks the friend exists, the same check editing a friend uses. An address like /friends/abc now gets "Friend not found" instead of a crash
Other option: catch the crash and turn it into "Friend not found"
Why: this is the same fix books got in #62, so deleting a book and deleting a friend now work the same way

## 2026-11-03 — Looking up one book or friend treats a wrong-shaped address as "not there"
Chose: when the server looks up one book or one friend, an address like /books/abc or /friends/abc gets "not found" straight away, before asking the database. Opening Dune or Sam at a bad address now says "Book not found" or "Friend not found" instead of crashing
Other option: add a separate "is it there?" check before each lookup, the way deleting and editing do
Why: the lookup already gives back "nothing" when there's no such book or friend, so a wrong-shaped address can simply give back nothing too. That saves asking the database twice just to show one book. Looking up one loan or one request already works this way, so now all four match

## 2026-11-03 — The 3-book message starts with a capital letter
Chose: "This friend already has 3 books", with a capital T, like the other red messages
Other option: leave it lowercase
Why: every other message starts with a capital, like "This book is already lent out". The lowercase one looked like a typo

## 2026-11-03 — "Loan not found" loses its extra space, and gets a test
Chose: take out the stray space at the end of "Loan not found", and add tests that check the exact words when returning a loan that isn't there
Other option: just remove the space, with no new test
Why: no test looked at the words, which is how the space slipped in unnoticed. Now a test would catch it if it came back

## 2026-11-03 — The server gets the lint check too, set up like the page's
Chose: the server now has the lint check too, with the same basic rules the page (client) uses. It runs on every push, and if it finds a mistake, the pull request can't be merged. It knows test files may use Jest's words, like "test" and "expect"
Other option: a stricter rule set, or no checker and rely on tests and review
Why: it catches small slips, like a leftover variable or a name used without being brought in, before they reach Sam. Using the same rules as the page keeps both halves of the app checked the same way. The server code already passed, so no rules had to be switched off

## 2026-11-03 — A check for duplicates that would switch off the database rules
Chose: a small check I run by hand from the server folder. It lists any book with more than one active loan, any friends sharing an email, and whether each database rule is really on. It only reads, it never changes anything
Other option: look through the database by hand, or have the server fix duplicates by itself
Why: if Dune already has two active loans, the database quietly skips the "one active loan per book" rule, and nothing warns me. The rules went live on 2 November, so they may already be off. Fixing a duplicate means choosing which loan or friend is the real one, and only I know that. "Sam@Gmail.com" and "sam@gmail.com" count as the same email, like everywhere else in the app, and the check shows how each was saved. Two friends saved with an empty email count too, because the database treats that as an email. Before 2 November I could delete a book that was still lent out, so the check still finds loans whose book is gone

## 2026-11-03 — The duplicate check skips the app's four layers
Chose: the check sits in its own scripts folder and reads books, friends and loans itself. It still uses the app's own description of a book, a friend and a loan, and the same email tidy-up
Other option: go through all four layers, like lending Dune to Sam does
Why: those steps are for the page asking the server to do something. Nobody clicks a button for this check. I run it by hand, it reads, and it stops. It also needs things the app never asks for, like loans whose book was deleted, and whether a database rule is on. Adding those to the app's layers would put code there that the app itself never uses

## 2026-11-03 — The coding rules get their own short list, CODING_STANDARDS.md
Chose: one file with the 21 rules the code should follow, like "every red message uses ErrorMessage" and "the code says copyNote, not note". Each rule names the decision it came from, and the reasons stay in DECISIONS.md
Other option: leave the rules inside DECISIONS.md, or copy each reason into the new file too
Why: to check that a new change shows "Dune (signed)" the right way, the reviewer had to dig through almost 150 decisions to find a handful of rules. One list is quicker to check against. Pointing back instead of copying the reasons means there's only one place to change each one

## 2026-11-03 — Start fresh after each ticket, with a handoff note when needed
Chose: when a ticket is merged, Claude first offers its quick questions about it, then tells me to type /clear. If we stop in the middle, or the counter at the bottom of my screen reaches 140k, Claude first writes a handoff note saying where we are, then tells me to clear and ask it to read the note
Other option: keep one long conversation going until it runs out of room
Why: a long conversation gets slow and Claude starts forgetting the early parts. A merged ticket is a clean place to stop, since everything is saved on GitHub. If we're halfway through, like in the middle of lending Dune to Sam, the note keeps the bits that aren't saved anywhere yet

## 2026-11-03 — The handoff note lives in HANDOFF.md, kept out of git
Chose: the handoff note is always a file called HANDOFF.md in the main project folder. Git ignores it, so it never goes into a pull request. Each new note replaces the old one. If the note isn't there, Claude says so
Other option: save it in Claude's memory folder, or commit it to GitHub with the ticket
Why: today a fresh Claude couldn't find the note, because nothing said where it was. One fixed name in the main folder is the first place to look, and I can open it myself too. The note only matters for the next conversation, for example if we stopped halfway through lending Dune to Sam. So it doesn't belong in the app's history on GitHub

## 2026-11-03 — Approving lends the book first, then says yes
Chose: when I approve Sam's request for Dune, Dune is lent first, and only then is the request marked "approved". This replaces two entries from 2026-11-02: "leave the gap for now" and "the request goes back to waiting". Sam's request keeps waiting the whole time, so nobody else can ask for Dune in between. If saving the loan breaks, the request was never changed, so there's nothing to undo. If the yes can't be saved after Dune was lent, or Sam cancels in that same split second, the new loan is removed. Dune was never really handed over, so the loan isn't kept as a record. If I click Approve twice, the database's "one active loan per book" rule lets only one loan through
Other option: decline Sam's request on its own when lending breaks
Why: Sam would be told "no" when I never said no. Lending first closes the gap and makes the code shorter

## 2026-11-03 — One quiz offer per ticket, not two
Chose: after each ticket, Claude makes one offer: 1–2 questions about what we just did, plus 1 about an earlier ticket. A new conversation no longer starts by offering review questions. This changes part of the earlier choice "Claude offers its learning questions instead of always asking". The offers before and after a ticket stay
Other option: keep the start-of-conversation offer, but skip it if a ticket was merged that day. Or only offer it when we pick up from a handoff note
Why: after the last ticket was merged, I got questions, typed /clear, and was offered more questions right away. That's two offers in a row. Adding one older question to the after-ticket offer still brings old tickets back, so I don't forget them

## 2026-11-03 — The DECISIONS.md format is written in one place only
Chose: the layout for these entries now lives only in CLAUDE.md, the file Claude reads at the start of every conversation. Claude's other guide, docs/agents/domain.md, just points to it
Other option: keep it only in docs/agents/domain.md, or keep both copies
Why: with two copies, one could change and the other wouldn't, and they'd quietly stop matching. That had already started: one showed a real date, the other showed a blank to fill in. It's the same idea as the coding rules list, which points back instead of copying

## 2026-11-03 — A test checks that the words on every spine are easy to read
Chose: a test reads the colors from the styles file and checks the book's name and the author on every spine (today green, rust and gold), in light and dark mode. The word color must be at least 4.5 times brighter than the spine color, the usual rule for easy reading. If a color is written in a way the test can't read, the test fails instead of skipping it. Before, I checked this by hand
Other option: open the page in a real browser and measure the colors there, or keep checking by hand
Why: if I change a spine color later, the test tells me right away when a name like "Dune (signed)" gets hard to read. Reading the file is quick and needs no browser. It would miss a color set somewhere else, but today every color is in that one file
Replaced by: "Each color is written once, as a day and night pair" (2026-11-03). The test now also checks that every color is written once as a pair, and that night is all greys except the red

## 2026-11-03 — Color names say what they're for
Chose: in the styles file, the button color is called "button" instead of "green", and the words on it "on button" instead of "on green". The three spine colors are called "spine green", "spine rust" and "spine gold" instead of "spine 1, 2, 3"
Other option: only rename the button color, and keep the spines numbered with a note next to each one saying its color
Why: a name like "green" doesn't say it's for buttons, and "spine 2" doesn't say it's rust. Now the name alone tells me, with no note to read. The spine test finds the spines by name now, not by number

## 2026-11-03 — The review takes a phone-size picture when the look changes
Chose: a "picture mode" that only runs on my computer. It shows my shelf with pretend books, friends, loans and a request, including one book with a very long name, so no Google sign-in or database is needed. A /phone page shows the shelf exactly as wide as a phone. When a ticket changes how the page looks, the review takes a picture of it and shows me
Other option: the review stops and asks me to take the picture myself
Why: the review can't sign in with my Google account, so it couldn't see the real page. With pretend answers it can look on its own every time. The long name is there on purpose, to catch a title that gets cut off or spills past the edge. The real app never uses picture mode

## 2026-11-03 — "My shelf" means every book I own
Chose: my shelf is every book I own, whether it's at home or lent out. If Dune is with Sam, it's still on my shelf
Other option: the shelf is only the books at home right now
Why: the glossary used "on my shelf" both ways, which was confusing. Owning a book doesn't stop when I lend it. A request still only works for a book that isn't lent out, and the glossary now says that plainly
This changes the earlier choice of words: two entries from 2 November ("Sam can only ask for books on the shelf" and "After a no, Sam can ask again any time") say "on the shelf" to mean at home. Those choices still stand, only the word changed. Sam's page labelled a book at home "on the shelf". That label changed to "at home" in its own ticket (see "Sam's page says at home", 2026-11-03)

## 2026-11-03 — Show "12 books" under the title
Chose: a small soft-brown line under the Lending Shelf title says how many books are on my shelf, lent out ones too. It says "1 book" for one and "0 books" for none. Friends like Sam see it on their page too
Other option: count only books at home, or show "2 of 12 books" while I search
Why: I wanted to know how big my shelf is at a glance. Each book already says if it's lent out, so the count doesn't need to. Searching doesn't change what I own, so the number stays the same. Sam can already count the books, so showing the number gives nothing away. The plan said grey, but the page has no grey, only warm browns and cream, so grey looked cold. I picked a new soft brown that's still easy to read in light and dark mode
Replaced by: "At night, the page is all greys, buttons too" (2026-11-03). Only at night: there, the line is a soft grey instead of brown

## 2026-11-03 — No count until the books arrive
Chose: the count shows nothing while the books are on the way, and nothing if they can't load
Other option: show "Counting…" while waiting
Why: before the server answers, the page has no books yet, so it would wrongly say "0 books" and look like my shelf got wiped. A blank line for half a second is easy to miss, and if loading breaks, the red message already says so

## 2026-11-03 — Sam's page says at home
Chose: a book that isn't lent out or asked for is labelled "at home" on Sam's page, like "Dune · at home". Only those books get the Ask button, same as before
Other option: keep "on the shelf"
Why: my shelf now means every book I own, lent out or not, so "on the shelf" didn't say the book was free. "At home" says where the book really is

## 2026-11-03 — The three book words are written once on each side
Chose: the server and Sam's page each keep "at home", "lent out" and "asked for" in one short list, and use that list instead of typing the words again
Other option: share one list between the server and the page, or leave the words typed out wherever they're used
Why: Sam's page shows the Ask button only when the server says "at home". If one side changed the word and the other didn't, the Ask buttons would quietly vanish. One list per side means a rename is one line on each side. Sharing one list would need a new shared folder, and that's too much for three words. The tests still type the real words, so a slip on either side makes a test fail

## 2026-11-03 — Friends rate each copy, once each
Chose: a friend gives a copy of a book 1 to 5 stars. Each friend has one rating per copy. If Sam borrows the signed Dune twice, he still has one rating for it, and he can change it but not remove it
Other option: one rating per loan, so Sam rates Dune again every time he borrows it. Or one rating per book for all copies together
Why: if Sam read Dune five times, one rating per loan would count him five times in the average. Each copy gets its own stars because a cleaner, newer copy can be nicer to read than a worn one. Changing covers "I changed my mind". Removing would need another button and rule I didn't ask for

## 2026-11-03 — Sam can rate a copy once he's returned it
Chose: Sam can rate the signed Dune after he has returned it at least once, even if he has it again now. Only friends rate. I don't
Other option: let Sam rate while he still has it the first time, or let me rate my own books too
Why: he should finish the book before rating it. My own stars would mix with what my friends think, and a 5 from me on my favourite would push its average up

## 2026-11-03 — Sam rates on the shelf list, by clicking a star
Chose: on Sam's shelf list, a copy he can rate but hasn't rated yet shows five empty stars ☆☆☆☆☆. Clicking one saves right away, with no Save button. His own stars are labelled "your stars" so they don't get mixed up with the average
Other option: rate from the "had before" list of returned loans
Why: a book Sam borrowed twice appears twice in "had before", so he'd see the same stars on two rows. On the shelf list each copy appears once

## 2026-11-03 — Sam's shelf says where he can rate, and only his own stars
Chose: when Sam opens his page, the shelf the server sends marks each copy he has returned as one he can rate, with his own stars if he gave some. A copy he can't rate says nothing about stars. The server works out it's Sam from his sign-in, so Alex's stars never reach Sam's page
Other option: a separate list of Sam's ratings that the page matches up with the shelf
Why: the page already gets the shelf to draw each book, so the stars come along with it. One list means the page never has to match two lists up, and can't show stars on the wrong Dune

## 2026-11-03 — The review can picture Sam's page too
Chose: picture mode has a second page, /phone?as=friend, that shows Sam's page with pretend answers: one copy he rated 4, one he can rate but hasn't, and the long book name with stars under it. Plain /phone still shows my shelf
Other option: only picture my page, and check Sam's stars by hand
Why: the stars only show on Sam's page, so a picture of my page would never show them. Pretend answers mean no Google sign-in is needed for Sam either

## 2026-11-03 — The average shows with how many rated it
Chose: each copy shows "★ 4.5 · 2 ratings" ("1 rating" for one), and nothing at all when no one has rated it. I see only the average. Sam sees the average and his own stars, never what Priya gave
Other option: show just "★ 4.5", show "0 stars" for no ratings, or show me who gave what
Why: 5 stars from one friend means less than 4.5 from six, so the count matters. "0 stars" would look like everyone hated it. If friends could see each other's stars, Priya might feel awkward giving a low one

## 2026-11-03 — The average gets its own line
Chose: on my shelf, the average sits on the spine under the author. On Sam's page, it sits on its own line between the Ask button and "your stars"
Other option: put the average on the same line as "your stars"
Why: side by side, Sam might read "★ 4.5" as his own stars. On separate lines, "your stars" is clearly his and the line above is everyone's

## 2026-11-03 — The shelf asks the ratings folder straight for stars
Chose: when the books folder builds my shelf or Sam's, it asks the ratings DAO for Sam's own stars and for each copy's average. This covers the "your stars" from the last ticket too
Other option: go through the ratings service, which would only pass the question along
Why: these are plain look-ups with no rules in them, so a step in the middle would add a file that does nothing. The rating rules (only after returning, 1 to 5 stars) still live in the ratings folder

## 2026-11-03 — The search box stretches across the shelf
Chose: the search box is as wide as the shelf, on a phone and on a big screen
Other option: make it wider only on a phone, and keep it short on a big screen
Why: on a phone the short box cut its hint off at "Search by title or auth". One rule for every screen is simpler, and a long box sitting right above the books reads as "search this shelf"

## 2026-11-03 — Picture mode gets its own door
Chose: picture mode opens on 5174, and the real app stays on 5173. The browser keeps each door's saved things apart, so picture mode's pretend sign-in stays on 5174. The real app never sees it, and my real sign-in on 5173 is never touched
Other option: keep both on 5173, and teach the real app to look for the pretend sign-in in a separate place first
Why: changing the door is one small change inside picture mode, and the real app's code doesn't change at all. A bonus: picture mode can now run while the real app is running too

## 2026-11-03 — Sam's picture shows every part of his page
Chose: in picture mode, Sam now has a book with him right now (Holes), and he's asked to borrow Matilda again. Now every list on his page has something in it. He doesn't ask for Dune, because Ana already did, and only one friend can ask for a book at a time. Rule 6 now says to picture /phone?as=friend when a ticket changes Sam's page
Other option: leave his "Has now" and "My requests" lists empty, and leave rule 6 naming only my page
Why: an empty list only says "Nothing right now", so a picture would never show how a loan or a request looks on a phone, or whether its Cancel button fits

## 2026-11-03 — Ana asks for a second copy of the long book in the picture
Chose: picture mode now has a paperback copy of the long book, sitting at home, and Ana asks for it. So the Requests list shows the long name too
Other option: have Ana ask for the Grandma copy, the one Sam has
Why: that copy is lent out, and the app never lets anyone ask for a lent-out book. A picture of something that can't happen could hide a real problem, or show one that isn't real

## 2026-11-03 — The picture opens Sam's panel by itself
Chose: on my page, picture mode clicks Sam's name as soon as it shows up, so his panel is open in the picture. His panel has the long book in "Has now", "Past loans" and an old request I said no to, with my note
Other option: teach the real app to open a panel from the web address, like /?open=sam
Why: the click lives only in picture mode, so the real app's code doesn't change at all. It's the same idea as picture mode's pretend sign-in

## 2026-11-03 — The phone picture is 3000 tall, not 2400
Chose: the phone frame and the picture are now 3000 tall
Other option: keep 2400, and leave things out of the picture so my page stays short
Why: with Sam's panel open and a second request, my page got longer, and the Return button at the bottom was cut in half. A taller picture shows the whole page, and the empty space at the bottom does no harm

## 2026-11-03 — The "Charcoal library" night look is two tickets
Chose: ticket 1 only changes the night colors to greys: a charcoal page, a grey shelf board, spines in different greys, and light grey words. Ticket 2 makes lent-out spines look darker and faded
Other option: do it all in one ticket
Why: right now a lent-out book like Dune looks the same as a book at home. Showing the difference changes how the shelf works, not just its colors, so it's easier to follow as its own step
Replaced by: "A Day / Night button, as its own ticket" (2026-11-03). Now it's three tickets: the grey colors, then the button, then the lent-out look

## 2026-11-03 — At night, the page is all greys, buttons too
Chose: the "Charcoal library" night look: a charcoal page, a grey shelf board, dark grey spines with light grey words, and light grey buttons with dark words. This replaces the brown "dim reading room" night colors. The daytime cream look stays the same
Other option: keep the buttons soft green, or use pale grey spines with dark words
Why: I tried all three on my real page. All greys is the black-and-white look I wanted. Dark spines also leave room for lent-out books to look darker and faded later

## 2026-11-03 — Red messages stay red at night
Chose: in the all-grey night look, error messages like "This book is already lent out" stay soft red
Other option: make them light grey like everything else
Why: a grey error looks like any other line, so I could miss that Sam's book is overdue. One small splash of red still fits a black-and-white page

## 2026-11-03 — A Day / Night button, as its own ticket
Chose: a small button in the top corner of every page switches between the cream day look and the charcoal night look. The first time, it matches my computer. After I click it, it remembers my pick. It gets its own ticket, after the grey night colors and before the lent-out look
Other option: no button, so the page always follows my computer. Or put the button in the same ticket as the grey colors
Why: I want to pick the look myself without changing my computer's settings. The button is new behaviour, not just colors, so it's easier to follow as its own step

## 2026-11-03 — Each color is written once, as a day and night pair
Chose: every color in index.css is one line with two halves, the day color and the night color, like "the page is cream by day, charcoal at night". The Day / Night button just tells the page which half to use
Other option: keep the day colors in one list and the night colors in a second list, and copy one of the lists again for the button, like the prototype did
Why: with copies, changing the cream in one place could leave the old cream in another. One line per color means the day and night halves always sit side by side and can't drift apart

## 2026-11-03 — Friends can sign in with a username and password too
Chose: under the Google button, the sign-in page has Username and Password boxes. I give a friend like Gran a username and password in her panel. This changes "Friends sign in with Google" (2026-11-02): Google still works, it just isn't the only way any more
Other option: Google only, like before
Why: Gran has no Google account, so she couldn't get in at all. I make up her password myself and can type a new one if she forgets, so I still don't need "forgot my password" emails

## 2026-11-03 — The server only keeps a scrambled password
Chose: the server scrambles each password (with bcrypt) before saving it, and never sends it to the page, not even scrambled. The page only hears "has a password", so Gran's panel says "Has a password"
Other option: keep the password as I typed it, so her panel could show it
Why: if anyone ever saw the database, they still couldn't read Gran's password. Scrambling can't be undone, so the server checks a sign-in by scrambling what was typed and comparing

## 2026-11-03 — A blank password box keeps the old one
Chose: when I edit Sam, the password box starts empty. If I leave it empty, Sam keeps his password. If I type a new one, it replaces the old one. A line under the form says so
Other option: make me type his password again every time I edit him
Why: his password never comes back from the server, so I couldn't fill the box in. And I mostly edit Sam to fix his name or email, not his password

## 2026-11-03 — Passwords need 8 characters, usernames are one per friend
Chose: a password under 8 characters is refused with "A password needs at least 8 characters." A username is saved in small letters without extra spaces, and one another friend has is refused with "Sam already has this username."
Other option: allow any password, and let two friends share a username
Why: short passwords are easy to guess. And if two friends had the username "sam", the server wouldn't know which Sam is signing in

## 2026-11-03 — Every wrong try says the same thing
Chose: a wrong username and a wrong password both say "Wrong username or password." The server even takes the same time to answer
Other option: say "No friend has that username" when the username is wrong
Why: a stranger could try lots of names to find out which ones are my friends. One message gives nothing away

## 2026-11-03 — 5 wrong tries means a 15-minute wait
Chose: after 5 wrong tries for one username, that username has to wait 15 minutes from the 5th try, even with the right password: "Too many tries. Try again in 15 minutes." Slips spread out over time still add up, until 15 quiet minutes pass. Signing in right starts the count again. The count lives in the server's memory, so a restart forgets it
Other option: no limit, or save the count in the database
Why: without a limit, someone could guess Gran's password over and over. Keeping the count in memory is simple, and a restart now and then only gives a guesser a few more tries

## 2026-11-03 — The server makes its own sign-in for a password friend
Chose: a right username and password gets a sign-in our server makes and signs itself, with a secret from the settings (SIGN_IN_SECRET). It holds only the friend, and lasts 1 hour like Google's. The page saves it and sends it exactly like a Google one
Other option: make the page send the username and password with every request
Why: then Gran's password would travel with every click. A sign-in that runs out after an hour works the same way Google's does, so the rest of the page didn't need to change

## 2026-11-03 — "Who is this?" checks our own sign-in first, then Google
Chose: "who is this?" first looks at whether the sign-in is one our server made. If it is, it checks our signature and looks the friend up. If the friend has been deleted, it's nobody. Anything else goes to Google like before. A password sign-in can never make someone the owner
Other option: a separate gatekeeper for password friends
Why: one "who is this?" means every address works the same for Gran as for Sam. My own account keeps the stronger lock, because only Google can sign me in

## 2026-11-03 — No SIGN_IN_SECRET means password sign-in is off
Chose: if the server has no SIGN_IN_SECRET, the sign-in page says "Password sign-in isn't set up yet." and every password sign-in stops working. Google still works
Other option: say "Wrong username or password." like any other no
Why: it's the same rule as a missing Google client id: no secret, no way in. A plain message tells me straight away that I forgot the setting on Render, instead of making me think Gran's password is wrong

## 2026-11-03 — The sign-in address is open, like the health check
Chose: POST /sign-in sits outside the gatekeeper, like /health. Every other address still needs a sign-in. This adds one more exception to "Everything is locked, except the health check"
Other option: put it behind the gatekeeper
Why: Gran isn't signed in yet when she types her password, so the gatekeeper would turn her away before she could sign in

## 2026-11-03 — The password scrambler is bcryptjs
Chose: the server uses bcryptjs to scramble passwords, and jsonwebtoken to make and check its own sign-ins
Other option: the "bcrypt" package, which is a bit faster
Why: bcryptjs scrambles exactly the same way, but it's written in plain JavaScript, so it installs on Render and in the CI checks with no extra building. For a few friends, the speed doesn't matter
