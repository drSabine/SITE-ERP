import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, ConfirmModal, DataTable, PagePanel, Pagination, SegmentedTabs, ActionsDropdown } from '@/Components/ui';
import { PassingRateFormModal, PassingRateAnalytics } from '@/Components/Coordinator/PassingRates';
import { usePassingRates, monthName } from './usePassingRates';

const TABS = [
    { value: 'analytics', label: 'Analytics' },
    { value: 'records',   label: 'Records'   },
];

function rateCell(record) {
    const rate = record.total_takers > 0
        ? Math.round((record.passers_count / record.total_takers) * 1000) / 10
        : null;

    if (rate === null) return <span className="text-gray-400">—</span>;

    const color = rate >= 75 ? 'text-emerald-700' : rate >= 50 ? 'text-amber-600' : 'text-red-600';
    return <span className={`font-semibold ${color}`}>{rate}%</span>;
}

export default function Index({ records, programs, analytics }) {
    const {
        activeTab, setActiveTab,
        showForm, setShowForm,
        editTarget,
        confirm, setConfirm,
        openCreate, openEdit,
        requestDelete,
    } = usePassingRates();

    const columns = [
        { key: 'program',      label: 'Program',   render: record => <span className="font-mono text-xs font-semibold text-emerald-800">{record.program?.code}</span> },
        { key: 'period',       label: 'Period',    render: record => `${monthName(record.exam_month)} ${record.exam_year}` },
        { key: 'total_takers', label: 'Takers',    className: 'text-right tabular-nums', render: record => record.total_takers.toLocaleString() },
        { key: 'passers_count', label: 'Passers',  className: 'text-right tabular-nums', render: record => record.passers_count.toLocaleString() },
        { key: 'rate',         label: 'Pass Rate', render: rateCell },
    ];

    return (
        <AuthenticatedLayout header="Passing Rates">
            <Head title="Passing Rates" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel
                        title="Passing Rates"
                        description="Track and analyze board exam passing rates by program."
                        action={activeTab === 'records' && (
                            <PrimaryButton onClick={openCreate}>+ Add Record</PrimaryButton>
                        )}
                    >
                        <SegmentedTabs options={TABS} value={activeTab} onChange={setActiveTab} />

                        <div className="mt-4">
                            {activeTab === 'analytics' && (
                                <PassingRateAnalytics analytics={analytics} />
                            )}

                            {activeTab === 'records' && (
                                <>
                                    <DataTable
                                        columns={columns}
                                        rows={records.data}
                                        emptyMessage="No records yet. Use the Records tab to log your first exam result."
                                        actions={record => (
                                            <ActionsDropdown items={[
                                                { label: 'Edit',   onClick: () => openEdit(record) },
                                                { label: 'Delete', onClick: () => requestDelete(record), variant: 'danger' },
                                            ]} />
                                        )}
                                    />
                                    <Pagination pagination={records} />
                                </>
                            )}
                        </div>
                    </PagePanel>
                </div>
            </div>

            <PassingRateFormModal
                show={showForm}
                editTarget={editTarget}
                onClose={() => setShowForm(false)}
                programs={programs}
            />

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
