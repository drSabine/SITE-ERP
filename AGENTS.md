# Agent Index

> Master entry point for AI agents. Read this first, every session.
> **Last updated:** [date]

---

## Mode

Pick one and read its file:

| Task | Mode | Read |
|---|---|---|
| Bug, feature, UI, refactor | Edit | [agent-edit-mode.md](agent-edit-mode.md) |
| Architecture, audit, "how should X work?" | Planning | [agent-planning-mode.md](agent-planning-mode.md) |
| Broken, regression, revert | Debug | [agent-debug-mode.md](agent-debug-mode.md) |

Always also read [dev-traits/LEARN.md](dev-traits/LEARN.md) (institutional memory).

---

## Stack

- Laravel 11, Inertia.js, MySQL.
- React 18, Tailwind CSS v3, Headless UI.
- Recharts for data visualization. React Icons for iconography.
- Auth: `users.role` = [define roles — e.g. `admin | staff | user`].
- Deploy: [deployment target — fill in].

---

## Hard Rules (never violate)

### Backend
1. Lean controllers. Validate → Service → `Inertia::render()` or `redirect()`. Business logic only in `app/Services/`.
2. No N+1. Use `with()` / `whereIn()`. Eager-load before `paginate()`.
3. Always paginate (`->paginate(15)->withQueryString()`). No unpaginated `->get()` to the frontend.
4. Always `$request->validate([...])` first. Never pass `$request->all()` to `create/update`.
5. Use `Model::active()` / `Model::ordered()` scopes — never raw `where('is_active', true)` or raw `orderBy`.
6. New migration for every schema change. No squashing.
7. PDFs (DOMPDF): inline CSS only, no Tailwind, no flexbox/grid.

### Frontend
8. Modal-first CRUD. No separate Create/Edit pages.
9. Reset modal state in `afterLeave`, never in `onClose`.
10. `useForm` for forms. `axios` (plain) for one-shot loads. `useCancellableAxios` only when the same effect re-fires from a fast input.
11. Inertia navigation only — never `window.location`.
12. No direct mutation. `array.map(..., spread)`.
13. Update ALL affected files when changing imports/props/types.

### Build
14. Run `npm run build` after every code change.
15. Run `php artisan optimize:clear` after route/config/service changes.

---

## What React Already Solves (don't reinvent these)

| Problem | Answer |
|---|---|
| Modal open/close | `useState(false)` |
| Double-submit prevention | `disabled={processing}` via Inertia's `useForm` |
| Form state + server errors | Inertia's `useForm` |
| Cancel in-flight request | Native `AbortController` — `axios({ signal })` |
| Derived value | Just compute it inline — no `useMemo` |
| App-wide shared state | `useContext` + `useState`/`useReducer` |
| Custom hook | Only when 2+ consumers share the same logic |

See [dev-traits/LEARN.md](dev-traits/LEARN.md) for patterns that were added unnecessarily before.

---

## Domain Map

> Fill in as the project grows.

| Touching... | Read |
|---|---|
| Roles, auth, permissions | [notes/domain-rules.md](notes/domain-rules.md) §1 |
| React state, modals, async | [notes/react-rules.md](notes/react-rules.md) |
| N+1, pagination, PDFs, migrations | [notes/backend-rules.md](notes/backend-rules.md) |
| Authorization, validation | [dev-traits/SECURITY.md](dev-traits/SECURITY.md) |
| Component / hook inventory | [dev-traits/SKILLS.md](dev-traits/SKILLS.md) |
| Roadmap / not-yet-built | [plans/roadmap.md](plans/roadmap.md) |

---

## End-of-Session Report (required)


CHANGES MADE
  [file]: what changed — why

LEFT UNCHANGED
  [what] — why not

CONFLICTS FOUND
  doc/code claims X, reality is Y

FUTURE DEV NOTES
  implications for upcoming work
