export const SEMESTER_LABELS = {
    first: '1st Semester',
    second: '2nd Semester',
    summer: 'Summer',
};

export const YEAR_LABELS = {
    1: '1st Year',
    2: '2nd Year',
    3: '3rd Year',
    4: '4th Year',
    5: '5th Year',
};

export const YEAR_LEVELS = [1, 2, 3, 4, 5];

export const YEAR_TABS = [
    { label: 'All Years', value: '' },
    { label: YEAR_LABELS[1], value: '1' },
    { label: YEAR_LABELS[2], value: '2' },
    { label: YEAR_LABELS[3], value: '3' },
    { label: YEAR_LABELS[4], value: '4' },
    { label: YEAR_LABELS[5], value: '5' },
];

export const STUDENT_STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'graduated', label: 'Graduated' },
    { value: 'transferred', label: 'Transferred' },
    { value: 'dropped', label: 'Dropped' },
    { value: 'leave_of_absence', label: 'Leave of Absence' },
];

export const ENROLLMENT_STATUS_OPTIONS = [
    { value: 'enrolled', label: 'Evaluated' },
    { value: 'completed', label: 'Completed' },
    { value: 'dropped', label: 'Dropped' },
];

export const ACTIVE_COURSE_STATUSES = ['active', 'inc'];
export function getMaxUnits(semester) {
    return semester === 'summer' ? 9 : 26;
}

export function getYearLabel(yearLevel) {
    return YEAR_LABELS[yearLevel] ?? yearLevel;
}

export function getSemesterLabel(semester) {
    return SEMESTER_LABELS[semester] ?? semester ?? '-';
}

export function getActiveEnrollmentCourses(enrollment) {
    return (enrollment?.enrollment_courses ?? []).filter(enrollmentCourse =>
        ACTIVE_COURSE_STATUSES.includes(enrollmentCourse.status)
    );
}

export function countIncCourses(enrollment) {
    return (enrollment?.enrollment_courses ?? []).filter(enrollmentCourse =>
        enrollmentCourse.status === 'inc'
    ).length;
}

export function formatStudentName(student, { middleInitial = false, includeSuffix = true } = {}) {
    if (!student) return '-';

    const middleName = student.middle_name
        ? ` ${middleInitial ? `${student.middle_name[0]}.` : student.middle_name}`
        : '';
    const suffix = includeSuffix && student.suffix ? ` ${student.suffix}` : '';

    return `${student.last_name}, ${student.first_name}${middleName}${suffix}`;
}
