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
- **Co-located hooks** — each page that has significant state/handler logic has a `useX.jsx` hook file co-located in the same folder (e.g. `Pages/Admin/Users/useUsers.jsx`). The hook owns all state, effects, and handlers; `Index.jsx` owns only columns, JSX layout, and modal wiring. Hook files use `.jsx` extension because they may contain JSX in confirm-dialog messages.
- **Single unified Dashboard page** — `Pages/Dashboard.jsx` handles all roles. No separate `Admin/Dashboard`, `Teacher/Dashboard` etc. The controller passes `hasTeachingLoad` and role-specific stats. The page uses `build*Sections()` from `Components/Dashboard/dashboardSections.js` to assemble the card grid per role. Admin and coordinator can also carry a teaching load (they appear in `teacher_assignments`); when they do, the Teaching section appends automatically. To add a new role section: add a `buildXxxSections()` to `dashboardSections.js` and call it in `Dashboard.jsx`. Never create a new page for a role.

---

## 2. Past Bugs & Lessons

> Add entries here whenever a non-obvious bug is fixed or a pattern causes repeated problems.

## [Edit modal hydration can fail silently]
- **Symptom:** edit modals open with blank fields or stale data even when a record was selected.
- **Root cause:** the modal wrapper ignored `afterLeave`, and form hydration relied on brittle state replacement instead of an explicit full form payload on open.
- **Fix:** pass `afterLeave` through shared modal wrappers, hydrate edit forms with a complete payload in `useEffect`, and use a stable modal key when switching entities.
- **Rule:** every edit modal must hydrate from the selected record on open and reset in `afterLeave`; never assume a wrapper forwards transition callbacks unless verified.

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
