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
| Footer | **Project created by BSIT-3B Major in Website Development as a requirement for ITE 125. S.Y 2025-2026.** |

No "Portal", no "System", no "AIS" appended to the department name.

---

## Logos

| File | Use |
|---|---|
| `public/images/SPUP-final-logo.png` | Sidebar icon, login seal ring |
| `public/images/spup-site.png` | Available for larger display contexts |

**Don't over-repeat the seal.** One hero/branding placement per page is enough — don't also stamp it in a nav bar and a footer on the same page. Use text (university/department name) for secondary brand mentions instead of another logo image.

---

## Login Page

- **Layout:** Single centered card over a full-bleed campus photo (`spup-bg-landing-page.jpg`) + `bg-emerald-950/80` overlay — the *same scene as the landing hero* so the Sign In → Login transition reads as zooming into one place, not navigating away. No dual-panel split. Same on mobile and desktop (card just gets more padding room on larger screens).
- **Card:** square white card (`border bg-white shadow-2xl`), seal at top, `SITE · Account Access` eyebrow, "Welcome back" heading, then the form. Credit line sits on the photo *below* the card in `text-white/70`.
- **"Back to Site":** link to `/` pinned top-left over the photo.
- **Motion (flow from landing):** one shared `rise` keyframe (fade + 10px lift, `cubic-bezier(0.16,1,0.3,1)`) — the card rises in, inner items stagger via `.login-stagger`. Same `rise` is used on the landing hero, so the two pages share one calm motion language (no ken-burns zoom, no spring/scale). All reset under `prefers-reduced-motion`.
- **Dev quick-login:** collapsible floating panel pinned bottom-right (`DevLoginPanel`), **not** inside the credentials card. Toggle pill in amber; expands to a list of role buttons that fill the form. Guard: `appEnv !== 'production'`.
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

## Authenticated Shell Watermark

`AuthenticatedLayout` renders a persistent authorship footer below `<main>` on every signed-in page (`DEV_CREDIT`): "Developed by BSIT-3B Major in Website Development, a requirement for ITE 125. S.Y 2025-2026." Styled subtly (`text-[11px] text-gray-400`, centered) and `print:hidden` so it never bleeds into printed grade sheets / PDFs.

---

## PDF Export / Printable Reports

PDF export is **print-to-PDF via the browser** (`window.print()`), not a server PDF library — the app chrome (sidebar/header/footer) is already `print:hidden` in `AuthenticatedLayout`. Shared shell: `Components/Reports/ReportDocument.jsx` (`ReportDocument`, `ReportStats`, `ReportSection`, `ReportTable`) — branded masthead (SPUP logo + OldEnglish name + dept), emerald table headers, A4 `@media print` rules, and a "Save as PDF" toolbar that is `print:hidden`. Pass `autoPrint` to open the print dialog on load.

Reports are **admin-only** (`admin.reports.*` routes, `Admin\ReportController`):
- **Institutional Analytics** (`Pages/Admin/Reports/Analytics.jsx`) — total/enrolled students, current S.Y., evaluation trend, evaluation outcome, program population, graduates. Entry: "Export PDF" by the admin dashboard Analytics heading.
- **Board Exam Passers** (`Pages/Admin/Reports/BoardExams.jsx`) — summary, per-intake trend, detailed records. Entry: "Export PDF" on the Board Exam Passers page (rendered only when `role === 'admin'`, even though the page itself is shared with the engineering coordinator).

Charts are rendered as tables in reports (Recharts SVG doesn't paginate reliably on print).

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
