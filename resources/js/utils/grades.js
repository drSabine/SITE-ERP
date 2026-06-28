// Shared grade/GWA formatting for student-facing views.

export const SEMESTER_LABELS = { first: 'First Semester', second: 'Second Semester', summer: 'Summer' };

export function formatGrade(course) {
    if (course.final_grade !== null && course.final_grade !== undefined) {
        return Number(course.final_grade).toFixed(2);
    }
    if (course.status === 'inc') return 'INC';
    if (course.status === 'credited') return 'Credited';
    return '—';
}

export function formatGwa(gwa) {
    return gwa === null || gwa === undefined ? '—' : Number(gwa).toFixed(2);
}

export function termTitle(term) {
    return `${SEMESTER_LABELS[term.semester] ?? term.semester} · S.Y. ${term.school_year ?? ''}`;
}
