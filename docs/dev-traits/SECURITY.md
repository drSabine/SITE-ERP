# SECURITY.md

Read before touching auth, policies, validation, route middleware, or any user-input path.

## Rules

1. Every mutation route needs auth middleware and either a policy, gate, or explicit ownership/role check.
2. Do not authorize row-level actions by role alone. Verify the user can access that specific record.
3. Validate before writes with `$request->validate([...])`.
4. Never pass `$request->all()` into `create()` or `update()`.
5. Keep model `$fillable` explicit. Do not use `$guarded = []`.
6. Avoid IDOR bugs: scoped routes, policies, and ownership checks must match the domain rule.
7. Escape user-supplied values in Blade with `{{ }}`. Use `{!! !!}` only for explicitly trusted HTML.

## New Endpoint Checklist

- [ ] Route is behind `auth`.
- [ ] Route has the correct role middleware.
- [ ] Controller authorizes the action or checks ownership.
- [ ] Request uses `$request->validate([...])`.
- [ ] Write payload is built from validated data only.
- [ ] Index/detail queries expose only records the user may see.
- [ ] Inertia mutations redirect instead of returning ad hoc JSON unless the endpoint is intentionally API-only.
