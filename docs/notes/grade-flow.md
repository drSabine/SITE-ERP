# Grade Flow Documentation

> How grades move from teacher input to finalized transcript entries.

---

## Overview

Grades live in `enrollment_courses` — one row per student per course per enrollment (term).
The `status` column is the source of truth for a course's lifecycle state.
The `final_grade` column stores the numeric grade (1.00–3.00 or 5.00); `null` means no grade submitted or INC.

---

## Status Lifecycle

```
  Enrollment created
        │
        ▼
    [ active ]  ←──────────────────────────────────────┐
        │                                               │
        ├─ Teacher submits grade  ──────────────────────┘  (grade set, status stays active)
        │
        ├─ Teacher marks INC ─────► [ inc ]  ←── finalization (if grade still null)
        │                               │
        │                               └─ Coordinator overrides ──► [ passed / failed ]
        │
        ├─ Teacher marks DROP ────► [ dropped ]  (removed from teacher view)
        │                               │
        │                               └─ Coordinator can restore ──► [ active ]
        │
        └─ Term finalized ────────► [ passed ]   (grade ≤ 3.00)
                                    [ failed ]   (grade = 5.00)
                                    [ inc ]      (grade = null, not already marked)
```

**Finalized statuses** (`passed`, `failed`, `credited`) are immutable — only coordinator override can change them.

---

## Grade Values

| Value | Meaning |
|-------|---------|
| 1.00 – 3.00 | Passing grade (transmuted scale) |
| 5.00 | Failed |
| `null` + `active` | No grade submitted yet |
| `null` + `inc` | Explicitly marked Incomplete |
| `null` + `dropped` | Dropped from the course |

---

## Status Reference

| Status | Meaning | Who sets it | Visible to teacher? |
|--------|---------|-------------|---------------------|
| `active` | Enrolled; grade pending or submitted but not finalized | System on enrollment | ✓ |
| `inc` | Incomplete — teacher flagged or finalization found no grade | Teacher (immediate) or term finalization | ✓ |
| `dropped` | Dropped from the course | Teacher (marks DROP) or Coordinator (removes course) | ✗ (hidden from teacher view) |
| `passed` | Grade 1.00–3.00, locked | Term finalization or Coordinator override | ✗ (finalized) |
| `failed` | Grade 5.00, locked | Term finalization or Coordinator override | ✗ (finalized) |
| `credited` | Transfer credit, satisfies pre-req | Coordinator (credit course) | ✗ (finalized) |

---

## Actor Roles & Permissions

### Teacher
- Views grade sheet at `GET /teacher/grades/{teacherAssignment}`
  - Only sees rows where `status IN ('active', 'inc')`
- Can **submit a grade** (1.00–3.00 or 5.00): sets `final_grade`, status stays `active`
- Can **mark INC** (`mark_as=inc`): sets `status='inc'`, `final_grade=null` — **effective immediately**
- Can **mark DROP** (`mark_as=dropped`): sets `status='dropped'`, `final_grade=null` — student disappears from their view
- Can **change an INC back to a grade**: select a grade value for a row currently in `inc` status
- **Cannot**: restore a drop, modify `passed`/`failed`/`credited`/`dropped` rows

### Coordinator
- Views **Grading Monitor** (`GET /coordinator/grading-monitor`)
  - Shows all statuses including `active`, `inc`, `passed`, `failed`, **`dropped`**
  - INC and DROP flags from teachers appear here **in real-time**
- Can **override grade** (`POST /coordinator/enrollment-courses/{ec}/override-grade`): sets grade AND locks status immediately (bypasses finalization)
- Can **remove course** (`DELETE /coordinator/enrollment-courses/{ec}`): sets `status='dropped'`
- Can **restore dropped course** (`POST /coordinator/enrollment-courses/{ec}/restore`): back to `status='active'`

### Admin
- Can **assign teachers** to section subjects for a school year term.
- Can **finalize an academic term** (`POST /admin/academic-terms/{term}/finalize`): bulk-processes all `active` rows

---

## Flow 1: Normal Grade Submission

