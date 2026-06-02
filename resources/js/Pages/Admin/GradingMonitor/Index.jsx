import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ActionsDropdown, ConfirmModal, DataTable, PagePanel, StatusBadge } from '@/Components/ui';
import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

function buildTeacherName(teacher) {
    const profile = teacher.user_profile;
    if (!profile) return teacher.name;
    return `${profile.last_name}, ${profile.first_name}`;
}

export default function Index({ assignments, filters, schoolYears, programs, teachers, sections }) {
    const [confirm, setConfirm] = useState(null);
    const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
    const [studentsByAssignment, setStudentsByAssignment] = useState({});
    const [loadingAssignmentId, setLoadingAssignmentId] = useState(null);

    const selectedSchoolYear = schoolYears.find((schoolYear) =>
        (schoolYear.academic_terms ?? []).some((academicTerm) => academicTerm.id === Number(filters.term_id))
    );
    const termsForSelectedSchoolYear = selectedSchoolYear?.academic_terms ?? [];

    const columns = [
        {
            key: 'section',
            label: 'Section',
            render: (row) => `${row.section?.name ?? '-'} (${row.section?.program?.code ?? '-'} ${getYearLabel(row.section?.year_level)})`,
        },
        {
            key: 'teacher',
            label: 'Teacher',
            render: (row) => (
                <button
                    type="button"
                    className="text-left font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                    onClick={() => toggleAssignmentStudents(row.id)}
                >
                    {buildTeacherName(row.teacher)}
                </button>
            ),
        },
        {
            key: 'subject',
            label: 'Subject',
            render: (row) => `${row.course?.course_code ?? '-'} - ${row.course?.title ?? '-'}`,
        },
        {
            key: 'progress',
            label: 'Progress',
            render: (row) => {
                const metrics = row.grading_metrics ?? {};
                return `${metrics.graded_count ?? 0}/${metrics.total_students ?? 0} (${metrics.completion_rate ?? 0}%)`;
            },
        },
        {
            key: 'finalization',
            label: 'Finalization',
            render: (row) => (
                <StatusBadge
                    status={row.finalized_at ? 'finalized' : 'active'}
                    label={row.finalized_at ? 'Finalized' : 'Open'}
                />
            ),
        },
        {
            key: 'pending',
            label: 'Pending',
            className: 'text-center text-gray-600',
            headerClass: 'text-center',
            render: (row) => row.grading_metrics?.pending_count ?? 0,
        },
        {
            key: 'passed',
            label: 'Passed',
            className: 'text-center text-gray-600',
            headerClass: 'text-center',
            render: (row) => row.grading_metrics?.passed_count ?? 0,
        },
        {
            key: 'failed',
            label: 'Failed',
            className: 'text-center text-gray-600',
            headerClass: 'text-center',
            render: (row) => row.grading_metrics?.failed_count ?? 0,
        },
    ];

    function applyFilters(overrides = {}) {
        router.get(route('admin.grading-monitor.index'), {
            term_id: filters.term_id,
            program_id: filters.program_id,
            year_level: filters.year_level,
            teacher_id: filters.teacher_id,
            section_id: filters.section_id,
            ...overrides,
        }, { preserveState: true, preserveScroll: true });
    }

    function toggleAssignmentStudents(assignmentId) {
        if (expandedAssignmentId === assignmentId) {
            setExpandedAssignmentId(null);
            return;
        }

        setExpandedAssignmentId(assignmentId);
        if (studentsByAssignment[assignmentId]) return;

        setLoadingAssignmentId(assignmentId);
        axios.get(route('admin.grading-monitor.students', assignmentId))
            .then((response) => {
                setStudentsByAssignment((previous) => ({
                    ...previous,
                    [assignmentId]: response.data.students ?? [],
                }));
            })
            .finally(() => setLoadingAssignmentId(null));
    }

    function renderExpandedRow(row) {
        if (loadingAssignmentId === row.id) {
            return <p className="text-sm text-gray-500">Loading students...</p>;
        }

        const students = studentsByAssignment[row.id] ?? [];
        if (students.length === 0) {
            return <p className="text-sm text-gray-500">No students under this teacher assignment.</p>;
        }

        return (
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Students under this teacher</p>
                <div className="overflow-x-auto border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Student</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Grade</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {students.map((studentRow) => (
                                <tr key={studentRow.id}>
                                    <td className="px-4 py-2 text-sm text-gray-700">
                                        {studentRow.enrollment?.student?.last_name}, {studentRow.enrollment?.student?.first_name}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700">
                                        {studentRow.final_grade !== null ? Number(studentRow.final_grade).toFixed(2) : 'INC'}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700">
                                        <StatusBadge status={studentRow.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    function requestFinalize(assignment) {
        setConfirm({
            title: 'Finalize Assignment',
            message: `Finalize ${assignment.course?.course_code} for ${assignment.section?.name}? Teachers cannot edit grades after this.`,
            confirmLabel: 'Finalize',
            onConfirm: () => router.post(route('admin.assignments.finalize', assignment.id), {}, {
                preserveScroll: true,
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    function requestReopen(assignment) {
        setConfirm({
            title: 'Reopen Assignment',
            message: `Reopen ${assignment.course?.course_code} for ${assignment.section?.name}? Teachers will be able to edit grades again.`,
            confirmLabel: 'Reopen',
            onConfirm: () => router.post(route('admin.assignments.reopen', assignment.id), {}, {
                preserveScroll: true,
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    return (
        <AuthenticatedLayout header="Grading Monitor">
            <Head title="Grading Monitor" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel
                        title="Grading Monitor"
                        description="Read-only progress view of teacher grade submissions."
                    >
                        <div className="mb-4 grid grid-cols-1 gap-3 border border-gray-200 p-4 md:grid-cols-5">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">School Year</label>
                                <select
                                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    value={selectedSchoolYear?.id ?? ''}
                                    onChange={(event) => {
                                        const schoolYear = schoolYears.find((item) => item.id === Number(event.target.value));
                                        const firstTerm = schoolYear?.academic_terms?.[0];
                                        applyFilters({ term_id: firstTerm?.id ?? '', section_id: '' });
                                    }}
                                >
                                    {schoolYears.map((schoolYear) => (
                                        <option key={schoolYear.id} value={schoolYear.id}>
                                            S.Y. {schoolYear.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Term</label>
                                <select
                                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    value={filters.term_id ?? ''}
                                    onChange={(event) => applyFilters({ term_id: event.target.value })}
                                >
                                    <option value="">All terms</option>
                                    {termsForSelectedSchoolYear.map((academicTerm) => (
                                        <option key={academicTerm.id} value={academicTerm.id}>
                                            {getSemesterLabel(academicTerm.semester)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Program</label>
                                <select
                                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    value={filters.program_id ?? ''}
                                    onChange={(event) => applyFilters({ program_id: event.target.value, section_id: '' })}
                                >
                                    <option value="">All programs</option>
                                    {programs.map((program) => (
                                        <option key={program.id} value={program.id}>
                                            {program.code}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Teacher</label>
                                <select
                                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    value={filters.teacher_id ?? ''}
                                    onChange={(event) => applyFilters({ teacher_id: event.target.value })}
                                >
                                    <option value="">All teachers</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {buildTeacherName(teacher)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Section</label>
                                <select
                                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    value={filters.section_id ?? ''}
                                    onChange={(event) => applyFilters({ section_id: event.target.value })}
                                >
                                    <option value="">All sections</option>
                                    {sections
                                        .filter((section) => !filters.program_id || String(section.program_id) === String(filters.program_id))
                                        .map((section) => (
                                            <option key={section.id} value={section.id}>
                                                {section.name} - {section.program?.code} {getYearLabel(section.year_level)}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <DataTable
                            columns={columns}
                            rows={assignments.data}
                            pagination={assignments}
                            emptyMessage="No assignments found for the current filters."
                            expandedRowId={expandedAssignmentId}
                            renderExpandedRow={renderExpandedRow}
                            actions={(row) => (
                                <ActionsDropdown items={[
                                    !row.finalized_at && { label: 'Finalize', onClick: () => requestFinalize(row) },
                                    row.finalized_at && { label: 'Reopen', onClick: () => requestReopen(row) },
                                ]} />
                            )}
                        />
                    </PagePanel>
                </div>
            </div>

            <ConfirmModal
                show={confirm !== null}
                title={confirm?.title}
                message={confirm?.message}
                confirmLabel={confirm?.confirmLabel}
                onConfirm={confirm?.onConfirm}
                onClose={() => setConfirm(null)}
            />
        </AuthenticatedLayout>
    );
}
