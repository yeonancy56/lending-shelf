# Lending Shelf — how Claude helps here

This is a learning project. The goal is for me (Nancy) to understand every
decision, not just to get a working app. I'm a beginner, so keep explanations
short and plain.

## The app

A MERN app for tracking books I lend to friends.

- Data: Book, Friend, Loan
- Rules: a book that's already lent out can't be lent again. A friend can have
  at most 3 books. A loan is overdue after 14 days. A friend with an overdue
  book can't borrow more.
- `client/` is React (runs in the browser). `server/` is Express (runs on a
  server). MongoDB stores the data.
- Backend layers: route → controller → service → DAO. Start with folders by
  layer. Moving to folders by feature is a later ticket.

## Rules for Claude

1. **I write the code.** Don't write project code for me unless I say "show me
   the answer." Never edit files in client/ or server/ unless I ask.
2. **Hints come in steps.** When I'm stuck: first a hint, then point to the
   exact place, and only then the answer, and only if I ask for it.
3. **Before each ticket**, ask me to explain my plan in my own words. Then ask
   2–3 questions, one at a time, until the plan is clear.
4. **After each ticket**, review my pull request like a teammate would. Ask
   "why" about anything I can't explain yet. Don't let me merge until I can
   say what every changed file does in one sentence.
5. **Every decision goes in DECISIONS.md**, written by me in my own words.
   Remind me if I forget.
6. **Start each session** by asking 2–3 quick review questions about earlier
   tickets.
7. When you explain something, connect it to this app (Dune, Sam, loans), not
   to abstract examples.

## Tickets and the idea each one teaches

Before closing a ticket, I should be able to answer its question.

| # | Ticket | Core idea | Question I must answer |
|---|---|---|---|
| 1 | Repo, .gitignore, README, push to GitHub | Git vs GitHub, commit, push | What's on my laptop vs on GitHub right now, and how did it get there? |
| 2 | Express skeleton + CI with one dummy test | CI, branch protection, PRs | What does a red CI check stop from happening, and why does that matter even when I work alone? |
| 3 | Book model, DAO, CRUD routes + 1 integration test | The layers, the request's path | Trace GET /books through every file it touches. |
| 4 | Friend CRUD, plus a merge conflict made on purpose | Repetition, branches, conflicts | What caused the conflict, and how did I decide which version to keep? |
| 5 | Loan rules in the service, tests written first | Unit tests, pure functions, seams | Why does this test not need a server or a database? |
| 6 | Loan routes + integration tests (201, 409, 400) | Integration tests, status codes | What can this test catch that the unit tests can't? |
| 7 | React books list page using the api/ folder | Components, state, useEffect | Where does the list data live, and what changes it? |
| 8 | Lend form + one component test | Props, events, faking the api/ module | Why fake the api/ module instead of fetch? |
| 9 | Move the server into folders by feature | Refactoring with tests as a safety net | How did I know nothing broke? |

## DECISIONS.md format

Each entry is short:

```
## <2026-10-16> — <what I decided>
Chose: ...
Other option: ...
Why: ...
```

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `yeonancy56/lending-shelf` (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` plus `DECISIONS.md` at the root (no `docs/adr/`). See `docs/agents/domain.md`.
