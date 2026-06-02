import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, PagePanel, StatusBadge } from '@/Components/ui';
import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

export default function Show({ assignment, enrollmentCourses = [], validGrades = [] }) {
    function normalizeGradeValue(value) {
        if (value === null || value === undefined || value === '') return '';
        return Number(value).toFixed(2);
    }

    const [grades, setGrades] = useState(() => {
        const initialValues = {};
        enrollmentCourses.forEach((enrollmentCourse) => {
            initialValues[enrollmentCourse.id] = normalizeGradeValue(enrollmentCourse.final_grade);
        });
        return initialValues;
    });
    const [processingId, setProcessingId] = useState(null);

    function submitGrade(enrollmentCourseId) {
        if (assignment.finalized_at) return;
        setProcessingId(enrollmentCourseId);

        const rawGrade = grades[enrollmentCourseId];
        router.post(route('teacher.grades.store'), {
            enrollment_course_id: enrollmentCourseId,
            grade: rawGrade === '' ? null : Number(rawGrade),
        }, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    }

    const columns = [
        {
            key: 'student',
            label: 'Student',
            className: 'font-semibold text-gray-900',
            render: (row) => `${row.enrollment?.student?.last_name ?? '-'}, ${row.enrollment?.student?.first_name ?? '-'}`,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'grade',
            label: 'Final Grade',
            render: (row) => (
                <select
                    className="w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    value={grades[row.id] ?? ''}
                    onChange={(event) => setGrades((previous) => ({ ...previous, [row.id]: event.target.value }))}
                    disabled={Boolean(assignment.finalized_at)}
                >
                    <option value="">INC</option>
                    {validGrades.map((gradeValue) => (
                        <option key={gradeValue} value={Number(gradeValue).toFixed(2)}>
                            {Number(gradeValue).toFixed(2)}
                        </option>
                    ))}
                </select>
            ),
        },
    ];

    const sectionLabel = `${assignment.section?.name ?? '-'} (${assignment.section?.program?.code ?? '-'} ${getYearLabel(assignment.section?.year_level)})`;
    const termLabel = getSemesterLabel(assignment.academic_term?.semester);

    return (
        <AuthenticatedLayout header="Grades">
            <Head title="Gradebook" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-6">
                    <PagePanel
                        title={`${assignment.course?.course_code ?? '-'} - ${assignment.course?.title ?? '-'}`}
                        description={`${sectionLabel} • ${termLabel}`}
                        action={
                            <Link
                                href={route('teacher.grades.index')}
                                className="inline-flex items-center border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-600 transition-colors hover:bg-gray-50"
                            >
                                Back to Gradebooks
                            </Link>
                        }
                    >
                        {assignment.finalized_at && (
                            <div className="mb-4 border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                                <span className="font-semibold">Finalized:</span> This assignment is locked.
                                {assignment.finalizer?.name ? ` Finalized by ${assignment.finalizer.name}.` : ''}
                            </div>
                        )}

                        <DataTable
                            columns={columns}
                            rows={enrollmentCourses}
                            emptyMessage="No enrolled students found for this section assignment."
                            actions={(row) => (
                                <button
                                    type="button"
                                    className="inline-flex items-center border border-transparent bg-emerald-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-emerald-800 disabled:opacity-25"
                                    onClick={() => submitGrade(row.id)}
                                    disabled={processingId === row.id || Boolean(assignment.finalized_at)}
                                >
                                    {assignment.finalized_at ? 'Locked' : processingId === row.id ? 'Saving...' : 'Save Grade'}
                                </button>
                            )}
                        />
                    </PagePanel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
