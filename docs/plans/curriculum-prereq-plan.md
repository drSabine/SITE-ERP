# Curriculum & Prerequisite / Co-Requisite Plan

## Definitions

| Type | Meaning | Enforcement |
|---|---|---|
| **Prerequisite** | Must have **passed** this course in a prior term before enrolling. | Soft warning at enrollment time. Coordinator can override for irregular students. |
| **Co-requisite** | Must be **enrolled in the same term** as this course. | Auto-added to the enrollment block when the parent course is enrolled. Coordinator can remove. |

---

## Storage

Single table `course_prerequisites` with a `type` column:

```
course_prerequisites
  id
  course_id          → courses.id (the course that has the requirement)
  prerequisite_id    → courses.id (the required / co-required course)
  type               ENUM('prerequisite', 'co_requisite')  DEFAULT 'prerequisite'
  timestamps
  UNIQUE(course_id, prerequisite_id, type)
```

Query helpers on the `Course` model:
- `$course->prerequisites()`   — `type = 'prerequisite'`
- `$course->coRequisites()`    — `type = 'co_requisite'`

---

## Enrollment Enforcement (future — Enrollment team)

### Pre-requisite check
When a student tries to enroll in Course A that has pre-reqs:
1. Check `enrollment_courses` for each pre-req: must have `status = 'passed'`.
2. If any are missing → show soft warning in the enrollment UI.
3. Coordinator can **override** (irregular student flag) and proceed.

### Co-requisite auto-add
When a student enrolls in Course A that has co-reqs:
1. Automatically add each co-req to the same enrollment block (same term).
2. Show a notice: "Co-requisite [Course B] was added automatically."
3. Coordinator can remove a co-req explicitly (flagged as override).

---

## Text / Standing Prerequisites (Skipped)

Entries like "3rd Year Standing", "4th Year Standing", "Completed all academic req." are **not seeded** as DB relationships. The Program Coordinator validates these manually at enrollment time.

---

## Seeder Plan

1. **`ProgramSeeder`** — `firstOrCreate` BSIT and BSCE programs.
2. **`CurriculumSeeder`** — for each program:
   a. Insert all courses (`upsert` by `program_id + course_code`).
   b. After all courses exist, link prerequisites + co-requisites by code lookup.
3. **`DatabaseSeeder`** — call order: `UserSeeder` → `ProgramSeeder` → `CurriculumSeeder`.
4. Run: `php artisan migrate:fresh --seed`

---

## Migration Change Required

Edit `2026_05_28_000004_create_course_prerequisites_table.php`:
- Add `$table->enum('type', ['prerequisite', 'co_requisite'])->default('prerequisite');`
- Change unique to `['course_id', 'prerequisite_id', 'type']`
