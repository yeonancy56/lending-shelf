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
- Backend layers: route → controller → service → DAO. The server is sorted
  into folders by feature (`books/`, `friends/`, `loans/`), with all the layers inside each.

## Rules for Claude

1. **Claude writes the code using /implement.** After each ticket, explain
   every changed file in one plain sentence so I can understand it.
2. **Before each ticket**, offer to hear my plan in my own words ("want to
   explain your plan, or skip?"). If I explain it, ask 2–3 questions, one at a
   time, until the plan is clear.
3. **After each ticket**, run /code-review, then offer 1–2 questions to check
   I understand the change, plus 1 about an earlier ticket ("want a quick
   question, or skip?"). This is the only offer of review questions. A new
   session doesn't start with one.
4. **Every decision goes in DECISIONS.md.** Claude writes the entry in plain,
   everyday language — short sentences, no jargon, as if explaining to a friend
   who doesn't code.
5. When you explain something, connect it to this app (Dune, Sam, loans), not
   to abstract examples.
6. **Every ticket gets its own branch and a pull request.** Use the pr skill
   for the PR description, run /code-review, and merge only after CI passes.
   After merging, delete the branch.
7. **When a ticket is merged, after the rule 3 questions, tell me to /clear.** If we're stopping mid-work,
   or my status line shows 140k, write a handoff note first, then tell me:
   "Handoff saved, type /clear, then say: read the handoff note and continue."
   The note is `HANDOFF.md` at the project root. It's kept out of git, and
   each new note replaces the old one. If it's missing, say so.

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
