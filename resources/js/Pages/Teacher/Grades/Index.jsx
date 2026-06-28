import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PagePanel, Pagination } from '@/Components/ui';
import { GradebookCard } from '@/Components/Dashboard';
import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

export default function Index({ activeTerm, assignments = { data: [] } }) {
    const termDescription = activeTerm
        ? `${getSemesterLabel(activeTerm.semester)} — Active Term`
        : 'No active academic term';

    const rows = assignments.data ?? [];

    return (
        <AuthenticatedLayout header="Grades">
            <Head title="Grades" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel title="My Gradebooks" description={termDescription}>
                        {rows.length === 0 ? (
                            <div className="px-5 py-16 text-center text-sm text-gray-400">
                                No section assignments available for the active term.
                            </div>
                        ) : (
                            <div className="p-5">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {rows.map(row => (
                                        <GradebookCard
                                            key={row.id}
                                            href={route('teacher.grades.show', row.id)}
                                            code={row.course?.course_code}
                                            title={row.course?.title}
                                            sectionLabel={`${row.section?.name ?? '-'} · ${row.section?.program?.code ?? '-'} ${getYearLabel(row.section?.year_level)}`}
                                            metrics={row.grading_metrics}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        <Pagination pagination={assignments} />
                    </PagePanel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
