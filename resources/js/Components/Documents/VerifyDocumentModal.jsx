import { Modal, PrimaryButton, DangerButton, SecondaryButton, InputLabel, InputError, StatusBadge } from '@/Components/ui';
import { DownloadIcon } from '@/Components/ui/Icons';
import { useForm } from '@inertiajs/react';
import { formatDate } from '@/utils/format';
import { categoryLabel } from './categoryLabel';

export default function VerifyDocumentModal({ show, document, onClose }) {
    const { data, setData, post, processing, errors, transform, reset } = useForm({
        action: 'approve',
        remarks: '',
    });

    function submit(action) {
        if (!document) return;
        transform(current => ({ ...current, action }));
        post(route('documents.verify.store', document.id), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    function downloadLatest() {
        if (!document?.latest_file) return;
        const link = window.document.createElement('a');
        link.href = route('documents.download', [document.id, document.latest_file.id]);
        window.document.body.appendChild(link);
        link.click();
        link.remove();
    }

    return (
        <Modal show={show} maxWidth="lg" onClose={onClose} afterLeave={reset}>
            <div className="p-6">
                <h3 className="text-base font-bold uppercase tracking-wide text-gray-900">Review Submission</h3>

                {document && (
                    <div className="mt-4 space-y-4">
                        <div className="border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-medium text-gray-900">{document.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {categoryLabel(document)} · Submitted by {document.submitter?.name}
                                    </p>
                                    {document.deadline && (
                                        <p className="mt-1 text-xs text-gray-400">Deadline: {formatDate(document.deadline)}</p>
                                    )}
                                </div>
                                <StatusBadge status={document.status} />
                            </div>

                            {document.description && (
                                <p className="mt-3 border-t border-gray-200 pt-3 text-sm text-gray-600">{document.description}</p>
                            )}

                            {document.latest_file && (
                                <button
                                    type="button"
                                    onClick={downloadLatest}
                                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900"
                                >
                                    <DownloadIcon className="h-4 w-4" />
                                    {document.latest_file.original_name} (v{document.latest_file.version})
                                </button>
                            )}
                        </div>

                        <div>
                            <InputLabel htmlFor="verify-remarks" value="Remarks (required when rejecting)" />
                            <textarea
                                id="verify-remarks"
                                rows={3}
                                value={data.remarks}
                                onChange={event => setData('remarks', event.target.value)}
                                className="mt-1 block w-full border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                placeholder="Add a comment for the submitter…"
                            />
                            <InputError message={errors.remarks} className="mt-1" />
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <DangerButton type="button" disabled={processing} onClick={() => submit('reject')}>Reject</DangerButton>
                    <PrimaryButton type="button" disabled={processing} onClick={() => submit('approve')}>Approve</PrimaryButton>
                </div>
            </div>
        </Modal>
    );
}
