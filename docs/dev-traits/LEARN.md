# LEARN.md — Institutional Memory

> Bugs caught, patterns learned, decisions made. Read every session.
> **Last updated:** 2026-05-29

---

## 1. Architecture Decisions

- **Modal-first CRUD** — no separate Create/Edit pages. All mutations happen in modals.
- **Services layer mandatory** — no business logic in controllers. Every non-trivial action lives in `app/Services/`.
- **Two-team split** — Team Enrollments owns student/enrollment data; Team Grading Input owns grade submission and finalization. Shared boundary: `enrollment_courses` table. See `CLAUDE.md §2.3`.
- **Flat grading model** — one `final_grade` per `enrollment_course` per semester. No Prelim/Midterm/Finals breakdown. Teachers submit one grade. Coordinator finalizes the term which locks statuses.
- **`academic_terms` is the semester wrapper** — `school_years → academic_terms (semester: first|second|summer)`. There is no separate semesters table. `AcademicTerm` is the semester unit.
- **Co-located state** — page component holds its own state and handlers inline. No split `useX.js` hook files unless logic is reused across 2+ pages.

---

## 2. Past Bugs & Lessons

> Add entries here whenever a non-obvious bug is fixed or a pattern causes repeated problems.

### Template

```
## [Short title]
- **Symptom:** what broke
- **Root cause:** why it broke
- **Fix:** what was done
- **Rule:** what to never do again
```

---

## 3. Over-engineering Caught

> Record hooks, guards, or abstractions that were added unnecessarily and later removed.

_(empty — add entries as they occur)_

---

## 4. Schema & Migration Notes

> Record any non-obvious schema decisions (e.g. why a column is nullable, why a relation is indirect).

_(empty — add entries as they occur)_
