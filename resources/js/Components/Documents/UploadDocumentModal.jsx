import { Modal, InputField, PrimaryButton, SecondaryButton, InputLabel, InputError } from '@/Components/ui';
import { useForm } from '@inertiajs/react';

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png';

export default function UploadDocumentModal({ show, categories, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        submission_category_id: '',
        custom_category: '',
        deadline: '',
        file: null,
    });

    const selectedCategory = categories.find(
        category => String(category.id) === String(data.submission_category_id)
    );
    const isOthers = selectedCategory?.code === 'OTHERS';

    function handleSubmit(event) {
        event.preventDefault();
        post(route('documents.store'), {
            forceFormData: true,
            onSuccess: onClose,
        });
    }

    return (
        <Modal show={show} maxWidth="lg" onClose={onClose} afterLeave={reset}>
            <form onSubmit={handleSubmit} className="p-6">
                <h3 className="text-base font-bold uppercase tracking-wide text-gray-900">Upload Document</h3>

                <div className="mt-4 space-y-4">
                    <InputField
                        label="Document Title"
                        id="doc-title"
                        value={data.title}
                        onChange={event => setData('title', event.target.value)}
                        error={errors.title}
                        maxLength={191}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="doc-category" value="Submission Category" />
                            <select
                                id="doc-category"
                                value={data.submission_category_id}
                                onChange={event => setData('submission_category_id', event.target.value)}
                                className="mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={String(category.id)}>{category.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.submission_category_id} className="mt-1" />
                        </div>

                        <InputField
                            label="Deadline (optional)"
                            id="doc-deadline"
                            type="date"
                            value={data.deadline}
                            onChange={event => setData('deadline', event.target.value)}
                            error={errors.deadline}
                        />
                    </div>

                    {isOthers && (
                        <InputField
                            label="Specify Category"
                            id="doc-custom-category"
                            value={data.custom_category}
                            onChange={event => setData('custom_category', event.target.value)}
                            error={errors.custom_category}
                            maxLength={100}
                            placeholder="e.g. Department Memo, Special Audit…"
                            required
                        />
                    )}

                    <div>
                        <InputLabel htmlFor="doc-desc" value="Description (optional)" />
                        <textarea
                            id="doc-desc"
                            rows={3}
                            value={data.description}
                            onChange={event => setData('description', event.target.value)}
                            className="mt-1 block w-full border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        <InputError message={errors.description} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="doc-file" value="File" />
                        <input
                            id="doc-file"
                            type="file"
                            accept={ACCEPT}
                            onChange={event => setData('file', event.target.files[0] ?? null)}
                            className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-widest file:text-white hover:file:bg-emerald-800"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-400">PDF, Word, Excel, PowerPoint or image. Max 10&nbsp;MB.</p>
                        <InputError message={errors.file} className="mt-1" />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing}>Submit Document</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
