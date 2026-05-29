# AGENTS.md

> For all non-Claude AI models. Auto-loaded every session. Read in full before any action.
> See `CLAUDE.md` for the identical ruleset used by Claude models.

---

## 0. Session Start

1. Read `docs/dev-traits/LEARN.md` — past bugs and lessons learned. Check before writing any non-trivial logic.
2. Infer your mode from the task, then read the matching guide **before writing any code**:

| Task | Mode | Read |
|---|---|---|
| Bug fix, UI, CRUD, refactor | Edit | `docs/agent-edit-mode.md` |
| Architecture, new feature design, audits | Planning | `docs/agent-planning-mode.md` |
| Something broke, regression | Debug | `docs/agent-debug-mode.md` |

3. If the task touches a domain listed in §3, read that doc too.
4. Check §4 (Two-Team Architecture) — if the task touches a shared boundary, read both team sections before writing anything.

---

## 0.1 When Unsure — Ask Before Coding

**Default: ask, not assume.** Stop and ask if:

- Scope is ambiguous — two valid ways to implement it.
- Request could be destructive or hard to reverse.
- Missing context about a domain you haven't seen the doc for.
- User says "improve", "clean up", or "update" without specifying exactly what.

**How to ask:**
- 2–3 questions maximum per round. Never 6.
- Each question should have selectable options when the answer is a choice — use `vscode_askQuestions` with an `options` array.
- Phrase questions as decisions, not open-ended prompts. Bad: "What do you want?" Good: "Should this apply only to active terms or all terms?"
- Do NOT ask about things you can safely infer from existing code.

---

## 1. Hard Rules — Never Violate

### Backend
1. Lean controllers. Validate → Service → `Inertia::render()` or `redirect()`. Business logic in `app/Services/` only.
2. No N+1. Use `with()` / `whereIn()`. Slim every `with()` on index/paginated queries — use `select()` closures, ship only columns the frontend reads.
3. Always paginate (`->paginate(15)->withQueryString()`). No unpaginated `->get()` to the frontend.
4. Always `$request->validate([...])` first. Never pass `$request->all()` to `create/update`.
5. Use model scopes over raw queries. `::active()`, `::ordered()` etc. — never raw `where('is_active', true)` or raw `orderBy`. See §5 for the full scope inventory.
6. **Non-production migration rule:** Edit existing migration files directly and re-run `php artisan migrate:fresh --seed`. Only create a new migration file when the feature is complete and the schema change needs tracking. See `docs/notes/backend-rules.md` §Migrations.
7. PDFs (DOMPDF): inline CSS only, no Tailwind, no flexbox/grid.

### Frontend
8. Modal-first CRUD. No separate Create/Edit pages.
9. Reset modal state in `afterLeave`, never in `onClose`.
10. `useForm` for forms. Plain `axios` for one-shot loads. Cancel with native `AbortController` only when the same effect re-fires from a fast-changing input.
11. Inertia navigation only — never `window.location`.
12. No direct mutation. `array.map(...spread)`.
13. Update ALL affected files when changing imports, props, or consumers.
14. Icons from `Components/ui/Icons.jsx` — never import from `react-icons/*` directly.
15. **No abbreviated or single-letter variable names.** Use full descriptive words always:
    - `error` not `e` or `err`
    - `event` not `e` or `evt`
    - `response` not `res`
    - `request` not `req`
    - `query` not `q`
    - Use the full domain word in callbacks: `term` not `t`, `schoolYear` not `sy` in new code
    - Exception: `index` in `.map((item, index) =>)` and math/coordinate variables (`x`, `y`) are fine.

### Build
16. Run `npm run build` after every code change.
17. Run `php artisan optimize:clear` after route/config/service changes.

---

## 1.2 Anti-Overengineering Checklist

Before adding any of these, justify with a real reproducible bug — not a hypothetical:

- `useRef` "in-flight" / "transitioning" flags → `disabled={processing}` already covers double-clicks.
- `AbortController` in `useEffect` → only for effects that re-fire from fast-changing inputs. One-shot mount loads do not need it.
- `useMemo` around simple expressions → bookkeeping costs more than the work.
- New custom hook for a single consumer under ~50 lines → inline it.
- `try/catch` that silently swallows errors → either handle it or let it throw.

---

## 2. Stack

- **Framework:** Laravel 11 + Inertia.js + React 18 + Tailwind CSS v3
- **UI Libraries:** Headless UI, Recharts (charts), `Components/ui/Icons.jsx` (all icons)
- **Auth:** `users.role` column — [define roles here]
- **Schema hierarchy:** `school_years → academic_terms` (two levels only). `academic_terms` IS the semester. Current term = `AcademicTerm::active()->first()`.

---

## 2.1 Frontend Structure

```
resources/js/
  Pages/
    Admin/Feature/
      Index.jsx               ← thin: state + handlers + layout only (≤ 100 lines)
    Coordinator/Feature/ ...
    Teacher/Feature/ ...
  Components/
    ui/
      index.js                ← barrel: import { StatusBadge, ConfirmModal } from '@/Components/ui'
      StatusBadge.jsx
      ConfirmModal.jsx
      Icons.jsx
    Admin/
      SchoolYears/
        index.js              ← barrel: import { SchoolYearFormModal } from '@/Components/Admin/SchoolYears'
        SchoolYearFormModal.jsx
        TermsPanel.jsx
        utils.js              ← feature constants shared between page + extracted components
  hooks/                      ← shared custom hooks (2+ consumers only)
  utils/                      ← pure JS helpers, no React
  Layouts/
```

