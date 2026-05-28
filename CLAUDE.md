# CLAUDE.md

> Auto-loaded every session. Read in full before any action.

---

## 0. Session Start

1. Read `AGENTS.md` — master index with stack rules, hard constraints, doc paths.
2. Read `docs/dev-traits/LEARN.md` — past bugs and lessons learned. Check this before writing any non-trivial logic.
3. Infer your mode from the task, then read the matching guide **before writing any code**:

| Task feels like... | Read |
|---|---|
| Architecture, new feature design, audits | `docs/agent-planning-mode.md` |
| Bug fix, UI change, adding a field, CRUD | `docs/agent-edit-mode.md` |
| Something broke, regression, unexpected behavior | `docs/agent-debug-mode.md` |

4. If the task touches a domain listed in §3 below, read that doc too.

---

## 1. Hard Rules — Never Violate

1. No separate CRUD pages — modal-first.
2. No business logic in controllers — `app/Services/` only.
3. Data fetching: plain `axios.get()` + `useState` in `useEffect`. For search/filter inputs that re-fire quickly, cancel the previous request using the native `AbortController` (`signal:` option on axios). No custom fetch wrapper hooks.
4. No N+1 queries — `with()` or `whereIn()`.
5. **Non-production migration rule** — edit existing migration files directly and re-run `php artisan migrate:fresh --seed`. Only create a new migration file when a feature is done and the schema change needs to be tracked. See `docs/notes/backend-rules.md` §Migrations.
6. Run `npm run build` after every code change.
7. Run `php artisan optimize:clear` after route, config, or service changes.
8. **Update ALL affected files** — when a change impacts imports, props, or consumers, fix them all.
9. **Use model scopes over raw queries.** Prefer `::active()`, `::ordered()`, etc. over inline `where()` / `orderBy()`.
10. **KISS — Keep It Short and Simple.** React built-ins first: `useState`, `useEffect`, `useReducer`. Extract a custom hook only when logic is reused across 2+ components or the component file becomes unreadable. Never build a custom abstraction for something React already solves.
11. **Slim every `with()` on index/paginated queries.** Every `with('relation')` must use a `select()` closure. Ship only the columns the frontend reads.
12. No Tailwind in Blade PDFs — inline CSS only (DOMPDF CSS 2.1).

### 1.1 Model Scope Inventory

> Fill this in as scopes are added to models.

| Model | Scope | Replaces |
|---|---|---|
| `User` | `::active()` | `::where('is_active', true)` |
| _(add more as built)_ | | |

### 1.2 Anti-Overengineering Checklist

Before adding any of these, justify it with a real reproducible bug (not a hypothetical):

- `useRef` flag for "in-flight" / "transitioning" / "already submitted" → the disabled button + `processing` state already covers double-clicks.
- `AbortController` in `useEffect` → only needed when the effect re-fires from a fast-changing input. One-shot mount loads do not need it.
- `useMemo` around object destructure or `a + b` → bookkeeping costs more than the work.
- New custom hook for a single consumer under ~50 lines → inline it.
- `try/catch` that swallows the error silently → either handle it or let it throw.

---

## 2. Project

- **App:** [Project name — fill in]
- **Stack:** Laravel 11 + Inertia.js + React 18 + Tailwind CSS v3
- **Auth:** `role` column on `users` — [define roles here, e.g. `admin`, `staff`, `user`]
- **UI:** [Brand guidelines — fill in]

---

## 2.1 Frontend Architecture

Files live under `Pages/<Role>/<Feature>/`. Shared sub-components live under `Components/`.

```
Pages/Admin/[Feature]/
  Index.jsx          ← component with its own state and handlers inline
  [Feature]Modal.jsx ← create/edit modal, state inline

Components/        ← promoted here only when used by 2+ pages
```

### Rules

1. **Logic lives in the component** unless it's reused elsewhere OR the file is hard to read. Don't split a component into a `.jsx` + `useComponent.js` pair by default — that's premature.
2. **Extract a custom hook only when:** logic is shared across 2+ consumers, OR the non-JSX logic in a single file exceeds ~80 lines and makes the JSX hard to find.
3. **React built-ins cover most cases.** `useState` for local state. `useEffect` for side effects. `useReducer` for forms with many fields. `useContext` for app-wide state (auth, theme). Don't reach for a custom abstraction first.
4. **File extension:** `.jsx` for components. `.js` for pure logic utilities.
5. **Import directly.** No barrel `index.js` files unless a folder exports 5+ things that are always imported together.

### 2.2 What React Already Solves

| Problem | Built-in solution |
|---|---|
| Modal open/close state | `const [open, setOpen] = useState(false)` |
| Prevent double-submit | `disabled={processing}` + Inertia's `useForm` `processing` flag |
| Form state + validation errors | Inertia's `useForm` |
| One-shot data load on mount | `useEffect(() => { axios.get(...).then(setData) }, [])` |
| Cancel in-flight request (search input) | Native `AbortController` — `axios({ signal: controller.signal })` |
| Derived value | `const total = a + b` — no `useMemo` |
| Silent error suppression | Don't. Surface it or let it throw. |

---

## 3. Domain Map

> Read the matching doc **before** making changes in that area.

| Touching... | Read | What you'll find |
|---|---|---|
| Roles, auth, middleware, permissions | `docs/notes/domain-rules.md` §1 | Role definitions, gate rules, who can do what |
| React state, `useEffect`, forms, modals, hooks | `docs/notes/react-rules.md` | Correct patterns, what NOT to reach for |
| Eloquent queries, controllers, services, PDFs | `docs/notes/backend-rules.md` | N+1 prevention, pagination pattern, migration rules |
| Migrations specifically | `docs/notes/backend-rules.md` §Migrations | Non-prod editing strategy, naming conventions |
| Any security concern, input handling, auth bypass | `docs/dev-traits/SECURITY.md` | OWASP rules, what to always validate |
| Reusable components or hooks already built | `docs/dev-traits/SKILLS.md` | Don't rebuild what already exists |
| What's planned but not yet built | `docs/plans/roadmap.md` | Avoid building something that conflicts with planned work |
| BSIT course codes, pre-reqs, units | `docs/curriculum/bsit.md` | Full BSIT curriculum table |
| BSCE course codes, pre-reqs, units | `docs/curriculum/bsce.md` | Full BSCE curriculum table |

---

## 4. After Every Task — Session Report (Required)

CHANGES MADE
  For each file changed: what changed and WHY.

LEFT UNCHANGED
  What you decided not to touch and why.

CONFLICTS OR INACCURACIES FOUND
  Anything wrong in codebase or docs, even if out of scope.

FUTURE DEV NOTES
  How changes affect upcoming features. Areas to watch.

