# Teacher Assignment — Redesign Research & Plan

> Research + information architecture for reworking the Admin "Teacher Assignment" screen.
> Implementation target: `Admin/Assignments/Index.jsx` + `App\Http\Controllers\Admin\AssignmentController`.
> Follows the role playbooks in `docs/design/` (researcher → architect → designer).

---

## 1. Problem (current state)

The page at `resources/js/Pages/Admin/Assignments/Index.jsx` renders **one flat, paginated
log of every teacher assignment** for the selected term. Each row is
`Section | Teacher | Subject | Units` with a single "Remove" action.

Pain points observed in code and use:

- **No firm structure.** It is an append-only ledger. To answer "what does *this section*
  have?" or "what is *this teacher's* load?" the user must scan/scroll the whole list.
- **Weak scoping affordances.** S.Y. + term context exists at the top, but within a term
  there is no grouping — a section's subjects are scattered among other sections' rows.
- **No teacher-centric view.** Teaching load is additive (admins/coordinators can teach too,
  per `docs/system-design.md`), so "show me everything Teacher X teaches this term" is a
  first-class question the UI cannot answer.
- **Mixed concerns in one table.** Creating an assignment and auditing assignments share the
  same undifferentiated space.

## 2. Research questions

1. What is the primary task? → *Assign a subject to a teacher for a section in a term*, and
   *audit/verify coverage* (every section subject has a teacher; no teacher is overloaded).
2. What is the natural unit of organization? → **Section** (a section's subject list is the
   curriculum block) and **Teacher** (a person's load). Both are needed.
3. What scoping is always true? → A single **academic term** within a **school year**.

## 3. Personas & key tasks (evidence: domain model + roles in `docs/system-design.md`)

| Persona | Goal | Today's friction |
|---|---|---|
| Dean/Admin | Confirm every section is fully staffed for the term | Must eyeball a flat list |
| Coordinator (teaching) | See their own + peers' loads | No teacher view |
| Scheduler | Avoid double-booking / overload a teacher | No per-teacher unit total |

## 4. Proposed information architecture

Keep the existing **S.Y. + term context bar** (already implemented and working). Add a
`SegmentedTabs` view switch with two modes:

### View A — **By Section** (default)
- Group assignments by **Section** (ordered by program → year level → name), under the
  selected term.
- Each section is a square panel: header = `Section name · Program · Year`, body = a
  `DataTable` of `Subject | Teacher | Units` with a direct Remove (icon) action.
- Panel footer shows **assigned units total** and (future) coverage hint vs. the section's
  curriculum subjects for that term.

### View B — **By Teacher**
- A teacher search/select (reuse the active-teachers list already passed as `teachers`).
- On select, show that teacher's **full load for the term**: a `DataTable` of
  `Section | Subject | Units`, plus a **total units** summary tile.
- Empty state when a teacher has no load for the term.

### Assign form
- Keep the existing inline assign form (Section → Teacher → Subject) — it already filters
  subjects to the section's program/year/semester and validates server-side. Present it as a
  distinct panel above the views (not interleaved with the audit list).

## 5. Data / query shape (controller)

`AssignmentController@index` already eager-loads `teacher.userProfile`, `course`,
`section.program`. Changes:

- **By Section**: return assignments ordered by `section.program_id`, `section.year_level`,
  `section.name`, then group client-side (or pre-group server-side into
  `sections -> [assignments]`). Pagination becomes per-page of *sections* rather than rows,
  or drop pagination in favor of term-scoped grouping (assignment counts per term are small).
- **By Teacher**: add an optional `teacher_id` query param; when present, return that
  teacher's assignments for the term plus a units sum. Keep the `teachers` list for the picker.
- Preserve existing store validation: `SectionAssignmentService::validateCourseFitsSection`,
  semester-match guard, and the duplicate `(course, section, term)` guard.

## 6. Reuse (no new primitives)

- `SegmentedTabs`, `DataTable`, `ActionsDropdown`/direct icon button, `PagePanel`,
  `StatusBadge`, `Icons` (`TrashIcon`, `SearchIcon`).
- `getSemesterLabel`, `getYearLabel`, `buildTeacherName` (already local in the page).

## 7. Rollout

1. Controller: add grouping + optional `teacher_id` scope; keep the assign + destroy actions.
2. Page: add `SegmentedTabs` (By Section / By Teacher); render grouped panels / teacher load.
3. Replace single-action dropdown with a direct Remove icon button.
4. Verify: `npm run build`, `php artisan optimize:clear`; smoke as admin via dev login.

## 8. Success metrics

- "What does section X have?" answerable without scrolling (grouped panel).
- "What is teacher Y's load + total units?" answerable in ≤ 2 interactions.
- No regression in assign/remove flows or server-side validation.