```
1. Admin/Coordinator creates TeacherAssignment (term + section + course → teacher)
2. Teacher opens grade sheet → sees students in 'active' (and 'inc') status
3. Teacher selects a grade from the dropdown → clicks "Save Grade"
   → enrollment_courses.final_grade = 2.00
   → enrollment_courses.status stays 'active'
4. Admin finalizes the academic term:
   → 'active' rows with grade ≤ 3.00  → status = 'passed'
   → 'active' rows with grade = 5.00  → status = 'failed'
   → 'active' rows with grade = null  → status = 'inc'
   → 'inc', 'dropped', 'passed', 'failed' rows → untouched
```

---

## Flow 2: INC Flow (Teacher-marked)

```
1. Teacher selects "INC (Incomplete)" from the dropdown → clicks "Mark INC"
   → POST /teacher/grades  { mark_as: 'inc' }
   → enrollment_courses.status = 'inc'   (set IMMEDIATELY)
   → enrollment_courses.final_grade = null
2. Coordinator sees the INC flag in real-time via Grading Monitor
3. Coordinator tracks the student through the Grading Monitor INC status.
4. Resolution paths:
   a) Coordinator overrides grade → status becomes 'passed' or 'failed' (locked immediately)
   b) Teacher (while the academic term is active) selects a grade for the INC row
      → status returns to 'active' + grade set → finalization locks it later
```

> **Key rule:** Coordinator-overridden grades bypass finalization — they are locked at the time of override.

---

## Flow 3: DROP Flow

```
1. Teacher selects "DROP (Dropped)" from the dropdown → clicks "Mark Dropped"
   → POST /teacher/grades  { mark_as: 'dropped' }
   → enrollment_courses.status = 'dropped', final_grade = null
   → Row disappears from teacher's grade sheet
2. Coordinator sees 'dropped' status in Grading Monitor in real-time
3. If the drop was a mistake:
   → Coordinator clicks "Restore" on the enrollment detail page
   → status returns to 'active'
4. If drop stands:
   → Status stays 'dropped' — unaffected by term finalization
```

> **Key rule:** Only the coordinator can reverse a teacher-marked drop.

---

## Flow 4: Term Finalization

```
1. Admin reviews grading progress by teacher/subject in the Grading Monitor.
2. Admin finalizes the academic term (POST /admin/academic-terms/{term}/finalize):
   → For each enrollment_course WHERE status = 'active':
       final_grade ≤ 3.00  → status = 'passed'
       final_grade = 5.00  → status = 'failed'
       final_grade = null  → status = 'inc'
   → Rows with 'inc', 'dropped', 'passed', 'failed', 'credited' → untouched
3. AcademicTerm.is_active → false
```

---

## Key Rules & Constraints

1. **INC is immediate.** Teacher-marked INC sets `status='inc'` on save. Coordinators see it in the Grading Monitor instantly — not just after finalization.

2. **DROP is teacher-accessible.** Teachers mark drops via the grade sheet. They lose visibility of dropped rows. Only the coordinator can restore a drop.

3. **Term finalization is the grade lock.** Teacher assignments define teaching load only; finalizing the academic term locks all `active` enrollment_courses across the term.

4. **Coordinator override bypasses finalization.** `overrideGrade()` sets `final_grade` AND `status` immediately. Safe to call even after the term is finalized.

5. **Finalized statuses are protected.** `inputGrade()` throws if `status` is `passed`, `failed`, or `credited`. Only coordinator `overrideGrade()` can touch these.

6. **Summer semester scope.** Summer courses exist only for BSIT Year 1 and Year 2. BSCE has no summer curriculum. Enrollments for summer are only created where the program+year_level has summer courses in the curriculum.

---

## Analytics Impact

The `DashboardAnalyticsService` aggregates `enrollment_courses.status` across school years:

| Status | Analytics bucket |
|--------|-----------------|
| `passed` | `passed` count — positive outcome |
| `failed` | `failed` count — negative outcome |
| `inc` | `inc` count — unresolved, attention needed |
| `dropped` | `dropped` count — attrition indicator |
| `active` | Not counted in outcome trend (in-progress) |
| `credited` | Not counted separately |

**Evaluation trend** (`schoolYearEvaluationTrend`) — counts distinct students enrolled/completed per year → admin dashboard bar chart.

**Program distribution** (`programDistribution`) — counts students enrolled in the active school year by program → pie chart.

**Outcome trend** (`evaluationOutcomeTrend`) — sums passed/failed/inc/dropped per school year → stacked chart showing academic health over time.
