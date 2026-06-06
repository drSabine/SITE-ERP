import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, PagePanel, StatusBadge } from '@/Components/ui';
import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

export default function Index({ activeTerm, assignments = [] }) {
    const columns = [
        {
            key: 'subject',
            label: 'Subject',
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
            render: (row) =>
                `${row.section?.name ?? '-'} (${row.section?.program?.code ?? '-'} ${getYearLabel(row.section?.year_level)})`,
        },
        {
            key: 'progress',
            label: 'Progress',
            render: (row) => {
                const metrics = row.grading_metrics ?? {};
                const graded = metrics.graded_count ?? 0;
                const total = metrics.total_students ?? 0;
                const rate = metrics.completion_rate ?? 0;
                return (
                    <span className="tabular-nums text-sm text-gray-700">
                        {graded}/{total}
                        <span className="ml-1 text-xs text-gray-400">({rate}%)</span>
                    </span>
                );
            },
        },
        {
            key: 'issues',
            label: 'Flags',
            render: (row) => {
                const metrics = row.grading_metrics ?? {};
                const incCount = metrics.inc_count ?? 0;
                const droppedCount = metrics.dropped_count ?? 0;
                const failedCount = metrics.failed_count ?? 0;
                return (
                    <div className="flex flex-wrap gap-1.5">
                        {incCount > 0 && <StatusBadge status="inc" label={`${incCount} INC`} />}
                        {droppedCount > 0 && <StatusBadge status="dropped" label={`${droppedCount} Drop`} />}
                        {failedCount > 0 && <StatusBadge status="failed" label={`${failedCount} Failed`} />}
                        {incCount === 0 && droppedCount === 0 && failedCount === 0 && (
                            <span className="text-xs text-gray-400">—</span>
                        )}
                    </div>
                );
            },
        },
    ];

    const termDescription = activeTerm
        ? `${getSemesterLabel(activeTerm.semester)} — Active Term`
        : 'No active academic term';

    return (
        <AuthenticatedLayout header="Grades">
            <Head title="Grades" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel title="My Gradebooks" description={termDescription}>
                        <DataTable
                            columns={columns}
                            rows={assignments}
                            emptyMessage="No section assignments available for the active term."
                            actions={(row) => (
                                <Link
                                    href={route('teacher.grades.show', row.id)}
                                    className="inline-flex items-center border border-transparent bg-emerald-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-emerald-800"
                                >
                                    Open Gradebook
                                </Link>
                            )}
                        />
                    </PagePanel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
