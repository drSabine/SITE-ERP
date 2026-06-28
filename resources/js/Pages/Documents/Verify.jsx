import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, StatusBadge, DataTable, PagePanel, ActionsDropdown, SearchBar } from '@/Components/ui';
import { VerifyDocumentModal, DocumentHistoryModal, categoryLabel } from '@/Components/Documents';
import { formatDate } from '@/utils/format';

const selectClass = 'rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500';

const SORT_OPTIONS = [
    { value: 'category', label: 'Category → Deadline' },
    { value: 'deadline', label: 'Deadline (soonest)' },
    { value: 'recent', label: 'Recently submitted' },
];

function isOverdue(row) {
    return row.deadline && new Date(row.deadline) < new Date();
}

export default function Verify({ documents, categories = [], filters = {} }) {
    const [reviewTarget, setReviewTarget] = useState(null);
    const [historyTarget, setHistoryTarget] = useState(null);
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilters(overrides = {}) {
        router.get(route('documents.verify'), {
            category: filters.category ?? '',
            search,
            sort: filters.sort ?? 'category',
            ...overrides,
        }, { preserveState: true, preserveScroll: true });
    }

    function downloadFile(url) {
        const link = document.createElement('a');
        link.href = url;
        document.body.appendChild(link);
        link.click();
        link.remove();
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
        { key: 'submitter', label: 'Submitted By', render: row => row.submitter?.name ?? '-' },
        {
            key: 'deadline',
            label: 'Deadline',
            render: row => (
                <span className={isOverdue(row) ? 'font-semibold text-red-600' : 'text-gray-700'}>
                    {formatDate(row.deadline)}
                    {isOverdue(row) && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide">Overdue</span>}
                </span>
            ),
        },
        { key: 'created_at', label: 'Submitted', render: row => formatDate(row.created_at) },
        { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
    ];

    return (
        <AuthenticatedLayout header="Verification">
            <Head title="Verification" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel
                        title="Verification Queue"
                        description="Review pending submissions, then approve or reject with remarks."
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
                            <SearchBar
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                onSubmit={event => { event.preventDefault(); applyFilters(); }}
                                onClear={() => { setSearch(''); applyFilters({ search: '' }); }}
                                active={Boolean(filters.search)}
                                placeholder="Search submitter..."
                            />

                            <div className="flex items-center gap-3">
                                <select
                                    value={filters.category ?? ''}
                                    onChange={event => applyFilters({ category: event.target.value })}
                                    className={selectClass}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(option => (
                                        <option key={option.id} value={String(option.id)}>{option.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={filters.sort ?? 'category'}
                                    onChange={event => applyFilters({ sort: event.target.value })}
                                    className={selectClass}
                                >
                                    {SORT_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>Sort: {option.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <DataTable
                            columns={columns}
                            rows={documents.data}
                            pagination={documents}
                            emptyMessage="Nothing to verify. All caught up."
                            actions={row => (
                                <>
                                    <PrimaryButton onClick={() => setReviewTarget(row)}>Review</PrimaryButton>
                                    <ActionsDropdown items={[
                                        row.latest_file && {
                                            label: 'Download',
                                            onClick: () => downloadFile(route('documents.download', [row.id, row.latest_file.id])),
                                        },
                                        { label: 'View History', onClick: () => setHistoryTarget(row) },
                                    ]} />
                                </>
                            )}
                        />
                    </PagePanel>
                </div>
            </div>

            <VerifyDocumentModal show={reviewTarget !== null} document={reviewTarget} onClose={() => setReviewTarget(null)} />
            <DocumentHistoryModal show={historyTarget !== null} document={historyTarget} onClose={() => setHistoryTarget(null)} />
        </AuthenticatedLayout>
    );
}
