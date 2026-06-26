# SKILLS.md - Component, Hook, And Utility Inventory

Update this file when adding reusable frontend building blocks. Check it before creating a new component, hook, or utility.

## Import Rules

- UI primitives: `import { X } from '@/Components/ui'`.
- Feature components: import from the feature barrel, for example `@/Components/Admin/Users`.
- Icons: use `Icons` from `@/Components/ui`; do not import icon libraries directly in pages.
- Utilities: use `resources/js/utils`.
- Components inside `resources/js/Components/ui` may use relative imports to avoid circular barrel imports.

Do not create one-line `.jsx` re-export shims. Export moved components from the nearest `index.js` barrel.

## UI Primitives

All primitives live in `resources/js/Components/ui/` and are exported by `resources/js/Components/ui/index.js`.

| Component | Purpose |
|---|---|
| `ActionsButton` | Small action trigger button |
| `ActionsDropdown` | Standard row action menu; supports default, primary, and danger variants |
| `ApplicationLogo` | App logo |
| `CardHeader` | Standard panel header |
| `Checkbox` | Styled checkbox |
| `ConfirmModal` | Confirmation modal |
| `DangerButton` | Destructive action button |
| `DataTable` | Standard table renderer with pagination, compact mode, and expandable rows |
| `DetailField` | Label/value display field |
| `Dropdown` | Headless UI dropdown wrapper |
| `Icons` | Central icon registry |
| `InputError` | Validation error text |
| `InputField` | Label, input, and error wrapper |
| `InputLabel` | Form label |
| `Modal` | Headless UI modal; pass `afterLeave` for cleanup |
| `PagePanel` | Square bordered page panel with `CardHeader` |
| `Pagination` | Laravel paginator links |
| `PrimaryButton` | Emerald primary action |
| `SearchBar` | Standard search input shell |
| `SecondaryButton` | Neutral action button |
| `SegmentedTabs` | Tab/filter bar |
| `StatusBadge` | Standard status indicator |
| `TextInput` | Styled text input |

## Required Reuse

- Tables use `DataTable`; do not repeat raw `<table>`, `<thead>`, `<th>`, and `<td>` markup manually.
- Status indicators use `StatusBadge`; do not hand-roll inline status spans.
- Table row actions use `ActionsDropdown`.
- Page-level bordered panels use `PagePanel`.
- Filter tabs use `SegmentedTabs`.
- Student number cells use `className: 'font-mono text-xs text-gray-500'`.

## StatusBadge Keys

`active`, `inactive`, `finalized`, `enrolled`, `passed`, `failed`, `dropped`, `inc`, `credited`, `not_enrolled`, `pending`, `verified`, `rejected`.

## Feature Component Barrels

| Area | Barrel |
|---|---|
| Admin school years | `resources/js/Components/Admin/SchoolYears/index.js` |
| Admin users | `resources/js/Components/Admin/Users/index.js` |
| Admin programs | `resources/js/Components/Admin/Programs/index.js` |
| Admin courses | `resources/js/Components/Admin/Courses/index.js` |
| Coordinator students | `resources/js/Components/Coordinator/Students/index.js` |
| Coordinator enrollments | `resources/js/Components/Coordinator/Enrollments/index.js` |
| Coordinator shared | `resources/js/Components/Coordinator/Shared/index.js` |
| Dashboard | `resources/js/Components/Dashboard/index.js` |
| Auth | `resources/js/Components/Auth/index.js` |

## Co-Located Page Hooks

Use co-located hooks for pages with enough state/handlers to bury the JSX. Keep them in the page folder and use `.jsx` when they may contain JSX in confirm messages.

| Hook | Page area |
|---|---|
| `Pages/Admin/SchoolYears/useSchoolYears.jsx` | Admin school years |
| `Pages/Admin/Users/useUsers.jsx` | Admin users |
| `Pages/Admin/Programs/usePrograms.jsx` | Admin programs |
| `Pages/Admin/Courses/useCourses.jsx` | Admin courses |
| `Pages/Coordinator/Students/useStudents.jsx` | Coordinator students |
| `Pages/Coordinator/Enrollments/useEnrollments.jsx` | Coordinator enrollments |

## Utilities

`resources/js/utils/format.js` owns shared formatting helpers such as `formatDate()` and `formatDateRange()`.

## Extraction Rule

Inline components under roughly 30 lines when they are single-use. Extract only when reuse, readability, or a clear feature boundary justifies it.
