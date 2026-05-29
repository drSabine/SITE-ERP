# Roadmap

> Planned features and modules. Update as work is completed or priorities shift.
> **Last updated:** 2026-05-29

---

## In Progress

- Admin frontend — School Years + Academic Terms page (modal CRUD, axios term load)

## Planned

### Admin
- Users/Staff CRUD page
- Programs CRUD page
- Courses CRUD page (with prerequisite wiring)

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
