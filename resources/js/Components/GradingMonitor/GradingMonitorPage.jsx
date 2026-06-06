import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, PagePanel, Pagination, StatusBadge } from '@/Components/ui';
import { getYearLabel } from '@/Components/Coordinator/Shared';
import GradingMonitorFilters, { buildTeacherName } from './GradingMonitorFilters';
import StudentGradeTable from './StudentGradeTable';

function groupAssignmentsByTeacher(assignments) {
    return assignments.reduce((groups, assignment) => {
        const teacherKey = assignment.teacher?.id ?? `unassigned-${assignment.id}`;
        const existingGroup = groups.find((group) => group.teacherKey === teacherKey);

        if (existingGroup) {
            existingGroup.assignments.push(assignment);
            return groups;
        }

        groups.push({
            teacherKey,
            teacher: assignment.teacher,
            assignments: [assignment],
        });

        return groups;
    }, []);
}

function summarizeTeacherLoad(assignments) {
    return assignments.reduce((summary, assignment) => {
        const metrics = assignment.grading_metrics ?? {};
        return {
            totalStudents: summary.totalStudents + Number(metrics.total_students ?? 0),
            gradedCount:   summary.gradedCount   + Number(metrics.graded_count   ?? 0),
            pendingCount:  summary.pendingCount  + Number(metrics.pending_count  ?? 0),
            incCount:      summary.incCount      + Number(metrics.inc_count      ?? 0),
            failedCount:   summary.failedCount   + Number(metrics.failed_count   ?? 0),
            droppedCount:  summary.droppedCount  + Number(metrics.dropped_count  ?? 0),
        };
    }, {
        totalStudents: 0,
        gradedCount:   0,
        pendingCount:  0,
        incCount:      0,
        failedCount:   0,
        droppedCount:  0,
    });
}

export default function GradingMonitorPage({
    assignments,
    filters,
    schoolYears,
    programs,
    teachers,
    sections,
    indexRouteName,
    studentsRouteName,
}) {
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

    const columns = [
        {
            key: 'subject',
            label: 'Subject Load',
            render: (row) => (
                <div>
                    <p className="font-semibold text-gray-900">{row.course?.course_code ?? '-'}</p>
                    <p className="text-xs text-gray-500">{row.course?.title ?? '-'}</p>
                </div>
            ),
        },
        {
            key: 'section',
            label: 'Section',
            render: (row) => `${row.section?.name ?? '-'} (${row.section?.program?.code ?? '-'} ${getYearLabel(row.section?.year_level)})`,
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
            key: 'flags',
            label: 'Flags',
            render: (row) => {
                const metrics = row.grading_metrics ?? {};
                const incCount     = metrics.inc_count     ?? 0;
                const droppedCount = metrics.dropped_count ?? 0;
                const failedCount  = metrics.failed_count  ?? 0;
                return (
                    <div className="flex flex-wrap gap-1.5">
                        {incCount     > 0 && <StatusBadge status="inc"     label={`${incCount} INC`}     />}
                        {droppedCount > 0 && <StatusBadge status="dropped" label={`${droppedCount} Drop`} />}
                        {failedCount  > 0 && <StatusBadge status="failed"  label={`${failedCount} Failed`} />}
                        {incCount === 0 && droppedCount === 0 && failedCount === 0 && (
                            <span className="text-xs text-gray-400">—</span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'students',
            label: 'Students',
            className: 'text-right',
            headerClass: 'text-right',
            render: (row) => (
                <button
                    type="button"
                    className="border border-emerald-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-700 hover:bg-emerald-50"
                    onClick={() => toggleAssignmentStudents(row.id)}
                >
                    {expandedAssignmentId === row.id ? 'Hide' : 'View'}
                </button>
            ),
        },
    ];

    const teacherGroups = groupAssignmentsByTeacher(assignments.data ?? []);

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

                        <div className="space-y-4 p-4 pt-0">
                            {teacherGroups.length === 0 && (
                                <div className="border border-gray-200 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
                                    No assignments found for the current filters.
                                </div>
                            )}

                            {teacherGroups.map((teacherGroup) => {
                                const summary = summarizeTeacherLoad(teacherGroup.assignments);
                                const completionRate = summary.totalStudents > 0
                                    ? Math.round((summary.gradedCount / summary.totalStudents) * 100)
                                    : 0;

                                return (
                                    <section key={teacherGroup.teacherKey} className="border border-gray-200 bg-white">
                                        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Teacher</p>
                                                <h3 className="text-base font-semibold text-gray-900">{buildTeacherName(teacherGroup.teacher)}</h3>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 text-sm md:grid-cols-6">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Subjects</p>
                                                    <p className="font-semibold text-gray-900">{teacherGroup.assignments.length}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Students</p>
                                                    <p className="font-semibold text-gray-900">{summary.totalStudents}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Graded</p>
                                                    <p className="font-semibold text-gray-900">{completionRate}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pending</p>
                                                    <p className="font-semibold text-gray-900">{summary.pendingCount}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">INC</p>
                                                    <p className={`font-semibold ${summary.incCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{summary.incCount}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Dropped</p>
                                                    <p className={`font-semibold ${summary.droppedCount > 0 ? 'text-gray-600' : 'text-gray-900'}`}>{summary.droppedCount}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <DataTable
                                            compact
                                            columns={columns}
                                            rows={teacherGroup.assignments}
                                            emptyMessage="No subject loads for this teacher."
                                            expandedRowId={expandedAssignmentId}
                                            renderExpandedRow={renderExpandedRow}
                                        />
                                    </section>
                                );
                            })}
                        </div>

                        <Pagination pagination={assignments} />
                    </PagePanel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
