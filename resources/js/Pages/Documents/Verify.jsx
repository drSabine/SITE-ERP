import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, StatusBadge, DataTable, PagePanel, ActionsDropdown } from '@/Components/ui';
import { VerifyDocumentModal, DocumentHistoryModal, categoryLabel } from '@/Components/Documents';
import { formatDate } from '@/utils/format';

export default function Verify({ documents }) {
    const [reviewTarget, setReviewTarget] = useState(null);
    const [historyTarget, setHistoryTarget] = useState(null);

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
        { key: 'deadline', label: 'Deadline', render: row => formatDate(row.deadline) },
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
