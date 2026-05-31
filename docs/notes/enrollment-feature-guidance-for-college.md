# Enrollment Feature Guidance for a College System

> Purpose: explain how BEU-AIS enrollment works so another system can reuse the database ideas safely.
> This is not a request to recreate BEU-AIS. Do not copy BEU-AIS roles, grade levels, JHS section rules, UI, branding, or promotion assumptions into the college system.

## 1. Boundary: What to Copy vs. What to Replace

Copy the core pattern:

- Keep the learner identity record separate from yearly/term enrollment records.
- Store placement data on enrollment-like rows, not on the student/person table.
- Use foreign keys for academic period, program/year level, block/section, and student.
- Prevent duplicate enrollment rows for the same student in the same academic period.
- Treat enrollment as the parent record for downstream academic records.

Replace these BEU-AIS-specific parts:

- `Grade 7` to `Grade 10` should become college year levels, programs, curriculum years, terms, or blocks.
- `section_type = science|academic` should become college-specific grouping if needed, such as program, block, major, strand, campus, modality, or schedule group.
- Automatic promotion based on next numeric grade should not be copied directly. College progression is usually not a simple `current level + 1`.
- The "auto-detect and click one button" UX should be replaced with the requested cascade flow: choose year level and section/block first, search eligible students, select students, then enroll selected students.

## 2. Current BEU-AIS Database Structure

BEU-AIS separates static identity from transactional enrollment:

```text
users
  id
  role = admin|teacher|student
  is_active
  deleted_at

students
  id
  user_id -> users.id nullable, nullOnDelete
  lrn unique
  first_name, middle_name, last_name, suffix
  sex, birthdate, contact/guardian fields
  status = active|graduated|transferred_out
  deleted_at

school_years
  id
  name unique
  start_date, end_date
  is_active
  status = active|finalized

grade_levels
  id
  name
  numeric_level unique
  level_code

sections
  id
  name
  grade_level_id -> grade_levels.id restrict
  school_year_id -> school_years.id nullable, restrict
  section_type = academic|science
  capacity
  is_active
  deleted_at

enrollments
  id
  student_id -> students.id restrict
  school_year_id -> school_years.id restrict
  grade_level_id -> grade_levels.id restrict
  section_id -> sections.id nullable, restrict
  enrollment_status = enrolled|transferred_out|completed
  is_current boolean
  transfer_type = none|inbound|outbound
  final_average nullable
  remarks nullable
  enrolled_at, transferred_at, completed_at
```

Important meaning of the IDs:

- `students.id` is the learner/person identity used by academic records.
- `users.id` is only the login account. A student can keep academic records even if the user account is deactivated or soft-deleted.
- `enrollments.student_id` says who is enrolled.
- `enrollments.school_year_id` says when the placement applies.
- `enrollments.grade_level_id` says the academic level for that year.
- `enrollments.section_id` says the assigned section for that year.
- `sections.grade_level_id` and `sections.school_year_id` make sections year-specific. A "Section A" in one year is a different row from "Section A" in another year.
- `enrollments.is_current` marks the active/latest placement, but historical rows stay preserved.

Downstream records also use `student_id`, `section_id`, and `school_year_id`. For example, `grade_books` has a unique key on `student_id + section_id + school_year_id`. This is why changing a student section after grades exist is blocked.

## 3. Integrity Rules in BEU-AIS

The intended rule is one enrollment per student per school year. The current code enforces this in `EnrollmentService::bulkStore()` by checking existing enrollments for each `student_id + school_year_id` before inserting.

However, the migration currently creates indexes, not a database-level unique constraint, for `student_id + school_year_id`. If building the college version, prefer a real unique constraint unless the college domain explicitly allows multiple enrollments in the same period, such as multiple programs or campuses.

Recommended college constraint options:

```text
Simple college enrollment:
  unique(student_id, academic_term_id)

If a student may enroll in multiple programs in the same term:
  unique(student_id, academic_term_id, program_id)

If a student may enroll in multiple blocks/sections in the same term:
  do not force section into the main enrollment uniqueness;
  use enrollment_sections or course_enrollments as child tables.
```

BEU-AIS deletion rules are conservative:

- Students are not hard-deleted when they have academic history.
- Enrollment deletion is blocked when grade books, report cards, or grading sheet entries exist for that student and school year.
- Transfer and graduation update statuses instead of deleting history.

