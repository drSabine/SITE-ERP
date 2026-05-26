# backend-rules.md

> Laravel/PHP rules for this project.
> **Last updated:** [date]

---

## Queries

- No N+1. Every `->get()` or `->paginate()` must be preceded by the correct `with()` calls.
- Every `with('relation')` on a paginated/index query must use a `select()` closure — ship only what the frontend reads.
- Always `->paginate(15)->withQueryString()` on index queries. No bare `->get()` to the frontend.

## Controllers

- Validate first: `$request->validate([...])`.
- Call Service. Return `Inertia::render()` or `redirect()->back()`.
- No business logic. No direct Model queries beyond lookup.

## Services (`app/Services/`)

- All business logic lives here.
- One service per domain area (e.g. `UserService`, `ReportService`).

## Migrations

**This project is not production.** Prefer editing existing migration files and re-running:

```bash
php artisan migrate:fresh --seed
```

Only create a new migration file when you need to make a schema change that must be tracked (e.g. after a feature is considered "done" and tested). For all other iterative changes during development, just edit the existing file and re-run `migrate:fresh`.

### Naming Convention

Laravel uses `snake_case` — this IS the industry standard and it is readable. Each word is separated by `_` and reads naturally:

| Pattern | Example | Reads as |
|---|---|---|
| `create_{table}` | `create_users` | "create users" |
| `add_{col}_to_{table}` | `add_phone_to_users` | "add phone to users" |
| `drop_{col}_from_{table}` | `drop_avatar_from_users` | "drop avatar from users" |
| `rename_{table}` | `rename_orders_to_purchases` | "rename orders to purchases" |

**No `_table` suffix needed** — it's redundant. `create_users` is clearer than `create_users_table`.

Timestamp is auto-prefixed by Laravel (e.g. `2024_01_01_000000_create_users.php`). You only write the descriptive part.

## PDFs (DOMPDF)

- Inline CSS only — no Tailwind classes, no flexbox, no CSS grid.
- Test rendering at the expected paper size.

## Pagination

```php
// Required pattern
Model::with([
    'relation' => fn($q) => $q->select('id', 'fk_col', 'display_field'),
])
->paginate(15)
->withQueryString();
```
