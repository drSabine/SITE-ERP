# Dev Progress — All Uncommitted Work Since Last Commit (`65bc96a`)

> Feed this file to the next dev session. Based on `git diff HEAD` + `git status`.

---

## 1. Database — Migrations & Seeders

### Migration change
- `2026_05_28_000009_create_enrollments_table.php`: added `year_level` column to `enrollments` table (snapshot of year at time of enrollment, used by `loadStandardCurriculum`)

### New seeders
- **`SchoolYearSeeder`** — creates S.Y. 2025-2026 with 2 terms: 1st Semester (inactive) + 2nd Semester (active)
- **`EnrollmentSeeder`** — enrolls all 32 students in the active 2nd Semester term with standard curriculum loaded
- **`DatabaseSeeder`** — now calls: `SchoolYearSeeder → UserSeeder → ProgramSeeder → CurriculumSeeder → EnrollmentSeeder`

### Seeder state after `php artisan migrate:fresh --seed`
- S.Y. 2025-2026: 1st Sem (inactive), 2nd Sem (active)
- 32 students total: 16 BSIT + 16 BSCE, 4 per year level (1st–4th)
  - BSIT: `2025-0001~0004` (1st), `2024-0001~0004` (2nd), `2023-0001~0004` (3rd), `2022-0001~0004` (4th)
  - BSCE: `2025-0101~0104` (1st), `2024-0101~0104` (2nd), `2023-0101~0104` (3rd), `2022-0101~0104` (4th)
- All 32 enrolled in 2nd Sem with curriculum loaded

---

## 2. Backend — Models

### `app/Models/Course.php`
- Added `coRequisites()` BelongsToMany — same `course_prerequisites` pivot table, `wherePivot('type', 'co_requisite')`
- Parallel to existing `prerequisites()` which filters `type=prerequisite`

### `app/Models/Enrollment.php`
- Minor fix: `year_level` now in fillable/used in `enroll()` call

---

## 3. Backend — Services

### `app/Services/EnrollmentService.php`

| Method | What it does |
|---|---|
| `enroll()` | Now takes `int $yearLevel` param — snapshots year onto enrollment record |
| `enrollForSchoolYear()` | **New** — bulk-enroll into all terms of a school year, skips already-enrolled, optional curriculum load |
| `detectYearLevelGap()` | **New** — checks if enrolling at `$targetYearLevel` skips a prior year level (warns coordinator) |
| `getStudentIncCourses()` | **New** — returns all outstanding INC enrollment_courses for a student |
| `loadStandardCurriculum()` | Fixed: now uses `$enrollment->year_level` (snapshot) not `$student->year_level`; removed strict unit cap throw (non-fatal) |
| `getUnmetPrerequisites()` | **New** — given an enrollment + course, returns array of unmet prereq strings; empty = all clear |
| `addCourse()` | Unchanged — still enforces 26-unit hard cap |

---

## 4. Backend — Controllers

### `app/Http/Controllers/Coordinator/StudentController.php`
- `index()`: paginate 20, sort `year_level ASC → last_name ASC → first_name ASC`, default `status=active`; passes `students`, `programs`, `activeSchoolYear`, `schoolYears`, `filters`
- `detail()` (**new route**): `GET /students/{student}/detail` — always JSON, returns student with enrollments + courses + programs + available courses for CourseManagerModal
- `show()`: Inertia render, also returns `availableCourses` for the same student

### `app/Http/Controllers/Coordinator/EnrollmentController.php`
- `index()` (**new**): `GET /enrollments` → Inertia `Coordinator/Enrollments/Index`. Filters by `term_id`, `program_id`, `year_level`, `status`. Passes `enrollments` (paginate 15), `schoolYears`, `programs`, `selectedTermId`, `filters`
- `store()`: now validates + uses `year_level` and `load_curriculum`; calls `service->enroll()` then optionally `loadStandardCurriculum()` (non-fatal)
- `storeForSchoolYear()` (**new**): `POST /enrollments/school-year` — bulk enroll into multiple terms; skips already-enrolled; validates `term_ids[]`, `year_level`, `load_curriculum`

### `app/Http/Controllers/Coordinator/EnrollmentCourseController.php`
- `store()`: added `force` boolean param. If `force=false` and unmet prereqs exist → `back()->withErrors(['prereq_warning' => '...'])`. Coordinator can override by resubmitting with `force=true`

### `app/Http/Controllers/Admin/CourseController.php`
- `index()`: now eager-loads `prerequisites` and `coRequisites` on each course
- `store()` + `update()`: added `prerequisite_ids[]`, `co_requisite_ids[]`, `force_units` to validation; 26-unit soft cap check with override; calls `syncCourseRelationships()` after save
- `syncCourseRelationships()` (**private**): deletes all existing rows from `course_prerequisites` for the course, then bulk-inserts the new prereq + co-req rows

---

## 5. Routes (`routes/web.php`)

New coordinator routes (within `coordinator.` prefix group):
```
GET  /students/{student}/detail     coordinator.students.detail
GET  /enrollments                   coordinator.enrollments.index
POST /enrollments/school-year       coordinator.enrollments.store-school-year
```

---

## 6. Frontend — New Coordinator Feature

### Layout (`resources/js/Layouts/AuthenticatedLayout.jsx`)
- Coordinator sidebar navigation added: Students, Enrollments links

### Pages

**`Pages/Coordinator/Students/Index.jsx`**
- PRIMARY tabs: All Years | 1st Year | 2nd Year | 3rd Year | 4th Year (via `SegmentedTabs`)
- Secondary filters: search + program select + status select (default Active)
- Table: student number, name, program, year level, enrollment badge (enrolled/not_enrolled), status
- Modals orchestrated: `StudentFormModal`, `StudentDrawer`, `EnrollmentModal`, `CourseManagerModal`
- `detail` route used to refresh drawer student data after actions