## 4. How Section Assign Detects Students

BEU-AIS Section Assign is a year-transition workflow. It uses the current school year context as the target year.

Detection rules:

1. Load active student accounts only: `Student::withActiveUser()`.
2. Include students whose `students.status` is null or `active`.
3. Include students not enrolled in the target school year.
4. Also include students who already have a target-year enrollment but `section_id` is null.
5. Find each student's latest enrollment outside the target year.
6. If the latest grade is below the terminal grade, suggest the next grade.
7. If the latest grade is terminal grade, route the student to the Graduation tab instead of promotion.

The generated preview row contains:

```text
student_id
student_name
sex
is_new
school_year_id
grade_level_id
section_id
enrollment_status = enrolled
```

New students have no previous enrollment, so they are detected but need manual grade and section assignment.

## 5. How Section Auto-Mapping Works

BEU-AIS does not randomly assign sections. It uses previous placement to suggest a target section:

1. Get the student's latest enrollment outside the target year.
2. Read the previous `grade_level.numeric_level`.
3. Suggest `numeric_level + 1`, unless the student is already in the terminal grade.
4. Read the previous section's `section_type`.
5. Order source-year sections by the `Section::ordered()` scope.
6. Find the previous section's position among same-grade, same-type source sections.
7. In the target year, find sections in the next grade with the same `section_type`.
8. Pick the target section at the same position.
9. If no matching target section exists, leave `section_id = null` and require manual selection.

Example:

```text
Source year:
  Grade 7 science sections ordered as [S7-A, S7-B]
  Student was in S7-B, position 2

Target year:
  Grade 8 science sections ordered as [S8-A, S8-B]
  Suggested section = S8-B
```

This mapping exists because BEU-AIS has predictable JHS sections. A college system should not copy this algorithm unless its blocks are also intentionally positional across terms.

## 6. How the Bulk Store Works

The frontend submits only selected preview rows:

```json
{
  "enrollments": [
    {
      "student_id": 123,
      "school_year_id": 5,
      "grade_level_id": 8,
      "section_id": 42,
      "enrollment_status": "enrolled"
    }
  ]
}
```

Backend behavior:

1. Rejects writes while viewing a historical school year.
2. Validates every foreign key.
3. Batch-loads existing enrollments for all selected students and target years.
4. Skips rows already enrolled in the same year.
5. Updates existing rows only when the existing target-year enrollment has `section_id = null`.
6. Inserts new enrollment rows in chunks.
7. Marks older enrollments for those students as `is_current = false`.
8. Logs one compact activity per section, not one log per student.

## 7. Recommended College Version: Flexible Cascade Flow

Your planned UX is better for college because placement is often not automatic.

Recommended flow:

```text
Step 1: User selects academic term / school year.
Step 2: User selects program or department, if the college system has it.
Step 3: User selects year level.
Step 4: User selects block/section.
Step 5: System shows searchable eligible students.
Step 6: User selects students.
Step 7: System previews selected students.
Step 8: User submits enrollment batch.
```

Important: once the user has selected the year level and section, every selected student should inherit those IDs from the selected context. Do not ask the user to set year level and section per row unless the page intentionally supports mixed-section batch enrollment.

Suggested request payload:

```json
{
  "academic_term_id": 5,
  "year_level_id": 2,
  "section_id": 42,
  "student_ids": [123, 124, 125]
}
```

Backend should convert this into enrollment rows:

```text
student_id = each selected student
academic_term_id = selected term
year_level_id = selected year level
section_id = selected section
status = enrolled
is_current = true
enrolled_at = current timestamp or official term enrollment date
```

## 8. Suggested College Schema Adaptation

Use the same shape, but rename the academic concepts to match college language.

```text
students
  id
  user_id nullable
  student_number unique
  names, demographics, contact fields
  status

academic_terms
  id
  school_year
  term_number or semester
  start_date, end_date
  is_active
  status

programs
  id
  code
  name
  department_id nullable

year_levels
  id
  name
  numeric_level

sections
  id
  academic_term_id
  program_id nullable
  year_level_id
  code/name
  capacity
  is_active

enrollments
  id
  student_id
  academic_term_id
  program_id nullable
  year_level_id
  section_id nullable
  status
  is_current
  enrolled_at
  remarks
```

