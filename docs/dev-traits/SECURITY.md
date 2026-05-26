# SECURITY.md

> Read before touching auth, policies, validation, or any user-input path.
> **Last updated:** [date]

---

## Rules

1. Every route that mutates data must be behind auth middleware + a Policy or explicit ownership check.
2. Never authorize by role alone on row-level actions — check ownership (`$user->id === $record->user_id` or equivalent).
3. Always `$request->validate([...])` before creating or updating. Never `$request->all()`.
4. No IDOR — every controller action must verify the authenticated user owns or has permission for the resource.
5. Mass assignment protection — keep `$fillable` explicit on every model. Never use `$guarded = []`.
6. Never expose internal IDs in URLs where enumeration is a risk — use policies to guard access.
7. Sanitize all user-supplied values before rendering them in Blade views (use `{{ }}` not `{!! !!}` unless explicitly safe).

---

## New Endpoint Checklist

- [ ] Route has `auth` middleware
- [ ] Controller calls `$this->authorize()` or uses a Gate/Policy
- [ ] Request is validated via `$request->validate()`
- [ ] No `$request->all()` passed to `create()`/`update()`
- [ ] Ownership verified (not just role)
