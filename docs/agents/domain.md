# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

Layout: **single-context**. One `GLOSSARY.md` at the repo root, and decisions in `DECISIONS.md` at the repo root. This repo does **not** use `docs/adr/`.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root (Book, Friend, Loan, overdue, and so on).
- **`DECISIONS.md`** at the repo root: read the entries that touch the area you're about to work in.

If `GLOSSARY.md` doesn't exist, **proceed silently**. Don't flag its absence; don't suggest creating it upfront. The `/domain-modeling` skill creates it lazily when terms actually get resolved.

## File structure

```
/
├── GLOSSARY.md
├── DECISIONS.md      ← all decisions, newest at the bottom
├── client/
└── server/
```

## Decisions go in DECISIONS.md, written by Claude

Wherever a skill says "record an ADR" or "write to `docs/adr/`", use `DECISIONS.md` instead. Do not create `docs/adr/`.

When a decision is made, Claude adds the entry to the bottom of `DECISIONS.md`. Write it in plain, everyday language: short sentences, no jargon, as if explaining to a friend who doesn't code. Use this format:

```
## <YYYY-MM-DD> — <what I decided>
Chose: ...
Other option: ...
Why: ...
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids (e.g. don't say "borrower" if the glossary says Friend).

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag decision conflicts

If your output contradicts an existing entry in `DECISIONS.md`, surface it explicitly rather than silently overriding:

> _Contradicts the 2026-10-19 decision (protect main with CI), but worth reopening because…_
