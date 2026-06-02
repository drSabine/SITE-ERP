import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, PagePanel, StatusBadge } from '@/Components/ui';
import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

export default function Index({ activeTerm, assignments = [] }) {
    const columns = [
        {
            key: 'section',
            label: 'Section',
            className: 'font-semibold text-gray-900',
            render: (row) => `${row.section?.name ?? '-'} (${row.section?.program?.code ?? '-'} ${getYearLabel(row.section?.year_level)})`,
        },
        {
            key: 'course',
            label: 'Subject',
            render: (row) => `${row.course?.course_code ?? '-'} - ${row.course?.title ?? '-'}`,
        },
        {
            key: 'units',
            label: 'Units',
            className: 'text-center text-gray-600',
            headerClass: 'text-center',
            render: (row) => row.course?.units ?? '-',
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
    ];

    const termDescription = activeTerm
        ? `${getSemesterLabel(activeTerm.semester)} - Active Term`
        : 'No active academic term';

    return (
        <AuthenticatedLayout header="Grades">
            <Head title="Grades" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel
                        title="My Gradebooks"
                        description={termDescription}
                    >
                        <DataTable
                            columns={columns}
                            rows={assignments}
                            emptyMessage="No section assignments available for the active term."
                            actions={(row) => (
                                <Link
                                    href={route('teacher.grades.show', row.id)}
                                    className="inline-flex items-center border border-transparent bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-emerald-800"
                                >
                                    {row.finalized_at ? 'View Gradebook' : 'Open Gradebook'}
                                </Link>
                            )}
                        />
                    </PagePanel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
