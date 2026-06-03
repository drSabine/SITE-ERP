import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, StatusBadge, ConfirmModal, DataTable, PagePanel, ActionsDropdown } from '@/Components/ui';
import {
    DocumentFilters,
    UploadDocumentModal,
    UploadVersionModal,
    DocumentHistoryModal,
} from '@/Components/Documents';
import { formatDate } from '@/utils/format';
import { categoryLabel } from '@/Components/Documents';

export default function Index({ documents, categories, filters }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user.role === 'admin';

    const [search, setSearch] = useState(filters.search ?? '');
    const [showUpload, setShowUpload] = useState(false);
    const [versionTarget, setVersionTarget] = useState(null);
    const [historyTarget, setHistoryTarget] = useState(null);
    const [confirm, setConfirm] = useState(null);

    function applyFilters(overrides = {}) {
        const next = {
            search: filters.search ?? '',
            category: filters.category ?? '',
            status: filters.status ?? '',
            ...overrides,
        };

        Object.keys(next).forEach(key => {
            if (next[key] === '' || next[key] === null) delete next[key];
        });

        router.get(route('documents.index'), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function downloadFile(url) {
        const link = document.createElement('a');
        link.href = url;
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    function requestDelete(documentRow) {
        setConfirm({
            title: 'Delete Document',
            message: <>Delete <strong>{documentRow.title}</strong> and all of its uploaded files? This cannot be undone.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('documents.destroy', documentRow.id), {
                preserveScroll: true,
                onFinish: () => setConfirm(null),
            }),
        });
    }

    const columns = [
        {
            key: 'title',
            label: 'Document',
            render: row => (
                <div>
                    <p className="font-medium text-gray-900">{row.title}</p>
                    {row.latest_file && (
                        <p className="font-mono text-xs text-gray-400">
                            {row.latest_file.original_name} · v{row.latest_file.version}
                        </p>
                    )}
                </div>
            ),
        },
        { key: 'category', label: 'Category', render: row => categoryLabel(row) },
        isAdmin && { key: 'submitter', label: 'Submitted By', render: row => row.submitter?.name ?? '-' },
        { key: 'deadline', label: 'Deadline', render: row => formatDate(row.deadline) },
        { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
    ].filter(Boolean);

    return (
        <AuthenticatedLayout header="Document Submission">
            <Head title="Documents" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel
                        title="Document Submission"
                        description="Upload, categorize, and track institutional document submissions."
                        action={<PrimaryButton onClick={() => setShowUpload(true)}>+ Upload Document</PrimaryButton>}
                    >
                        <DocumentFilters
                            search={search}
                            onSearchChange={event => setSearch(event.target.value)}
                            onSearchSubmit={event => { event.preventDefault(); applyFilters({ search }); }}
                            onClear={() => { setSearch(''); applyFilters({ search: '' }); }}
                            searchActive={Boolean(filters.search)}
                            category={String(filters.category ?? '')}
                            status={String(filters.status ?? '')}
                            categories={categories}
                            onCategoryChange={event => applyFilters({ category: event.target.value })}
                            onStatusChange={event => applyFilters({ status: event.target.value })}
                        />

                        <DataTable
                            columns={columns}
                            rows={documents.data}
                            pagination={documents}
                            emptyMessage="No documents found."
                            actions={row => (
                                <ActionsDropdown items={[
                                    row.latest_file && {
                                        label: 'Download',
                                        onClick: () => downloadFile(route('documents.download', [row.id, row.latest_file.id])),
                                    },
                                    { label: 'Upload New Version', onClick: () => setVersionTarget(row) },
                                    { label: 'View History', onClick: () => setHistoryTarget(row) },
                                    (isAdmin || row.status === 'pending') && {
                                        label: 'Delete',
                                        onClick: () => requestDelete(row),
                                        variant: 'danger',
                                    },
                                ]} />
                            )}
                        />
                    </PagePanel>
                </div>
            </div>

            <UploadDocumentModal show={showUpload} categories={categories} onClose={() => setShowUpload(false)} />
            <UploadVersionModal show={versionTarget !== null} document={versionTarget} onClose={() => setVersionTarget(null)} />
            <DocumentHistoryModal show={historyTarget !== null} document={historyTarget} onClose={() => setHistoryTarget(null)} />

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
