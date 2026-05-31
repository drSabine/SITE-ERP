# Analytics & Board Exam System Plan

> Plan for enrollment analytics and board exam tracking features
> **Last updated:** 2026-05-30

---

## Existing Schema Support

Your current schema already supports:
- **Enrollment tracking**: `enrollments` + `enrollment_courses` tables
- **Majors**: `programs` table (BSENSE, BLISS, BSCE, BSIT)
- **Regular vs Irregular**: Can be computed from enrollment_courses load (standard curriculum vs manual)
- **Graduation check**: Service layer logic exists (compare passed courses vs required curriculum)

---

## New Schema Required

**Board Exam System** (new tables needed):
```sql
board_exams
  - id, exam_name, exam_date, exam_type (ESE/Engineering), month (Feb/March/Sept)

board_exam_results  
  - id, student_id, board_exam_id, score, status (passed/failed), is_retaker (boolean)
```

---

## Team Structure (4 Developers)

**Dev 1: Board Exam Module**
- Create migrations for board_exams, board_exam_results
- Build BoardExamController + BoardExamResult model
- Build result entry page (admin/coordinator)
- Build board exam analytics dashboard (Recharts)

**Dev 2: Coordinator Frontend**
- Complete students list + profile page
- Complete enrollment modal
- Teacher assignments page
- INC/Deficiency list

**Dev 3: Infrastructure**
- Curriculum seeders for all 4 programs (BSENSE, BLISS, BSCE, BSIT)
- PDF enrollment report
- Prerequisite soft-warning UI

**Dev 4: Enrollment Analytics**
- Add is_regular flag to enrollments
- Build AnalyticsService (retention, graduation calculations)
- Build AnalyticsController + dashboard pages
- Integrate Recharts for visualizations

---

## What to Do First (Priority Order)

**Phase 1: Board Exam System** (Foundation)
1. Create board_exams + board_exam_results migrations
2. Build models and relationships
3. Build result entry page
4. Build analytics dashboard (trends, per batch, 1st takers vs retakers)

**Phase 2: Complete Coordinator/Teacher features**
1. Students list + enrollment modal
2. Grade input page
3. Teacher assignments page
4. INC/Deficiency list

**Phase 3: Infrastructure**
1. Curriculum seeders for all 4 programs (BSENSE, BLISS, BSCE, BSIT)
2. PDF enrollment report
3. Prerequisite soft-warning UI

**Phase 4: Enrollment Analytics**
1. Add is_regular flag to enrollments
2. Build analytics service (retention, graduation calculations)
3. Build analytics dashboard with charts for all 4 programs (BSENSE, BLISS, BSCE, BSIT)

---

## Analytics Features

**Board Exam Analytics:**
- Trends over time (pass rates by year)
- Per batch count (March vs September for Engineering)
- 1st takers vs retakers comparison
- ESE (February) board exam tracking

**Enrollment Analytics:**
- Graduation data/retention rate
- Enrollment count per term/program/year level (BSENSE, BLISS, BSCE, BSIT)
- Regular vs Irregular distribution
- Cohort retention tracking (Year 1 → Year 4 survival)

---

## Design Notes

- Use Recharts for all visualizations
- Follow emerald color scheme (no indigo/blue)
- Square edges on structural elements
- Modal-first CRUD for data entry
- DataTable component for all table views
