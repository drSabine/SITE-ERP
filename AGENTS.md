# AGENTS.md

Read this first. This file is only the routing card; detailed rules live in `docs/`.

## Start Every Session

1. Read `docs/dev-traits/LEARN.md` before writing non-trivial logic.
2. Read the matching doc in the map below before touching that area.
3. If the change touches `enrollment_courses`, read both `docs/system-design.md` and `docs/notes/grade-flow.md` first.
4. When blocked, ask at most 2-3 specific questions. Otherwise make the smallest safe change and verify it.

## Project Snapshot

- Stack: Laravel 11, Inertia.js, React 18, Tailwind CSS v3, Headless UI, Recharts.
- Auth roles: `admin`, `coordinator_it`, `coordinator_engineering`, `teacher`, `student`.
- Academic hierarchy: `school_years -> academic_terms`; current term is `AcademicTerm::active()->first()`.
- Frontend entry shape: `Pages/<Role>/<Feature>/Index.jsx` orchestrates state, layout, handlers, and modal wiring.
- Shared UI imports come from `resources/js/Components/ui/index.js`.

## Non-Negotiables

- Controllers stay lean: validate, call a service, then `Inertia::render()` or redirect.
- Validate with `$request->validate([...])`; never pass `$request->all()` to writes.
- Prevent N+1s with eager loads and select only fields the frontend reads.
- Paginate index views with `->paginate(10)->withQueryString()`.
- Use model scopes for common state/order filters; do not repeat raw `is_active` and ordering clauses.
- CRUD is modal-first. Do not create separate Create/Edit pages.
- Reset modal forms in `afterLeave`, not `onClose`.
- Use Inertia navigation. Do not use `window.location`.
- Use `DataTable`, `StatusBadge`, `ActionsDropdown`, and icons from `Components/ui/Icons.jsx` instead of hand-rolled duplicates.
- Structural UI is square: no rounded cards, panels, modals, table wrappers, or structural buttons. Inputs may use `rounded`.
- Use the emerald SPUP/SITE design language. Do not reintroduce Breeze indigo/blue defaults.

## Read The Right Doc

| Touching | Read |
|---|---|
| Past bugs / project memory | `docs/dev-traits/LEARN.md` |
| Debugging broken behavior | `docs/DEBUG.md` |
| Roles, schema, core domain, two-team boundary | `docs/system-design.md` |
| Grading, INC, DROP, finalization, `enrollment_courses` status | `docs/notes/grade-flow.md` |
| Backend controllers, services, queries, migrations, PDFs | `docs/notes/backend-rules.md` |
| React state, forms, modals, Inertia behavior | `docs/notes/react-rules.md` |
| UI colors, layout, statuses, tables, copy | `docs/notes/design.md` |
| Reusable components, hooks, utilities | `docs/dev-traits/SKILLS.md` |
| Auth, policies, validation, user input | `docs/dev-traits/SECURITY.md` |
| UI/UX design role playbooks copied from BEU-AIS React | `docs/design/` |
| Curriculum seeders or curriculum data | `docs/curriculum/*.md` |
| Prerequisite / co-requisite work | `docs/plans/curriculum-prereq-plan.md` |

## Two-Team Boundary

- Enrollment owns `students`, `enrollments`, enrollment-course add/remove, and academic-term activation.
- Grading owns `teacher_assignments`, `enrollment_courses.final_grade`, status transitions, and finalization.
- `enrollment_courses` is shared. Any edit there must preserve both enrollment load management and grading status flow.

## Verification

- Run `npm run build` after every change.
- Run `php artisan optimize:clear` after route, config, service-provider, or cache-sensitive changes.
- For schema changes in this non-production app, edit the existing migration when appropriate and run `php artisan migrate:fresh --seed`.

## Required Session Report

End every work session with:

- **CHANGES MADE** - `[file]`: what changed and why.
- **LEFT UNCHANGED** - what stayed as-is and why.
- **CONFLICTS/INACCURACIES** - list issues found, or "None found".
- **FUTURE DEV NOTES** - next steps, risks, and cross-team impact.
