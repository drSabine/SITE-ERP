# Roadmap

> Planned features and modules. Update as work is completed or priorities shift.
> **Last updated:** 2026-05-29

---

## In Progress

- Coordinator frontend — Students list + enrollment modal

## Planned

### Coordinator
- Students list + profile page (search, filter, paginate)
- Student enrollment modal (enroll in term, load curriculum, add/remove courses)
- Teacher assignments page
- INC / Deficiency list

### Teacher
- Grade input page (grade sheet per assigned course per term)

### Shared / Infrastructure
- BSIT curriculum seeder
- BSCE curriculum seeder
- PDF enrollment report (DOMPDF, inline CSS only)
- Prerequisite soft-warning UI

## Completed

- Schema design (13 migrations, verified with migrate:fresh)
- All 11 Models with relationships and scopes
- EnsureRole middleware
- SchoolYearService, EnrollmentService, GradeService
- 12 Controllers (Admin, Coordinator, Teacher)
- 60 Routes (all verified, zero errors)
- `docs/system-design.md`
- Grading simplification: removed term_periods + grades tables, flat one-grade-per-course model
- Login page redesign (SPUP branding, split layout, dev quick-login, forgot password tip modal)
- Dynamic role-aware sidebar with emerald branding, live Philippine time header
- Admin — School Years + Academic Terms page (modal CRUD, expand/collapse, confirm modals)
- Admin - User accounts CRUD page (modal, paginated, user profile inline)
- Admin — Programs CRUD page (modal, Manage Courses link per row)
- Admin — Courses CRUD page (grouped by year level + semester, back-link to Programs)
- Reusable UI primitives: `InputField`, `DetailField`, `formatDate`, `formatDateRange`
- Design system: no-rounded-edges rule enforced on all structural elements