Foreign keys:

- `students.user_id -> users.id`, nullable, null on delete.
- `sections.academic_term_id -> academic_terms.id`.
- `sections.program_id -> programs.id`, if college sections are program-specific.
- `sections.year_level_id -> year_levels.id`.
- `enrollments.student_id -> students.id`.
- `enrollments.academic_term_id -> academic_terms.id`.
- `enrollments.program_id -> programs.id`, if applicable.
- `enrollments.year_level_id -> year_levels.id`.
- `enrollments.section_id -> sections.id`.

Recommended indexes:

- `unique(student_id, academic_term_id)` or the correct domain-specific duplicate guard.
- `index(section_id, academic_term_id)`.
- `index(student_id, academic_term_id)`.
- `index(academic_term_id, status)`.
- `index(student_number)` on students.

## 9. Search and Eligibility Rules for the College Flow

The search endpoint should return students eligible for the selected term and section context.

Recommended filters:

- Search by student number, first name, middle name, last name, or email.
- Exclude students already enrolled in the selected academic term, unless the workflow is "move section" or "complete missing section".
- Exclude graduated, transferred out, inactive, or soft-deleted students unless the workflow explicitly supports returnees.
- Optionally filter by program if the selected section belongs to a program.
- Optionally show current/last enrollment as context, but do not auto-promote from it unless the college domain asks for that.

Suggested response row:

```json
{
  "id": 123,
  "student_number": "2026-0001",
  "full_name": "Student Name",
  "current_status": "active",
  "last_enrollment": {
    "academic_term": "2025-2026 2nd Sem",
    "program": "BSIT",
    "year_level": "1st Year",
    "section": "BSIT 1A"
  },
  "already_enrolled_in_selected_term": false
}
```

## 10. AI Guardrails for the New System

When using this document in another AI-assisted project, include these instructions:

- Do not create BEU-AIS.
- Do not create JHS-only grade levels, science/academic section types, adviser workflows, report-card workflows, or BEU branding unless the college system explicitly needs them.
- Treat BEU-AIS as a reference for relational structure and lifecycle safety only.
- Use the college system's own terms: academic term, semester, program, year level, block/section, student number.
- Prefer explicit user selection over automatic promotion.
- Add database constraints for duplicate prevention, not only service-level checks.
- Keep enrollment creation in a service layer or equivalent domain layer.
- Batch-query existing enrollments with `whereIn`, not one query per selected student.
- Do not change a student's section after grades or course records exist unless the college system has a safe transfer/move workflow.

## 11. Minimal Algorithm for the College Cascade

```text
open enrollment page
  load active academic terms
  load year levels

when term + year level are selected
  load sections for that term/year level

when section is selected
  enable student search

when user searches
  query active students
  exclude already-enrolled students for the selected term
  return compact student rows with last enrollment context

when user selects students
  keep selected student IDs in local state
  show preview with selected term/year/section

when user submits
  validate term, year level, section, student IDs
  verify section belongs to selected term/year level
  verify students are eligible
  insert enrollment rows in a transaction or chunked batch
  mark previous current enrollments not current if that is part of the domain
  return created/skipped/errors summary
```

## 12. BEU-AIS Files Used as Reference

- `database/migrations/2026_01_12_140109_create_students_table.php`
- `database/migrations/2026_01_12_140121_create_enrollments_table.php`
- `database/migrations/2026_01_12_140045_create_grade_levels_table.php`
- `database/migrations/2026_01_12_140107_create_sections_table.php`
- `database/migrations/2026_01_12_140106_create_school_years_table.php`
- `database/migrations/2026_01_12_140123_create_student_subjects_table.php`
- `database/migrations/2026_02_21_023522_add_performance_indexes_phase1.php`
- `database/migrations/2026_02_21_025117_add_performance_indexes_phase2.php`
- `app/Models/Student.php`
- `app/Models/Enrollment.php`
- `app/Services/EnrollmentService.php`
- `app/Http/Controllers/Admin/EnrollmentController.php`
- `resources/js/Pages/Admin/Enrollments/SectionAssign.jsx`
- `resources/js/Components/Admin/Enrollments/EnrollmentPreviewTable.jsx`
- `resources/js/Components/Admin/Enrollments/SectionAssignGuide.jsx`
