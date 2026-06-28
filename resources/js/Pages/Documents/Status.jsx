import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, PagePanel, StatusBadge } from '@/Components/ui';

function StatCard({ label, value, accent }) {
    return (
        <div className="border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <p className={`mt-2 text-3xl font-semibold ${accent}`}>{value}</p>
        </div>
    );
}

function ProgressBar({ verified, total }) {
    const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
    return (
        <div className="w-40">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                <span>{verified}/{total}</span>
                <span className="font-semibold text-gray-700">{pct}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100">
                <div className="h-2 bg-emerald-600" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export default function Status({ summary, categories, isAdmin }) {
    const columns = [
        { key: 'name', label: 'Category', className: 'font-medium text-gray-900' },
        { key: 'progress', label: 'Progress', render: row => <ProgressBar verified={row.verified} total={row.total} /> },
        { key: 'total', label: 'Total', className: 'text-gray-700' },
        { key: 'pending', label: 'Pending', render: row => <StatusBadge status="pending" label={String(row.pending)} /> },
        { key: 'verified', label: 'Verified', render: row => <StatusBadge status="verified" label={String(row.verified)} /> },
        { key: 'rejected', label: 'Rejected', render: row => <StatusBadge status="rejected" label={String(row.rejected)} /> },
        {
            key: 'overdue',
            label: 'Overdue',
            render: row => row.overdue > 0
                ? <StatusBadge status="rejected" label={String(row.overdue)} />
                : <span className="text-xs text-gray-300">—</span>,
        },
    ];

    return (
        <AuthenticatedLayout header="Submission Status">
            <Head title="Submission Status" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-6">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                        <StatCard label="Total" value={summary.total} accent="text-gray-900" />
                        <StatCard label="Pending" value={summary.pending} accent="text-amber-600" />
                        <StatCard label="Verified" value={summary.verified} accent="text-emerald-700" />
                        <StatCard label="Rejected" value={summary.rejected} accent="text-red-600" />
                        <StatCard label="Overdue" value={summary.overdue ?? 0} accent="text-red-600" />
                    </div>

                    <PagePanel
                        title="Submissions by Category"
                        description={isAdmin
                            ? 'Department-wide submission progress across all accreditation bodies.'
                            : 'Your submission progress across all accreditation bodies.'}
                    >
                        <DataTable
                            columns={columns}
                            rows={categories}
                            emptyMessage="No categories configured."
                        />
                    </PagePanel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
