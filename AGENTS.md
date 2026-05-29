# AGENTS.md
> Quick-reference card. Read before any action. See `CLAUDE.md` for Claude models.

## Session Start
1. Check `docs/dev-traits/LEARN.md` for past bugs before writing non-trivial logic.
2. If task touches a domain — read its doc (§ Domain Map below).
3. If task touches Enrollment or Grading shared boundary — check Two-Team section first.
4. When unsure: ask max 2–3 questions with choices, not open-ended prompts.

---

## Hard Rules

**Backend**
- Lean controllers: validate → service → `Inertia::render()` / `redirect()`
- No N+1: `with()` + `select()` closures; ship only columns the frontend reads
- Always paginate: `->paginate(10)->withQueryString()`
- Always validate first: `$request->validate([...])` — never `$request->all()`
- Use model scopes — never raw `where('is_active', true)` or raw `orderBy`
- Non-prod migrations: edit existing file + `migrate:fresh --seed`
- PDFs (DOMPDF): inline CSS only, no Tailwind, no flex/grid

**Frontend**
- Modal-first CRUD — no separate Create/Edit pages
- Reset form in `afterLeave`, not `onClose`
- `useForm` for forms; `axios` for one-shot data loads
- Inertia navigation only — never `window.location`
- Icons from `Components/ui/Icons.jsx` only
- No abbreviated variable names: `event` not `e`, `response` not `res`, `error` not `err`
- **No rounded edges** on structural elements (cards, modals, panels, tables). Square only. Inputs may use `rounded`.
- Emerald color scheme. NEVER indigo/blue. See `docs/notes/design.md`.
- DRY: use `DataTable` for all table views — never repeat `th/td` markup manually

**Build**: `npm run build` after every change. `php artisan optimize:clear` after route/config changes.

---

## Stack
Laravel 11 + Inertia.js + React 18 + Tailwind CSS v3. Headless UI, Recharts, `ui/Icons.jsx`.
Auth: `users.role` — `admin` | `coordinator` | `teacher` | `student`
Schema: `school_years → academic_terms`. Current term = `AcademicTerm::active()->first()`.

---

## Frontend Structure
```
Pages/<Role>/<Feature>/Index.jsx  ← thin orchestration only (state + handlers + layout)
Components/ui/index.js            ← ALL primitives barrel
Components/<Role>/<Feature>/index.js  ← barrel per feature
utils/format.js                   ← formatDate(), formatDateRange()
```
- Never create `components/` inside `Pages/`
- Components < ~30 lines → inline in page file
- Every extracted folder has `index.js` barrel

**ui/ exports:** ApplicationLogo, Checkbox, DangerButton, Dropdown, InputError, InputLabel,
Modal, NavLink, PrimaryButton, SecondaryButton, TextInput, StatusBadge, ConfirmModal, Icons,
InputField, DetailField, DataTable

**Admin component folders:** `SchoolYears/`, `Users/`, `Programs/`, `Courses/`
**Admin sidebar nav:** Dashboard, School Years, Users, Programs. Courses via Programs → Manage Courses.

---

## Domain Map

| Touching | Read |
|---|---|
| UI, colors, design | `docs/notes/design.md` |
| Roles, auth, middleware | `docs/notes/domain-rules.md` |
| React state, forms, modals | `docs/notes/react-rules.md` |
| Queries, controllers, services | `docs/notes/backend-rules.md` |
| Security, input handling | `docs/dev-traits/SECURITY.md` |
| Built components / hooks | `docs/dev-traits/SKILLS.md` |
| Planned features | `docs/plans/roadmap.md` |
| BSIT curriculum | `docs/curriculum/bsit.md` |
| BSCE curriculum | `docs/curriculum/bsce.md` |

---

## Two-Team Architecture

**Enrollment team** owns: `students`, `enrollments`, `enrollment_courses` (add/remove), `academic_terms` (activate).
**Grading team** owns: `enrollment_courses.final_grade/status`, `teacher_assignments`, finalization.
Shared file: `enrollment_courses` — editing it impacts both teams. Check both before committing.

---

## Model Scopes

| Model | Scopes |
|---|---|
| `User` | `::active()` `::teachers()` `::coordinators()` |
| `Program`, `Course`, `SchoolYear`, `AcademicTerm` | `::active()` |
| `SchoolYear` | `::ordered()` |
| `Course` | `::forSemester($year, $type)` |
| `Student` | `::active()` `::ordered()` |
| `Enrollment` | `::active()` |
| `EnrollmentCourse` | `::active()` `::passed()` `::withInc()` |

---

## Session Report (REQUIRED)

**CHANGES MADE** — `[file]`: what + why (every file touched)
**LEFT UNCHANGED** — what and why
**CONFLICTS/INACCURACIES** — or "None found"
**FUTURE DEV NOTES** — next steps, cross-team impact
