import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, PagePanel, PrimaryButton, StatusBadge } from '@/Components/ui';
import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

function initialEdit(enrollmentCourse) {
    if (enrollmentCourse.status === 'inc') return { grade: '', mark: 'inc' };
    if (enrollmentCourse.final_grade !== null && enrollmentCourse.final_grade !== undefined) {
        return { grade: Number(enrollmentCourse.final_grade).toFixed(2), mark: null };
    }
    return { grade: '', mark: null };
}

function buildInitial(rows) {
    return Object.fromEntries(rows.map(row => [row.id, initialEdit(row)]));
}

export default function Show({ assignment, enrollmentCourses = [], validGrades = [] }) {
    const isLocked = !assignment.academic_term?.is_active;

    const [edits, setEdits] = useState(() => buildInitial(enrollmentCourses));
    const [saving, setSaving] = useState(false);

    // Re-sync to server truth after a save reloads the page props.
    useEffect(() => {
        setEdits(buildInitial(enrollmentCourses));
    }, [enrollmentCourses]);

    function isDirty(row) {
        const current = edits[row.id] ?? initialEdit(row);
        const initial = initialEdit(row);
        return current.grade !== initial.grade || current.mark !== initial.mark;
    }

    const dirtyRows = enrollmentCourses.filter(isDirty);

    function setGrade(id, value) {
        setEdits(previous => ({ ...previous, [id]: { grade: value, mark: null } }));
    }

    function toggleMark(id, mark) {
        setEdits(previous => {
            const current = previous[id] ?? { grade: '', mark: null };
            const next = current.mark === mark ? { grade: '', mark: null } : { grade: '', mark };
            return { ...previous, [id]: next };
        });
    }

    function saveAll() {
        if (isLocked || dirtyRows.length === 0) return;
        const grades = dirtyRows.map(row => {
            const edit = edits[row.id];
            if (edit.mark) return { enrollment_course_id: row.id, mark_as: edit.mark, grade: null };
            return { enrollment_course_id: row.id, mark_as: null, grade: edit.grade === '' ? null : Number(edit.grade) };
        });

        router.post(route('teacher.grades.bulk'), { grades }, {
            preserveScroll: true,
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
        });
    }

    const columns = [
        {
            key: 'student',
            label: 'Student',
            widthClassName: 'w-[36%]',
            render: (row) => (
                <span className="flex items-center">
                    {isDirty(row) && <span className="mr-2 inline-block h-2 w-2 shrink-0 rounded-full bg-amber-500" title="Unsaved change" />}
                    <span className="font-semibold text-gray-900">
                        {row.enrollment?.student?.last_name ?? '-'}, {row.enrollment?.student?.first_name ?? '-'}
                    </span>
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Saved',
            widthClassName: 'w-28',
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'grade',
            label: 'Grade',
            widthClassName: 'w-32',
            render: (row) => {
                const edit = edits[row.id] ?? { grade: '', mark: null };
                return (
                    <select
                        className="w-full rounded border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
                        value={edit.grade}
                        onChange={(event) => setGrade(row.id, event.target.value)}
                        disabled={isLocked || edit.mark !== null}
                    >
                        <option value="">Choose grade</option>
                        {validGrades.map((gradeValue) => (
                            <option key={gradeValue} value={Number(gradeValue).toFixed(2)}>
                                {Number(gradeValue).toFixed(2)}
                            </option>
                        ))}
                    </select>
                );
            },
        },
        {
            key: 'mark',
            label: 'Mark',
            widthClassName: 'w-44',
            render: (row) => {
                const edit = edits[row.id] ?? { grade: '', mark: null };
                return (
                    <div className="inline-flex">
                        <button
                            type="button"
                            onClick={() => toggleMark(row.id, 'inc')}
                            disabled={isLocked}
                            className={`border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors disabled:opacity-40 ${
                                edit.mark === 'inc'
                                    ? 'border-amber-500 bg-amber-500 text-white'
                                    : 'border-gray-300 bg-white text-amber-700 hover:bg-amber-50'
                            }`}
                        >
                            INC
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleMark(row.id, 'dropped')}
                            disabled={isLocked}
                            className={`-ml-px border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors disabled:opacity-40 ${
                                edit.mark === 'dropped'
                                    ? 'border-red-600 bg-red-600 text-white'
                                    : 'border-gray-300 bg-white text-red-600 hover:bg-red-50'
                            }`}
                        >
                            Drop
                        </button>
                    </div>
                );
            },
        },
    ];

    const sectionLabel = `${assignment.section?.name ?? '-'} (${assignment.section?.program?.code ?? '-'} ${getYearLabel(assignment.section?.year_level)})`;
    const termLabel = getSemesterLabel(assignment.academic_term?.semester);

    return (
        <AuthenticatedLayout header="Gradebook">
            <Head title="Gradebook" />

            <div className="py-8">
                <div className="mx-auto max-w-5xl space-y-6 px-6">
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
                        {isLocked ? (
                            <div className="border-b border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-700">
                                <span className="font-semibold">Finalized:</span> this term is locked and grades can no longer be edited.
                            </div>
                        ) : (
                            <div className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-5 py-3">
                                <p className="text-xs text-gray-500">
                                    Pick a grade, or use <span className="font-semibold text-amber-700">INC</span> /
                                    <span className="font-semibold text-red-600"> Drop</span>. Dropped students leave your sheet after saving.
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-gray-500">
                                        {dirtyRows.length} unsaved {dirtyRows.length === 1 ? 'change' : 'changes'}
                                    </span>
                                    <PrimaryButton type="button" onClick={saveAll} disabled={saving || dirtyRows.length === 0}>
                                        {saving ? 'Saving...' : 'Save All'}
                                    </PrimaryButton>
                                </div>
                            </div>
                        )}

                        <DataTable
                            compact
                            columns={columns}
                            rows={enrollmentCourses}
                            emptyMessage="No enrolled students found for this section assignment."
                        />
                    </PagePanel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
