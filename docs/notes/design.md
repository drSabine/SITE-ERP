# Design — SPUP SITE Department

> Read this before touching any color, font, layout, or copy.

---

## Colors

| Role | Tailwind | Use |
|---|---|---|
| Primary | `emerald-700` / `emerald-800` / `emerald-900` | Sidebar, buttons, active states |
| Accent | `yellow-400` | Section labels, dividers, highlights |
| Surface | `white` / `gray-50` | Page backgrounds, cards |
| Text | `gray-900` / `gray-500` | Headings / body copy |

**Never use indigo or blue.** Those are Breeze defaults — not SPUP.

---

## Typography

| Use | Font |
|---|---|
| University name only | `OldEnglish` — `style={{ fontFamily: "'OldEnglish', serif" }}` |
| Everything else | Figtree (default `font-sans`) |

`OldEnglish` is registered in `resources/css/app.css` via `@font-face` (file: `public/fonts/OldEnglish.ttf`).
Do **not** use it for any UI text other than the university name.

---

## Exact Copy Strings

| Where | Text |
|---|---|
| University name | **St. Paul University Philippines** |
| Department | **School of Information Technology and Engineering** |
| Footer | **Project created by BSIT-3B Major in Website Development. S.Y 2025-2026.** |

No "Portal", no "System", no "AIS" appended to the department name.

---

## Logos

| File | Use |
|---|---|
| `public/images/SPUP-final-logo.png` | Sidebar icon, login seal ring |
| `public/images/spup-site.png` | Available for larger display contexts |

---

## Login Page

- **Desktop:** Split. Left `lg:w-2/5` = `bg-emerald-900` branding panel (logo, OldEnglish title, dept name). Right = `bg-gray-50` form.
- **Mobile:** Stacked — compact branding header then form.
- **Dev quick-login panel:** `bg-amber-50 ring-amber-200`, 2×2 grid. Guard: `appEnv !== 'production'` (shared via `HandleInertiaRequests`).
- **Forgot password:** Advisory tip modal only — no email form. See `ForgotPasswordModal.jsx`.

---

## No Rounded Edges Rule

**Never** use `rounded-lg`, `rounded-xl`, `rounded-full`, or `rounded-md` on:
- Cards, panels, tables, modals → must be **square** (`border border-gray-200 shadow-sm`)
- Nav items, buttons on structural areas

Allowed exceptions:
- Form inputs / selects → `rounded` (4 px) for usability
- Status badge pill → `rounded` at most

---

## Sidebar

- Brand header: SPUP logo + "St. Paul University Philippines" (OldEnglish, 9.5px, white/80) + **SITE** (emerald-300, bold) + dept name (emerald-600, tiny tracking)
- No role badge — role is implicit from section titles
- Nav section labels: `yellow-400 opacity-70`, 10px, uppercase, tracking-widest
- Profile footer: `bg-emerald-950 border-t border-emerald-700` — name, email, Sign Out button (bordered, uppercase, tracking)

---

## Key Features (context for design decisions)

| Feature | What it looks like |
|---|---|
| **Enrollment** | Coordinator selects student + term, loads curriculum or adds courses manually. Paginated course list. Confirm before dropping. |
| **Grading Input** | Teacher selects assigned course, enters one final grade per student. Grade lock on term finalization. INC shown in red. |
| **School Years / Terms** | Table with expand row → TermsPanel. Activate/Finalize via confirm modals. Term activation preserves expand state. |
| **Users / Accounts** | Paginated 10/page, searchable. Dynamic form: admin/student shows fewer fields, teacher/coordinator shows academic profile fields. |

---

## Component Classes

| Element | Classes |
|---|---|
| Card / panel | `border border-gray-200 bg-white shadow-sm` |
| Table wrapper | `overflow-hidden border border-gray-200 bg-white shadow-sm` |
| Primary button | `bg-emerald-700 hover:bg-emerald-800 text-white` |
| Danger button | `bg-red-600 hover:bg-red-700 text-white` |
| Secondary button | `border border-gray-300 bg-white text-gray-700 hover:bg-gray-50` |
| Section label | `text-xs font-bold uppercase tracking-widest text-gray-400` |
| Sidebar section label | `text-[10px] font-semibold uppercase tracking-widest text-yellow-400 opacity-70` |
| Active nav item | `bg-emerald-700 text-white` |
| Inactive nav item | `text-emerald-100 hover:bg-emerald-800` |
| Table `th` | `px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500` |
| Table `td` action btn | `text-sm font-medium text-emerald-700 hover:text-emerald-900` |
| Table `td` danger btn | `text-sm font-medium text-red-500 hover:text-red-700` |
| `student_number` cell | `font-mono text-xs text-gray-500` — everywhere, no exceptions |

---

## StatusBadge Variants

| Status key | Color | Label | Use for |
|---|---|---|---|
| `active` | green | Active | Student / course / school year status |
| `inactive` | yellow | Inactive | Deactivated records |
| `enrolled` | **emerald** | Enrolled | Enrollment record status OR student enrolled in active S.Y. |
| `not_enrolled` | amber | Not Enrolled | Student has no enrollment in active S.Y. |
| `finalized` | gray | Finalized | Locked enrollment term |
| `passed` | green | Passed | Course grade outcome |
| `failed` | red | Failed | Course grade outcome |
| `dropped` | red | Dropped | Dropped course |
| `inc` | orange | INC | Incomplete grade |

**Rule:** NEVER use inline `<span>` for any status — always `<StatusBadge status="...">`. For enrollment column in tables: `<StatusBadge status={isEnrolled ? 'enrolled' : 'not_enrolled'} />`.

---

## DataTable Usage

- Default (page tables): `<DataTable columns={...} rows={...} />`
- Modal tables (compact): `<DataTable compact columns={...} rows={...} />` — uses `px-4 py-2.5` cells instead of `px-5 py-4`
- **Never write raw `<table><thead><th>` markup.** Always use `DataTable`.
