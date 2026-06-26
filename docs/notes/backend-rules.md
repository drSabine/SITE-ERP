# Backend Rules

Laravel rules for controllers, services, queries, migrations, and PDF output.

## Controllers

- Validate first with `$request->validate([...])`.
- Authorize row-level actions with a policy, gate, or explicit ownership check.
- Call a service for business logic.
- Return `Inertia::render()` for pages or `redirect()->back()` / named redirects after mutations.
- Do not put business logic or multi-step writes in controllers.
- Do not pass `$request->all()` into `create()` or `update()`.

## Services

- Put non-trivial domain work in `app/Services/`.
- Keep one service per domain area where possible.
- Use transactions for multi-row writes that must succeed or fail together.
- Throw `ValidationException` for domain-rule failures that should show as form errors.
- Preserve the Enrollment/Grading boundary when touching `enrollment_courses`.

## Queries

- No N+1s. Eager-load relations needed by the frontend.
- On index queries, use relation `select()` closures and ship only columns the page reads.
- Paginate index views with `->paginate(10)->withQueryString()`.
- Use model scopes for common active/order filters.
- Do not return broad `get()` results to Inertia table pages.

```php
Model::query()
    ->with([
        'relation' => fn ($query) => $query->select('id', 'model_id', 'display_name'),
    ])
    ->paginate(10)
    ->withQueryString();
```

## Migrations

This project is not production. During iterative development, edit the existing migration when the feature is still in motion, then run:

```powershell
php artisan migrate:fresh --seed
```

Create a new migration only when the schema change must be tracked as a forward-only change.

Use Laravel `snake_case` names:

| Pattern | Example |
|---|---|
| `create_{table}` | `create_users` |
| `add_{column}_to_{table}` | `add_phone_to_users` |
| `drop_{column}_from_{table}` | `drop_avatar_from_users` |
| `rename_{table}` | `rename_orders_to_purchases` |

Do not add a redundant `_table` suffix.

## PDFs

- DOMPDF views use inline CSS only.
- Do not use Tailwind classes, flexbox, or CSS grid in PDF templates.
- Test the expected paper size before delivery.

## Required Verification

- `npm run build` after every change.
- `php artisan optimize:clear` after route, config, service-provider, or cache-sensitive changes.
- `php artisan migrate:fresh --seed` after schema changes in active development.
