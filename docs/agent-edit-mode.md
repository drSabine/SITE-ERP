# Edit Mode

> For: bug fixes, features, UI, refactor.
> **Last updated:** [date]

Read [dev-traits/LEARN.md](dev-traits/LEARN.md) first.

---

## Decision tree

| Change type | Read |
|---|---|
| New CRUD feature | Migration → Model → Service → Controller → Route → Page (modal-first) |
| React modal, async, race | [notes/react-rules.md](notes/react-rules.md) + `resources/js/Hooks/` |
| Backend query / N+1 | [notes/backend-rules.md](notes/backend-rules.md) |
| Auth / policy | [dev-traits/SECURITY.md](dev-traits/SECURITY.md) + `app/Policies/` |
| Charts / analytics | Use Recharts. See `resources/js/Components/Charts/` |
| PDF generation | `app/Services/` + `resources/views/pdfs/` — inline CSS only |
| [Add domain-specific entries as the project grows] | |

---

## Before writing

1. **Trace the stack.** Route → Controller → Service → Model → Page → Components.
2. **Check if it already exists.** See [dev-traits/SKILLS.md](dev-traits/SKILLS.md) for the component/hook inventory.
3. **React built-ins first.** `useState`, `useEffect`, `useReducer`. Only extract a custom hook if the logic is reused by 2+ consumers.
4. **Update ALL affected files.** Changed a prop? Update every consumer. Changed a service signature? Update every caller.

## After writing

```bash
npm run build                    # required
php artisan optimize:clear       # if routes/config/services changed
```

Manual smoke: Inertia navigation works, no full page reloads, modals open/close cleanly, pagination preserves filters.
