# SKILLS.md — Component & Hook Inventory

> What exists and where it lives. Update when adding reusable pieces.
> **Last updated:** 2026-05-29
>
> **Pre-coding checklist — read top to bottom before building anything new:**
> 1. Icons → `Components/ui/Icons.jsx` (never import `react-icons/*` directly)
> 2. UI primitives → `import { X } from '@/Components/ui'` (barrel — see table below)
> 3. Shared components → `import { X } from '@/Components/<Role>/<Feature>'` (barrel — see table below)
> 4. Shared hooks → `hooks/` table below
> 5. Shared utils → `utils/` (pure JS helpers)
> If what you need exists, use it. If it's close but not quite right, extend it here instead of duplicating.

---

## Shared Hooks (`resources/js/Hooks/`)

| Hook | File | Purpose |
|---|---|---|
| _(none yet)_ | | |

---

## UI Primitives (`resources/js/Components/ui/`)

> All primitive components live here. Every consumer uses the barrel.
> **Import via barrel:** `import { X, Y } from '@/Components/ui'`
> **Exception:** Components *inside* `ui/` that import siblings must use relative imports (`./Modal`) to avoid circular references.

| Component | Purpose |
|---|---|
| `ApplicationLogo` | SVG app logo (used in layouts) |
| `Checkbox` | Styled checkbox input |
| `DangerButton` | Red destructive action button |
| `Dropdown` | Headless UI dropdown wrapper |
| `InputError` | Displays a validation error string |
| `InputLabel` | Form field label |
| `Modal` | Headless UI dialog wrapper — use `afterLeave` to reset form state |
| `NavLink` | Inertia nav link with active state |
| `PrimaryButton` | Blue/dark submit / action button |
| `ResponsiveNavLink` | Mobile nav link with active state |
| `SecondaryButton` | Gray cancel / neutral button |
| `TextInput` | Styled text input |
| `StatusBadge` | `status` prop (`active`\|`inactive`\|`finalized`\|`enrolled`\|`passed`\|`failed`\|`dropped`\|`inc`) — colored pill |
| `ConfirmModal` | `show`, `title`, `message`, `confirmLabel`, `onConfirm`, `onClose` — generic danger confirm dialog |
| `Icons` | Central icon registry — re-exports all `react-icons` with semantic names. Never import from `react-icons/*` directly. |

---

## Charts (`resources/js/Components/Charts/`)

> Uses Recharts. Add entries as chart components are created.

| Component | Chart type | Data shape |
|---|---|---|
| _(none yet)_ | | |

---

## Dashboard Components (`resources/js/Components/Dashboard/`)

> Shared components and section builders for the unified dashboard.
> **Import via barrel:** `import { buildAdminSections, buildTeachingSections, ... } from '@/Components/Dashboard'`
> **Rule:** To add a new role's dashboard cards, add `buildXxxSections()` to `dashboardSections.js`. Never create a new Dashboard page for a role.

| Export | Type | Purpose |
|---|---|---|
| `buildAdminSections()` | Function | Card section descriptors for the admin role |
| `buildCoordinatorSections()` | Function | Card section descriptors for the coordinator role |
| `buildTeachingSections({ hasActiveTerm })` | Function | Teaching cards — used by teacher role AND admin/coordinator with a teaching load |
| `buildStudentSections()` | Function | Student academics cards |

`WelcomeHeader` and `ActionCard` are inlined inside `Pages/Dashboard.jsx` (both under 30 lines, single use).

---

## Auth Components (`resources/js/Components/Auth/`)

> Auth-flow components used on the login screen.
> **Import via barrel:** `import { X } from '@/Components/Auth'`

| Component | Props | Purpose |
|---|---|---|
| `ForgotPasswordModal` | `show`, `onClose` | Modal that requests a password reset link; shows confirmation on success |

---

## Feature Components (`resources/js/Components/Admin/`)

> Extracted page-specific components, organized by role and feature.
> **Import via barrel:** `import { X } from '@/Components/Admin/SchoolYears'`

| Component | Barrel | Purpose |
|---|---|---|
| `SchoolYearFormModal` | `Admin/SchoolYears` | Create / edit school year form modal |
| `TermsPanel` | `Admin/SchoolYears` | Expandable academic terms list for a school year row |

---

## Pages Inventory

| Page | Path | Notes |
|---|---|---|
| Admin: School Years | `Pages/Admin/SchoolYears/Index.jsx` | Thin (~100 lines). Extracted components in `Components/Admin/SchoolYears/`. UI primitives from `@/Components/ui`. |
