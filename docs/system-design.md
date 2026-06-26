# System Design - SITE AIS

Canonical architecture and domain reference for the Laravel/Inertia academic information system.

## Stack

- Laravel 11, MySQL, Inertia.js, React 18, Tailwind CSS v3.
- Auth is stored on `users.role`.
- Current term lookup: `AcademicTerm::active()->first()`.

## Roles And Access

| Role key | Meaning | Main access |
|---|---|---|
| `admin` | Dean / secretary / system admin | Admin modules, coordinator modules, teacher grading, documents, finalization |
| `coordinator_it` | IT program coordinator | Coordinator modules scoped to BSIT, BSCpE, BLIS; teacher grading when assigned |
| `coordinator_engineering` | Engineering program coordinator | Coordinator modules scoped to BSCE, BSENSE; teacher grading when assigned |
| `teacher` | Faculty | Assigned grade sheets and document submission |
| `student` | Student account | Dashboard / portal-facing access as implemented |

Route groups:

- `/admin/*`: `role:admin`
- `/coordinator/*`: `role:admin,coordinator_it,coordinator_engineering`
- `/teacher/*`: `role:admin,coordinator_it,coordinator_engineering,teacher`
- `/documents/*`: staff roles; verification is admin-only

Teaching load is additive. Admins and coordinators may still appear in `teacher_assignments` and see teaching actions.

## Entity Map

```text
users
  user_profiles

programs
  courses
    course_prerequisites

school_years
  academic_terms
    sections

students
  enrollments
    enrollment_courses

teacher_assignments

submission_categories
  documents
    uploaded_files
    verification_records
```

## Academic Model

- `school_years` contain `academic_terms`.
- Students enroll into academic terms through `enrollments`.
- Course load lives in `enrollment_courses`.
- Sections are term/year/program placement records and are assigned by coordinators.
- Courses are curriculum reference data; coordinators can still add allowed irregular loads through services.
- A student has no stored `is_regular` flag. Regular/irregular is inferred from how the load was built.

## Enrollment And Grading Boundary

Enrollment owns:

- `students`
- `enrollments`
- adding, crediting, dropping, restoring enrollment-course load rows
- section assignment
- academic-term activation context

Grading owns:

- `teacher_assignments`
- `enrollment_courses.final_grade`
- `enrollment_courses.status`
- grade submission, INC/DROP marking, override, and finalization

Shared table: `enrollment_courses`. Read `docs/notes/grade-flow.md` before changing its status or grade behavior.

## Grade Model

- One grade per student/course/term lives on `enrollment_courses.final_grade`.
- Valid numeric grades are passing scale values `1.00` through `3.00`, and `5.00` for failed.
- `null` means no numeric grade submitted; status determines whether that is pending, INC, dropped, or final.
- Finalization converts active rows into `passed`, `failed`, or `inc`.
- Coordinator override can resolve or correct grades outside the normal teacher flow.

## Current Feature Map

| Area | Pages / controllers |
|---|---|
| Dashboard | `DashboardController`, `resources/js/Pages/Dashboard.jsx` |
| Admin school years and terms | `Admin/SchoolYearController`, `Admin/AcademicTermController` |
| Admin users | `Admin/UserController` |
| Admin programs and courses | `Admin/ProgramController`, `Admin/CourseController` |
| Admin assignments | `Admin/AssignmentController` |
| Admin/coordinator grading monitor | `Admin/GradingMonitorController`, `Coordinator/GradingMonitorController` |
| Activity logs | `Admin/ActivityLogController` |
| Coordinator students | `Coordinator/StudentController` |
| Coordinator enrollments and course loads | `Coordinator/EnrollmentController`, `Coordinator/EnrollmentCourseController` |
| Coordinator sections | `Coordinator/SectionController` |
| Teacher grades | `Teacher/GradeController` |
| Documents | `Documents/DocumentController`, `Documents/VerificationController` |

## Services

| Service | Responsibility |
|---|---|
| `ActivityLogService` | activity logging |
| `DashboardAnalyticsService` | dashboard counts and trends |
| `DocumentService` | document upload/version/verification behavior |
| `EnrollmentService` | enrollment creation, curriculum loading, load changes |
| `GradeService` | teacher grade input, status changes, finalization/override support |
| `GradingMonitorService` | grading progress and student rows for monitors |
| `SchoolYearService` | school year and term lifecycle |
| `SectionAssignmentService` | section creation and student assignment |
| `UserService` | user/profile account writes |

## Frontend Shape

- Page files live in `resources/js/Pages/<Role>/<Feature>/Index.jsx`.
- State-heavy pages may use co-located `useFeature.jsx` hooks.
- Shared UI primitives live in `resources/js/Components/ui/` and are exported by the barrel.
- Feature components live under `resources/js/Components/<Role>/<Feature>/` with an `index.js` barrel.
- Tables use `DataTable`; statuses use `StatusBadge`; row actions use `ActionsDropdown`.

## Dev Accounts

Seeded accounts use password `password`.

| Role | Email |
|---|---|
| `admin` | `marifelgrace.kummer@site.spup` |
| `coordinator_it` | `rucelj.pugeda@site.spup` |
| `coordinator_engineering` | `cirilio.gazzingan@site.spup` |
| `teacher` | `justinevince.tan@site.spup` |
| `student` | `bsit.y1.01@site.spup` |

## Related Docs

- Backend implementation rules: `docs/notes/backend-rules.md`
- React and modal rules: `docs/notes/react-rules.md`
- Design rules: `docs/notes/design.md`
- Grade lifecycle: `docs/notes/grade-flow.md`
- Reusable UI inventory: `docs/dev-traits/SKILLS.md`
- Security checklist: `docs/dev-traits/SECURITY.md`
