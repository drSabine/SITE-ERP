# DEBUG.md

Use this for broken behavior, regressions, 500/403/404/419/422 errors, blank Inertia pages, failed builds, and "fix what broke" requests.

## Rule

Diagnose before editing. Name the symptom, root cause, broken line or file, and intended fix before changing code.

## Protocol

1. Reproduce the issue or read the exact error.
2. Inspect the most likely signal first:

```powershell
Get-Content storage/logs/laravel.log -Tail 80
npm run build
php artisan route:list --name=keyword
git diff --stat
git diff
```

3. Check `docs/dev-traits/LEARN.md` for known traps.
4. Read the relevant domain doc from `AGENTS.md`.
5. Make the smallest fix that addresses the root cause.
6. Verify the failing path plus the required build or Artisan command.

## Fast Diagnosis

| Symptom | First checks |
|---|---|
| 500 | Laravel log, service exceptions, undefined variables, DB errors, missing relation loads |
| 403 | route middleware, policy, ownership check, coordinator/admin role, teacher assignment scope |
| 404 | route name/path mismatch, model binding, scoped route binding, deleted/inactive record |
| 419 | CSRF/session mismatch, non-Inertia POST, stale form token |
| 422 | validation rules vs submitted payload, nested array names, missing IDs |
| Blank Inertia page | `npm run build`, import/export mismatch, missing page component, invalid prop shape |
| Stale props after submit | controller returned JSON instead of `redirect()->back()` |
| Modal flicker or stale fields | reset happened in `onClose` instead of `afterLeave`, missing edit modal `key` |
| Pagination loses filters | missing request query merge or `withQueryString()` |
| N+1 / slow index | missing `with()` or relation `select()` closure |
| Grade/status mismatch | read `docs/notes/grade-flow.md`; check `enrollment_courses.status` and `final_grade` together |
| Active term missing | check `AcademicTerm::active()->first()` and term activation state |

## Shared Boundary Check

Before editing `enrollment_courses`, `EnrollmentService`, `GradeService`, teacher assignments, finalization, or course drop/restore logic:

1. Read `docs/system-design.md`.
2. Read `docs/notes/grade-flow.md`.
3. Confirm whether the bug belongs to Enrollment, Grading, or the shared boundary.
4. Verify both sides after the fix.

## Verification Commands

```powershell
npm run build
php artisan optimize:clear
php artisan migrate:fresh --seed
```

- `npm run build` is required after every change.
- `php artisan optimize:clear` is required after route/config/cache-sensitive changes.
- `migrate:fresh --seed` is for schema changes in this non-production project.

Escalate to a short plan when the bug requires a schema change, crosses multiple services, or reveals a domain rule conflict.
