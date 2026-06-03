import { Modal, InputField, PrimaryButton, SecondaryButton, InputLabel, InputError } from '@/Components/ui';
import { useForm } from '@inertiajs/react';

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png';

export default function UploadVersionModal({ show, document, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        note: '',
    });

    function handleSubmit(event) {
        event.preventDefault();
        if (!document) return;
        post(route('documents.versions.store', document.id), {
            forceFormData: true,
            onSuccess: onClose,
        });
    }

    return (
        <Modal show={show} maxWidth="md" onClose={onClose} afterLeave={reset}>
            <form onSubmit={handleSubmit} className="p-6">
                <h3 className="text-base font-bold uppercase tracking-wide text-gray-900">Upload New Version</h3>
                {document && (
                    <p className="mt-1 text-sm text-gray-500">
                        For <strong className="text-gray-700">{document.title}</strong>. Uploading a new version re-opens it for verification.
                    </p>
                )}

                <div className="mt-4 space-y-4">
                    <div>
                        <InputLabel htmlFor="version-file" value="File" />
                        <input
                            id="version-file"
                            type="file"
                            accept={ACCEPT}
                            onChange={event => setData('file', event.target.files[0] ?? null)}
                            className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-widest file:text-white hover:file:bg-emerald-800"
                            required
                        />
                        <InputError message={errors.file} className="mt-1" />
                    </div>

                    <InputField
                        label="Version Note (optional)"
                        id="version-note"
                        value={data.note}
                        onChange={event => setData('note', event.target.value)}
                        error={errors.note}
                        maxLength={500}
                    />
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing}>Upload Version</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
