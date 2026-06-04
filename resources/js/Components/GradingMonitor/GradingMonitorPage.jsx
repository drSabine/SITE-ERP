import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ActionsDropdown, ConfirmModal, DataTable, PagePanel, StatusBadge } from '@/Components/ui';
import { getYearLabel } from '@/Components/Coordinator/Shared';
import GradingMonitorFilters, { buildTeacherName } from './GradingMonitorFilters';
import StudentGradeTable from './StudentGradeTable';

export default function GradingMonitorPage({
    assignments,
    filters,
    schoolYears,
    programs,
    teachers,
    sections,
    indexRouteName,
    studentsRouteName,
    canManageFinalization = false,
}) {
    const [confirm, setConfirm] = useState(null);
    const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
    const [studentsByAssignment, setStudentsByAssignment] = useState({});
    const [loadingAssignmentId, setLoadingAssignmentId] = useState(null);

    function applyFilters(overrides = {}) {
        router.get(route(indexRouteName), {
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
        axios.get(route(studentsRouteName, assignmentId))
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

        return <StudentGradeTable students={students} />;
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

    return (
        <AuthenticatedLayout header="Grading Monitor">
            <Head title="Grading Monitor" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel
                        title="Grading Monitor"
                        description="Read-only progress view of teacher grade submissions."
                    >
                        <GradingMonitorFilters
                            filters={filters}
                            schoolYears={schoolYears}
                            programs={programs}
                            teachers={teachers}
                            sections={sections}
                            onApplyFilters={applyFilters}
                        />

                        <DataTable
                            columns={columns}
                            rows={assignments.data}
                            pagination={assignments}
                            emptyMessage="No assignments found for the current filters."
                            expandedRowId={expandedAssignmentId}
                            renderExpandedRow={renderExpandedRow}
                            actions={canManageFinalization ? (row) => (
                                <ActionsDropdown items={[
                                    !row.finalized_at && { label: 'Finalize', onClick: () => requestFinalize(row) },
                                    row.finalized_at && { label: 'Reopen', onClick: () => requestReopen(row) },
                                ]} />
                            ) : undefined}
                        />
                    </PagePanel>
                </div>
            </div>

            {canManageFinalization && (
                <ConfirmModal
                    show={confirm !== null}
                    title={confirm?.title}
                    message={confirm?.message}
                    confirmLabel={confirm?.confirmLabel}
                    onConfirm={confirm?.onConfirm}
                    onClose={() => setConfirm(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
