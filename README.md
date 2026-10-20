# Node.js Backend Interview Prep (8 weeks)

A self-contained study document for a frontend developer moving into Node.js backend roles:
a 56-day plan, detailed notes for 8 weeks, a 310-question bank, 86 coding exercises, and an
end-to-end Task Management API project (Express 5 + MySQL 8).

Notes are written in simple Hinglish with English technical terms. Interview answers are in
professional English.

## Read it online

GitHub Pages dashboard: https://sonuengineer.github.io/node-interview-prep/

Roadmap planner (hours/day and timeline to a day-wise plan, linked to these notes): https://sonuengineer.github.io/node-interview-prep/roadmap.html

It has a part and section sidebar, search across all parts, dark/light theme, and a
"Mark done" button per section. Progress is stored in your browser only.

## Contents (`content/`)

| File | What it is |
|------|-----------|
| 00_Master_Strategy_Schedule.md | Table of contents, strategy, full 56-day plan, spaced revision |
| 01 - 07 Week files | Weeks 1-7 notes, daily wrap-ups, weekly test with answers |
| 08_Week8_Revision_Mocks_Checklist.md | Week 8, mock interviews, readiness checklist |
| 09 / 10 Question_Bank_A / B | 310 interview questions in 10 categories |
| 11_Coding_Exercises.md | 86 exercises (problems first, solutions after) |
| 12_Project_Task_API.md | The end-to-end project, stage by stage |

## Run locally

```bash
node scripts/build.mjs   # copies content/ into docs/md and writes docs/parts.json
node server.js           # preview at http://localhost:4000
```

Needs Node 18 or newer. There are no npm dependencies; `marked` and `highlight.js` are
vendored in `docs/vendor/`.

## Editing

Edit the Markdown in `content/`, run `node scripts/build.mjs`, and commit both `content/`
and `docs/`. GitHub Pages serves the `docs/` folder from the `main` branch.

## Verification status

The Task API project (stages 1-7 and extensions A-C) and the Week 4 SQL were run against real
MySQL 8 and Redis, and the notes were corrected from the results. Most JavaScript and Node
examples were run on Node 20. Week 3, 5, 6 and 7 code samples, and Node 22 specific claims,
were not run. Check library versions against current docs before relying on them.
