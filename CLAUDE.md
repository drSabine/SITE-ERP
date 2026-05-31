# CLAUDE.md
> Quick-reference card. Read before any action. See `AGENTS.md` for non-Claude models.

## Session Start
1. Check `docs/dev-traits/LEARN.md` for past bugs before writing non-trivial logic.
2. If task touches a domain — read its doc (§3 Domain Map).
3. If task touches Enrollment or Grading shared boundary — read §4 first.
4. When unsure: ask max 2–3 questions with choices, not open-ended prompts.

---

## Hard Rules

**Backend**
- Lean controllers: validate → service → `Inertia::render()` / `redirect()`
- No N+1: `with()` + `select()` closures; ship only columns the frontend reads
- Always paginate: `->paginate(10)->withQueryString()`
- Always validate first: `$request->validate([...])` — never `$request->all()`
- Use model scopes (§5) — never raw `where('is_active', true)` or raw `orderBy`
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
- **Never create 1-line `.jsx` re-export shim files.** When a component moves to `ui/`, update the barrel `index.js` to re-export it directly: `export { X } from '@/Components/ui'` — no intermediate file needed.

**ui/ exports:** ApplicationLogo, Checkbox, DangerButton, Dropdown, InputError, InputLabel,
Modal, NavLink, PrimaryButton, SecondaryButton, TextInput, StatusBadge, ConfirmModal, Icons,
InputField, DetailField, DataTable, CardHeader, Pagination, SearchBar, SegmentedTabs, PagePanel

**PagePanel** — standard page card wrapper: `<PagePanel title description action className>children</PagePanel>`. Replaces raw `<div className="border border-gray-200 bg-white shadow-sm"><CardHeader .../></div>`. Supports optional `className` for extra classes (e.g. `mb-6`).

**SegmentedTabs** — tab-filter bar: `<SegmentedTabs options={[{value,label}]} value onChange grow />`. Replaces inline tab-button loops. Used by admin (Users) and coordinator (Students) pages.

**DataTable props:** `compact` (bool, default false) — use inside modals for tighter padding (px-4 py-2.5 cells). Standard page tables use default.

**StatusBadge variants:** `active` `inactive` `enrolled` `not_enrolled` `finalized` `passed` `failed` `dropped` `inc`
- `enrolled` = emerald (enrollment record status OR "student is enrolled in active S.Y.")
- `not_enrolled` = amber ("student has no enrollment in active S.Y.")
- NEVER use inline `<span>` for status/enrollment state — always use `<StatusBadge>`

**Reuse rules:**
- ALL tables → `DataTable` (never raw `<table><thead><th>...</th>` markup)
- ALL status/enrollment indicators → `StatusBadge`
- ALL action buttons in table rows → raw `className="text-sm font-medium text-emerald-700 hover:text-emerald-900"` (this is the standard)
- Danger row actions → `className="text-sm font-medium text-red-500 hover:text-red-700"`
- `student_number` column standard → `className: 'font-mono text-xs text-gray-500'` everywhere

**Admin component folders:** `SchoolYears/`, `Users/`, `Programs/`, `Courses/`
**Coordinator component folders:** `Students/`, `Enrollments/`, `Shared/`
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
