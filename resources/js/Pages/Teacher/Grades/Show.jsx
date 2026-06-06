import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, PagePanel, StatusBadge } from '@/Components/ui';
import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

export default function Show({ assignment, enrollmentCourses = [], validGrades = [] }) {
    const isLocked = !assignment.academic_term?.is_active;

    function initialSelectValue(enrollmentCourse) {
        if (enrollmentCourse.status === 'dropped') return '__drop__';
        if (enrollmentCourse.status === 'inc') return '__inc__';
        if (enrollmentCourse.final_grade !== null && enrollmentCourse.final_grade !== undefined) {
            return Number(enrollmentCourse.final_grade).toFixed(2);
        }
        return '';
    }

    const [grades, setGrades] = useState(() => {
        const initialValues = {};
        enrollmentCourses.forEach((enrollmentCourse) => {
            initialValues[enrollmentCourse.id] = initialSelectValue(enrollmentCourse);
        });
        return initialValues;
    });
    const [processingId, setProcessingId] = useState(null);

    function getSaveButtonLabel(enrollmentCourseId) {
        const raw = grades[enrollmentCourseId] ?? '';
        if (raw === '__inc__') return 'Mark INC';
        if (raw === '__drop__') return 'Mark Dropped';
        return 'Save Grade';
    }

    function submitGrade(enrollmentCourseId) {
        if (isLocked) return;
        setProcessingId(enrollmentCourseId);

        const raw = grades[enrollmentCourseId] ?? '';
        let gradeToSubmit = null;
        let markAs = null;

        if (raw === '__inc__') {
            markAs = 'inc';
        } else if (raw === '__drop__') {
            markAs = 'dropped';
        } else if (raw !== '') {
            gradeToSubmit = Number(raw);
        }

        router.post(route('teacher.grades.store'), {
            enrollment_course_id: enrollmentCourseId,
            grade: gradeToSubmit,
            mark_as: markAs,
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
                    disabled={isLocked}
                >
                    <option value="">— Not graded yet —</option>
                    <option value="__inc__">INC (Incomplete)</option>
                    <option value="__drop__">DROP (Dropped)</option>
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
                        {isLocked && (
                            <div className="mb-4 border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                                <span className="font-semibold">Finalized:</span> This academic term is locked.
                            </div>
                        )}

                        <div className="mb-4 border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                            Select <strong>INC (Incomplete)</strong> to flag a student immediately — the coordinator will see this in the Grading Monitor.
                            Select <strong>DROP (Dropped)</strong> to remove the student from your grade sheet — only the coordinator can reverse a drop.
                        </div>

                        <DataTable
                            columns={columns}
                            rows={enrollmentCourses}
                            emptyMessage="No enrolled students found for this section assignment."
                            actions={(row) => (
                                <button
                                    type="button"
                                    className="inline-flex items-center border border-transparent bg-emerald-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-emerald-800 disabled:opacity-25"
                                    onClick={() => submitGrade(row.id)}
                                    disabled={processingId === row.id || isLocked}
                                >
                                    {isLocked ? 'Locked' : processingId === row.id ? 'Saving...' : getSaveButtonLabel(row.id)}
                                </button>
                            )}
                        />
                    </PagePanel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
