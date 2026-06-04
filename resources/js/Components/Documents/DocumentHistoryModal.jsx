import { Modal, SecondaryButton, StatusBadge } from '@/Components/ui';
import { DownloadIcon } from '@/Components/ui/Icons';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDate } from '@/utils/format';

function formatSize(bytes) {
    if (!bytes) return '';
    const kb = bytes / 1024;
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

export default function DocumentHistoryModal({ show, document, onClose }) {
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState({ files: [], records: [] });

    useEffect(() => {
        if (!show || !document) return;

        const controller = new AbortController();
        setLoading(true);
        axios
            .get(route('documents.history', document.id), { signal: controller.signal })
            .then(response => setHistory(response.data))
            .catch(error => { if (!axios.isCancel(error)) setHistory({ files: [], records: [] }); })
            .finally(() => setLoading(false));

        return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, document?.id]);

    function downloadFile(url) {
        const link = window.document.createElement('a');
        link.href = url;
        window.document.body.appendChild(link);
        link.click();
        link.remove();
    }

    return (
        <Modal show={show} maxWidth="lg" onClose={onClose} afterLeave={() => setHistory({ files: [], records: [] })}>
            <div className="p-6">
                <h3 className="text-base font-bold uppercase tracking-wide text-gray-900">Document History</h3>
                {document && <p className="mt-1 text-sm text-gray-500">{document.title}</p>}

                {loading ? (
                    <p className="mt-6 text-center text-sm text-gray-400">Loading history…</p>
                ) : (
                    <div className="mt-5 space-y-6">
                        <section>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">File Versions</p>
                            <div className="mt-2 divide-y divide-gray-100 border border-gray-200">
                                {history.files.length === 0 ? (
                                    <p className="px-4 py-3 text-sm text-gray-400">No files.</p>
                                ) : history.files.map(file => (
                                    <div key={file.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-800">
                                                v{file.version} · {file.original_name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {formatDate(file.created_at)}
                                                {file.uploaded_by ? ` · ${file.uploaded_by}` : ''}
                                                {file.size ? ` · ${formatSize(file.size)}` : ''}
                                                {file.note ? ` · ${file.note}` : ''}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => downloadFile(file.download_url)}
                                            className="shrink-0 text-emerald-700 hover:text-emerald-900"
                                            title="Download"
                                        >
                                            <DownloadIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Verification Log</p>
                            <div className="mt-2 divide-y divide-gray-100 border border-gray-200">
                                {history.records.length === 0 ? (
                                    <p className="px-4 py-3 text-sm text-gray-400">No verification activity yet.</p>
                                ) : history.records.map(record => (
                                    <div key={record.id} className="px-4 py-2.5">
                                        <div className="flex items-center justify-between gap-4">
                                            <StatusBadge status={record.action} />
                                            <span className="text-xs text-gray-400">
                                                {formatDate(record.created_at)}{record.verified_by ? ` · ${record.verified_by}` : ''}
                                            </span>
                                        </div>
                                        {record.remarks && <p className="mt-1.5 text-sm text-gray-600">{record.remarks}</p>}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
                    <SecondaryButton type="button" onClick={onClose}>Close</SecondaryButton>
                </div>
            </div>
        </Modal>
    );
}
