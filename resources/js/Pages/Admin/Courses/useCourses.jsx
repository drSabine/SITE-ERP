import { useState } from 'react';
import { router } from '@inertiajs/react';

export function groupCourses(courses) {
    const groups = {};
    courses.forEach(course => {
        const key = `${course.year_level ?? 0}-${course.semester_type ?? 'none'}`;
        if (!groups[key]) {
            groups[key] = { year_level: course.year_level, semester_type: course.semester_type, courses: [] };
        }
        groups[key].courses.push(course);
    });
    return Object.values(groups).sort((groupA, groupB) => {
        if (groupA.year_level !== groupB.year_level) return (groupA.year_level ?? 99) - (groupB.year_level ?? 99);
        const order = { first: 1, second: 2, summer: 3, none: 4 };
        return (order[groupA.semester_type] ?? 4) - (order[groupB.semester_type] ?? 4);
    });
}

export function useCourses(courses) {
    const [showForm, setShowForm]     = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [confirm, setConfirm]       = useState(null);

    function openCreate() { setEditTarget(null); setShowForm(true); }
    function openEdit(course) { setEditTarget(course); setShowForm(true); }

    function requestDelete(course) {
        setConfirm({
            title: 'Delete Course',
            message: <>Delete <strong>{course.course_code} &gt; {course.title}</strong>? This cannot be undone.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('admin.courses.destroy', course.id), {
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    return {
        showForm, setShowForm,
        editTarget,
        confirm, setConfirm,
        groups: groupCourses(courses),
        openCreate, openEdit,
        requestDelete,
    };
}
