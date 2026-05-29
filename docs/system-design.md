# System Design — SITE Department AIS

> Reference for developers. Update when schema or behavior changes.
> **Stack:** Laravel 11 · Inertia.js · React 18 · Tailwind v3 · MySQL

---

## Roles

| Role | Who | What they can do |
|---|---|---|
| `admin` | Dean / Secretary | Create/manage School Years, Academic Terms. Finalize terms. Manage all users. Full visibility. |
| `coordinator` | Program Coordinator | Manage students, enrollments, course loads, teacher assignments. See INC deficiency list. |
| `teacher` | Faculty | Input grades for their assigned courses only. |

Route guards: `middleware('role:admin')`, `middleware('role:admin,coordinator')`, `middleware('role:teacher')`.

---

## Schema — Entity Hierarchy

```
users
  └─ staff_profiles (employee metadata)

programs (BSIT, BSCE)
  └─ courses (year_level + semester_type = reference only, not an enrollment gate)
       └─ course_prerequisites (soft-enforced at service layer, coordinator can override)

school_years  [e.g. "2025-2026"]
  └─ academic_terms  (first | second | summer)

students  (program_id, year_level = coordinator-maintained)
  └─ enrollments → academic_term  [unique: one enrollment per student per term]
       └─ enrollment_courses → course  [the student's load for that term]
            └─ final_grade  decimal(3,2) nullable  [one grade per course per semester, stored directly on this row]

teacher_assignments  (teacher_id → course_id → academic_term_id)  [unique: one teacher per course per term]
```

---

## Key Decisions

### 1. Enrollment is per academic_term (semester), not per school year
A student enrolls once per semester. Their course load (enrollment_courses) is built for that semester.
A student who skips summer simply has no enrollment row for the summer academic_term — nothing else changes.

### 2. Regular vs Irregular is not a stored label
There is no `is_regular` flag on students or enrollments. The distinction is only in how the coordinator *builds* the load:
- **Regular path:** Coordinator clicks "Load Standard Curriculum" → service auto-populates courses from the BSIT curriculum for `(program, year_level, semester)`.
- **Irregular path:** Coordinator manually adds courses one by one.
Both paths produce identical `enrollment_courses` rows. The DB has no opinion on which path was used.

### 3. Courses are reference data, not enrollment gates
`courses.year_level` and `courses.semester_type` come from the curriculum doc and are used by the
"Load Standard Curriculum" feature. They are not DB foreign key constraints. A coordinator can assign
any course to any student at any time.

### 4. 26-unit cap is a service-layer soft rule
`EnrollmentService::addCourse()` sums current active enrollment_course units and throws a `ValidationException`
if adding the new course would exceed 26. This can be overridden by simply bypassing the service (not exposed in UI).

### 5. Flat grading — one grade per course per semester
- Teacher inputs one final grade directly on `enrollment_courses.final_grade` for each student in their assigned course.
- **No periods.** No Prelim / Midterm / Finals breakdown. The `term_periods` and `grades` tables do not exist.
- **Valid grade values:** 1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00 (passing) · 5.00 (failed) · `null` = INC (shown red).
- Grade is held in `enrollment_courses.final_grade`. Status stays `active` until the term is finalized.
- **Finalize term** (admin action): locks all active rows — `null` → `inc`, ≤ 3.00 → `passed`, 5.00 → `failed`. Term `is_active` → false.
- Coordinator can override `final_grade` at any time (INC resolution or correction).

### 6. Dropping
- **Drop a course:** `EnrollmentCourse::status = 'dropped'`. Only coordinator does this.
- **Drop the whole semester:** `Enrollment::status = 'dropped'`, `dropped_at` timestamp set.
- **Transfer to another school:** `Student::status = 'transferred'`. Record is kept for history.

### 7. Summer is just another academic_term
`academic_terms.semester = 'summer'` — no special logic. Admin creates it optionally.
Students enroll if needed. Courses offered in summer are those with `courses.semester_type = 'summer'` in the curriculum
(reference only). Coordinator can add any course to a summer enrollment.

### 8. Graduation check (service layer only, no DB constraint)
```php
$required = Course::where('program_id', $student->program_id)->pluck('id');
$passed   = EnrollmentCourse::passed()->whereHas('enrollment', fn($q) => $q->where('student_id', $student->id))->pluck('course_id');
$missing  = $required->diff($passed);  // empty = eligible
```

---

## Feature → Controller Map

| Feature | Controller | Role |
|---|---|---|
| Manage School Years | `Admin\SchoolYearController` | admin |
| Manage Semesters (Academic Terms) | `Admin\AcademicTermController` | admin |
| Finalize Academic Term | `Admin\AcademicTermController` (finalize action) | admin |
| Manage Staff Accounts | `Admin\UserController` | admin |
| Manage Programs | `Admin\ProgramController` | admin |
| Manage Courses | `Admin\CourseController` | admin |
| Dashboard | `DashboardController` | all |
| Student list + profiles | `Coordinator\StudentController` | admin, coordinator |
| Enrollments + load management | `Coordinator\EnrollmentController` | admin, coordinator |
| Add/remove courses from load | `Coordinator\EnrollmentCourseController` | admin, coordinator |
| Teacher assignments | `Coordinator\TeacherAssignmentController` | admin, coordinator |
| Input grades | `Teacher\GradeController` | teacher |

---

## Service Layer

| Service | Responsibility |
|---|---|
| `SchoolYearService` | Create SY + default terms, activate/deactivate |
| `EnrollmentService` | Enroll student, load curriculum, add/remove courses, 26-unit cap |
| `GradeService` | Input/override `final_grade` on enrollment_course, finalize term (locks statuses) |

---

## INC / Deficiency

A student has an INC when `enrollment_courses.status = 'inc'` after term finalization.
The coordinator's deficiency view queries:
```sql
SELECT students.*, enrollment_courses.*, courses.*
FROM enrollment_courses
JOIN enrollments ON enrollments.id = enrollment_courses.enrollment_id
JOIN students ON students.id = enrollments.student_id
JOIN courses ON courses.id = enrollment_courses.course_id
WHERE enrollment_courses.status = 'inc'
ORDER BY students.last_name
```
Resolution: coordinator inputs the resolved grade, triggering a re-compute that updates `final_grade` and `status`.

---

## PDF Export (Enrollment Analytics)

Scope: enrollment counts per term, per program, per year level. No grade PDFs.
Controller: `Admin\ReportController` (build when needed — not yet implemented).

---

## What Is NOT Built Yet

- BSCE curriculum seeder
- PDF enrollment report
- Prerequisite soft-warning UI (table exists, seeder deferred)
- Student portal / self-service
