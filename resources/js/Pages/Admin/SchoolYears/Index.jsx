import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDateRange } from '@/utils/format';
import { PrimaryButton, StatusBadge, ConfirmModal, DataTable, PagePanel, ActionsDropdown } from '@/Components/ui';
import { SchoolYearFormModal, TermsPanel, SEMESTER_LABELS } from '@/Components/Admin/SchoolYears';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

function syStatus(sy) {
    if (sy.is_active) return 'active';
    if (sy.status === 'finalized') return 'finalized';
    return 'inactive';
}

export default function Index({ schoolYears }) {
    const [showForm, setShowForm]           = useState(false);
    const [editTarget, setEditTarget]       = useState(null);
    const [expandedSY, setExpandedSY]       = useState(null);
    const [terms, setTerms]                 = useState([]);
    const [loadingTerms, setLoadingTerms]   = useState(false);
    const [confirm, setConfirm]             = useState(null); // { title, message, confirmLabel, onConfirm }

    function openCreate() { setEditTarget(null); setShowForm(true); }
    function openEdit(sy) { setEditTarget(sy); setShowForm(true); }

    function loadTerms(syId) {
        return axios.get(route('admin.academic-terms.index'), { params: { school_year_id: syId } })
            .then(response => setTerms(response.data));
    }

    function toggleExpand(sy) {
        if (expandedSY === sy.id) { setExpandedSY(null); setTerms([]); return; }
        setExpandedSY(sy.id);
        setLoadingTerms(true);
        loadTerms(sy.id).finally(() => setLoadingTerms(false));
    }

    function activateSY(sy) {
        router.post(route('admin.school-years.activate', sy.id));
    }

    function activateTerm(term) {
        router.post(route('admin.academic-terms.activate', term.id), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => loadTerms(expandedSY),
        });
    }

    function addSummerTerm(sy) {
        router.post(route('admin.academic-terms.store', sy.id), { semester: 'summer' }, {
            onSuccess: () => loadTerms(sy.id),
        });
    }

    function requestFinalizeSY(sy) {
        setConfirm({
            title: 'Finalize School Year',
            message: <>Lock <strong>{sy.name}</strong> and mark it finalized. No further changes allowed.</>,
            confirmLabel: 'Finalize School Year',
            onConfirm: () => router.post(route('admin.school-years.finalize', sy.id), {}, {
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    function requestDeleteSY(sy) {
        setConfirm({
            title: 'Delete School Year',
            message: <>Delete <strong>{sy.name}</strong>? This action cannot be undone.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('admin.school-years.destroy', sy.id), {
                onSuccess: () => setConfirm(null),
            }),
        });
    }

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
