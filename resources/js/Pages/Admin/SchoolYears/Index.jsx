import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDateRange } from '@/utils/format';
import { PrimaryButton, StatusBadge, ConfirmModal, DataTable, PagePanel, ActionsDropdown } from '@/Components/ui';
import { SchoolYearFormModal, TermsPanel } from '@/Components/Admin/SchoolYears';
import { useSchoolYears, syStatus } from './useSchoolYears';

export default function Index({ schoolYears }) {
    const {
        showForm, setShowForm, editTarget,
        expandedSY, terms, loadingTerms,
        confirm, setConfirm,
        openCreate, openEdit, toggleExpand,
        activateSY, activateTerm, addSummerTerm,
        requestFinalizeSY, requestDeleteSY,
    } = useSchoolYears();

    return (
        <AuthenticatedLayout header="School Years">
            <Head title="School Years" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel
                        title="School Years"
                        description="Manage academic years and their semesters."
                        action={<PrimaryButton onClick={openCreate}>+ New School Year</PrimaryButton>}
                    >
                        <DataTable
                            columns={[
                                { key: 'name',                 label: 'Year',     className: 'font-semibold text-gray-900' },
                                { key: 'duration',             label: 'Duration', render: sy => formatDateRange(sy.start_date, sy.end_date), className: 'text-gray-500' },
                                { key: 'status',               label: 'Status',   render: sy => <StatusBadge status={syStatus(sy)} /> },
                                { key: 'academic_terms_count', label: 'Terms',    className: 'text-gray-500' },
                            ]}
                            rows={schoolYears}
                            emptyMessage="No school years yet. Create one to get started."
                            expandedRowId={expandedSY}
                            renderExpandedRow={sy => (
                                loadingTerms
                                    ? <p className="text-sm text-gray-400">Loading...</p>
                                    : <TermsPanel sy={sy} terms={terms} onActivate={activateTerm} onAddSummer={() => addSummerTerm(sy)} />
                            )}
                            actions={sy => (
                                <ActionsDropdown items={[
                                    { label: expandedSY === sy.id ? 'Hide Terms' : 'View Terms', onClick: () => toggleExpand(sy), variant: 'primary' },
                                    sy.status !== 'finalized' && { label: 'Edit', onClick: () => openEdit(sy) },
                                    !sy.is_active && sy.status !== 'finalized' && { label: 'Activate', onClick: () => activateSY(sy), variant: 'primary' },
                                    sy.status !== 'finalized' && { label: 'Finalize', onClick: () => requestFinalizeSY(sy), variant: 'danger' },
                                    !sy.is_active && sy.status !== 'finalized' && !sy.academic_terms_count && { label: 'Delete', onClick: () => requestDeleteSY(sy), variant: 'danger' },
                                ]} />
                            )}
                        />
                    </PagePanel>
                </div>
            </div>

            <SchoolYearFormModal
                show={showForm}
                editTarget={editTarget}
                onClose={() => setShowForm(false)}
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
