# Debug Mode

> For: BROKEN, regressions, 500/blank/403, "revert that".
> **Last updated:** [date]

STOP. Diagnose before changing code.

---

## Protocol

1. **Read the error.**
   ```powershell
   Get-Content storage/logs/laravel.log -Tail 50
   npm run build
   php artisan route:list --name=keyword
   ```
2. **Identify the change.**
   ```powershell
   git diff HEAD~1
   git diff --stat
   ```
3. **State root cause** — symptom + actual broken line + fix — before editing.
4. **Check [dev-traits/LEARN.md](dev-traits/LEARN.md)** — has this pattern broken before?
5. **Fix + verify** per [agent-edit-mode.md](agent-edit-mode.md).

---

## Common causes

### Laravel
| Symptom | Cause |
|---|---|
| `Attempt to read property on null` | Missing `->with()` eager load |
| `403 Forbidden` | Policy returning false, or missing `$this->authorize()` |
| `404 Not Found` (unexpected) | Route renamed — `php artisan route:list` |
| `419 Page Expired` | CSRF token missing on non-Inertia POST |
| `422` | Validation failed |
| `500` | Check `storage/logs/laravel.log` |
| `Class not found` | `composer dump-autoload` |
| Stale data after Inertia submit | Controller returning JSON instead of `redirect()->back()` |

### React
| Symptom | Cause |
|---|---|
| Blank Inertia page | JS build error — `npm run build` |
| Modal flickers on close | State reset in `onClose` not `afterLeave` |
| Pagination loses filters | Missing `...filters` in router params |
| Race on search | `useCancellableAxios` missing debounce or `disabled` |
| Stale props after submit | Controller must `redirect()->back()` |
| Component not updating on entity change | Add `key={entity.id}` to force remount |
| Double submit | Missing `disabled={processing}` |

---

## Escalate to Planning Mode if

- Schema change needed
- Multiple services involved
- Bug reveals a design flaw
- Fix would violate a rule in [dev-traits/LEARN.md](dev-traits/LEARN.md)
