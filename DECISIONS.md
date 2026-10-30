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