**`Pages/Coordinator/Enrollments/Index.jsx`**
- `SchoolYearTermPicker` to switch between terms
- Filters: program, year level, status
- Table: student number, name, program, year level, course count + INC count, status badge
- Paginated 15/page

### Components — `Components/Coordinator/Shared/`
| File | What it is |
|---|---|
| `FilterBar.jsx` | Flex row wrapper for filter controls (`border-b border-gray-100 px-6 py-3`) |
| `FilterSelect.jsx` | Standard `<select>` filter with consistent styling |
| `SelectField.jsx` | Label + select + error combo (like InputField but for selects) |
| `utils.js` | Constants + helpers: `YEAR_LEVELS`, `YEAR_TABS`, `YEAR_LABELS`, `SEMESTER_LABELS`, `STUDENT_STATUS_OPTIONS`, `ENROLLMENT_STATUS_OPTIONS`, `MAX_ENROLLMENT_UNITS` (26), `getSemesterLabel()`, `getYearLabel()`, `formatStudentName()`, `getActiveEnrollmentCourses()`, `countIncCourses()`, `ACTIVE_COURSE_STATUSES` |
| `index.js` | Barrel; `PagePanel` and `SegmentedTabs` re-exported from `@/Components/ui` |

### Components — `Components/Coordinator/Students/`
| File | What it does |
|---|---|
| `StudentFormModal.jsx` | Create/edit student — fields: student_number, name parts, sex, birthdate, contact, email, program, year_level, status |
| `StudentDrawer.jsx` | Slide-over: student profile + amber/green enrollment banner + "Edit Profile" button + grouped enrollment history. Each enrollment row has "Manage" → CourseManagerModal |
| `EnrollmentModal.jsx` | Enroll student into school year: picks `term_ids[]` + `year_level` + `load_curriculum` checkbox. Shows gap warning + INC warnings. POST to `coordinator.enrollments.store-school-year` |
| `CourseManagerModal.jsx` | Manage course load for one enrollment: shows `DataTable compact` of active courses + "Remove" per row + add-course dropdown + "Load Standard Curriculum" button. Prereq warning flow: amber panel + "Add Anyway / Cancel" |
| `StudentFilters.jsx` | `SearchBar` + program `FilterSelect` + status `FilterSelect` wrapped in `FilterBar` |

### Components — `Components/Coordinator/Enrollments/`
| File | What it does |
|---|---|
| `EnrollmentFilters.jsx` | Program + year level + status `FilterSelect` in `FilterBar` |
| `SchoolYearTermPicker.jsx` | School year accordion → term selector; navigates with `term_id` param |

---

## 7. UI Centralization (Admin + ui/)

### `ui/StatusBadge.jsx`
- `enrolled`: fixed blue → `bg-emerald-100 text-emerald-800` (NEVER blue rule)
- Added `not_enrolled`: `bg-amber-100 text-amber-700`, label "Not Enrolled"

### `ui/DataTable.jsx`
- Added `compact` prop (default false): `px-4 py-2.5` cells — use inside modals

### New `ui/` components
- **`ui/SegmentedTabs.jsx`** — props: `options [{value,label}]`, `value`, `onChange`, `grow`
- **`ui/PagePanel.jsx`** — props: `title`, `description`, `action`, `children`, `className`

### Admin pages refactored
- All 4 admin pages (`Users`, `SchoolYears`, `Programs`, `Courses`) now use `PagePanel` instead of raw `div+CardHeader`
- `Users/Index.jsx` also uses `SegmentedTabs` — replaced 20-line inline tab loop
- `SchoolYears/Index.jsx` — indentation on DataTable block fixed
- `CourseFormModal.jsx` — full rewrite: prereq/co-req checkbox table with mutual exclusion, semester unit total info bar, over-unit force flow, edit pre-population

### `Coordinator/Shared/index.js`
- `PagePanel` + `SegmentedTabs` re-exported directly from `@/Components/ui` — no shim files

---

## 8. Docs Updated

- **`docs/notes/design.md`**: StatusBadge variant table, DataTable usage section, `student_number` canonical class, danger action button class
- **`CLAUDE.md`**: all new ui/ exports, PagePanel/SegmentedTabs/DataTable compact documented, StatusBadge variants, reuse rules, anti-pattern rule (no 1-line shim .jsx files)

---

## Current `ui/` Barrel Exports
```
ApplicationLogo, Checkbox, DangerButton, Dropdown, InputError, InputLabel,
Modal, NavLink, PrimaryButton, ResponsiveNavLink, SecondaryButton, TextInput,
StatusBadge, ConfirmModal, Icons, InputField, DetailField,
DataTable, CardHeader, Pagination, SearchBar, SegmentedTabs, PagePanel, ActionsButton
```

**ActionsButton** — universal table row dropdown trigger. Square border + "Actions" label + ChevronDown icon, emerald hover. Always wrap in `<Dropdown><Dropdown.Trigger><ActionsButton /></Dropdown.Trigger>...</Dropdown>`. Applied to all 6 index pages.

---

## Pending / Next Steps
- **Grading feature** not started (teacher role — see `docs/plans/roadmap.md`)
- **Teacher pages** not yet created (course assignments, grade entry)
- **Student portal** pages not yet created
- `Admin/Users/UserFormModal.jsx`: read-only Display Name + Email use raw `<input>` — intentional (special bg-gray-50 styling), acceptable as-is
- `enrollments` table: consider adding index on `(student_id, academic_term_id)` for query performance