**Rules:**
1. Page files are thin orchestration only — state, handlers, layout render.
2. **Never create a `components/` folder inside `Pages/`.** No exceptions.
3. If a component is small enough to inline (< ~30 lines), keep it in the page file. Do not extract single-use small components.
4. If a component must be extracted (too large to inline), put it in `Components/<Role>/<Feature>/`, never inside `Pages/`.
5. Every extracted component folder gets an `index.js` barrel. Import via the barrel, never the individual file path.
6. `Components/ui/` = stateless display primitives. Always import via `import { X } from '@/Components/ui'`.
7. Promote to a new `Components/` subfolder only when 2+ distinct pages need the same component.
8. `hooks/` = shared custom hooks (2+ consumers). Never extract for a single consumer.
9. `utils/` = pure functions and constants. No React. `.js` extension.

---

## 3. Domain Map

> Read the matching doc **before** making changes in that area.

| Touching... | Read | What you'll find |
|---|---|---|
| Roles, auth, middleware, permissions | `docs/notes/domain-rules.md` §1 | Role definitions, gate rules |
| React state, `useEffect`, forms, modals | `docs/notes/react-rules.md` | Correct patterns, anti-patterns |
| Eloquent queries, controllers, services, PDFs | `docs/notes/backend-rules.md` | N+1 prevention, pagination, migrations |
| Any security concern, input handling | `docs/dev-traits/SECURITY.md` | OWASP rules, what to always validate |
| Reusable components or hooks already built | `docs/dev-traits/SKILLS.md` | Don't rebuild what already exists |
| What's planned but not yet built | `docs/plans/roadmap.md` | Avoid conflicts with planned work |
| BSIT course codes, pre-reqs, units | `docs/curriculum/bsit.md` | Full BSIT curriculum table |
| BSCE course codes, pre-reqs, units | `docs/curriculum/bsce.md` | Full BSCE curriculum table |

---

## 4. Two-Team Architecture

**Do not merge their domains without cross-checking.**

### Team Enrollments
Owns: `students`, `enrollments`, `enrollment_courses` (add/remove courses), `academic_terms` (activation).
Touches: `EnrollmentService`, `Coordinator/*Controller`, `StudentController`, `EnrollmentController`, `EnrollmentCourseController`, `Student`/`Enrollment`/`EnrollmentCourse` models.

### Team Grading Input
Owns: `enrollment_courses.final_grade`, `enrollment_courses.status`, `teacher_assignments`, grade finalization.
Touches: `GradeService`, `Teacher/GradeController`, `Admin/AcademicTermController::finalize`, `TeacherAssignment` model.

### Cross-Team Shared Files
| Shared file | Enrollment reads | Grading reads |
|---|---|---|
| `enrollment_courses` table | status, course_id, enrollment_id | final_grade, status |
| `EnrollmentCourse` model | `addCourse`, `removeCourse`, `scopeActive` | `inputGrade`, `overrideGrade` |
| `routes/web.php` | coordinator.* routes | teacher.* + admin.academic-terms.finalize |

**Rule:** If you edit a shared file, check impact on the OTHER team's code before committing.

---

## 5. Model Scope Inventory

> Use these. Never write raw `where('is_active', true)` or raw `orderBy`.

| Model | Scope | Replaces |
|---|---|---|
| `User` | `::active()` | `::where('is_active', true)` |
| `User` | `::teachers()` | `::where('role', 'teacher')` |
| `User` | `::coordinators()` | `::where('role', 'coordinator')` |
| `Program` | `::active()` | `::where('is_active', true)` |
| `Course` | `::active()` | `::where('is_active', true)` |
| `Course` | `::forSemester($year, $type)` | inline year_level + semester_type where |
| `SchoolYear` | `::active()` | `::where('is_active', true)` |
| `SchoolYear` | `::ordered()` | `::orderByDesc('start_date')` |
| `AcademicTerm` | `::active()` | `::where('is_active', true)` |
| `Student` | `::active()` | `::where('status', 'active')` |
| `Student` | `::ordered()` | `::orderBy('last_name')` |
| `Enrollment` | `::active()` | `::where('status', 'enrolled')` |
| `EnrollmentCourse` | `::active()` | `::where('status', 'active')` |
| `EnrollmentCourse` | `::passed()` | `::where('status', 'passed')` |
| `EnrollmentCourse` | `::withInc()` | `::where('status', 'inc')` |

---

## 6. Living Documentation — Update When You Learn Something

Only update docs when something actually happened — not on every routine task.

| What happened | Which doc | Section |
|---|---|---|
| Fixed a real bug caused by a pattern | `docs/dev-traits/LEARN.md` | §2 Past Bugs |
| Removed an over-engineered abstraction | `docs/dev-traits/LEARN.md` | §3 Over-engineering Caught |
| Non-obvious schema decision made | `docs/dev-traits/LEARN.md` | §4 Schema & Migration Notes |
| Architecture decision locked in | `docs/dev-traits/LEARN.md` | §1 Architecture Decisions |
| Built a reusable component or hook | `docs/dev-traits/SKILLS.md` | relevant section |
| Security gap noticed or new rule applied | `docs/dev-traits/SECURITY.md` | Rules list |

---

## 7. Session Report (REQUIRED — DO NOT SKIP)

> Every response that changes code or docs must end with this. Non-negotiable.

**CHANGES MADE**
  `[file path]`: [what changed] — [why]
  (list every file touched)

**LEFT UNCHANGED**
  [what] — [why not touched]

**CONFLICTS OR INACCURACIES FOUND**
  [doc/code claims X, but reality is Y] — or "None found."

**FUTURE DEV NOTES**
  [what the next developer or team needs to know]
  [cross-team impact if applicable]
