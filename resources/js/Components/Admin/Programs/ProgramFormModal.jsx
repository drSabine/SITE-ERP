import { Modal, InputField, PrimaryButton, SecondaryButton } from '@/Components/ui';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export default function ProgramFormModal({ show, editTarget, onClose }) {
    const isEdit = Boolean(editTarget);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: '', name: '', description: '', is_active: true,
    });

    useEffect(() => {
        if (show && isEdit) {
            setData({
                code:        editTarget.code ?? '',
                name:        editTarget.name ?? '',
                description: editTarget.description ?? '',
                is_active:   editTarget.is_active ?? true,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, editTarget?.id]);

    function handleSubmit(event) {
        event.preventDefault();
        if (isEdit) {
            put(route('admin.programs.update', editTarget.id), { onSuccess: onClose });
        } else {
            post(route('admin.programs.store'), { onSuccess: onClose });
        }
    }

    return (
        <Modal show={show} maxWidth="md" onClose={onClose} afterLeave={reset}>
            <form onSubmit={handleSubmit} className="p-6">
                <h3 className="text-base font-bold uppercase tracking-wide text-gray-900">
                    {isEdit ? 'Edit Program' : 'New Program'}
                </h3>

                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <InputField
                            label="Code (e.g. BSIT)"
                            id="prog-code"
                            value={data.code}
                            onChange={event => setData('code', event.target.value.toUpperCase())}
                            error={errors.code}
                            maxLength={20}
                            required
                        />
                        <div className="col-span-2">
                            <InputField
                                label="Full Name"
                                id="prog-name"
                                value={data.name}
                                onChange={event => setData('name', event.target.value)}
                                error={errors.name}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="prog-desc" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            id="prog-desc"
                            rows={3}
                            value={data.description}
                            onChange={event => setData('description', event.target.value)}
                            className="mt-1 block w-full border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                        />
                        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                    </div>

                    {isEdit && (
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={data.is_active} onChange={event => setData('is_active', event.target.checked)} className="border-gray-300 focus:ring-emerald-500 text-emerald-600" />
                            Active program
                        </label>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing}>{isEdit ? 'Save Changes' : 'Create Program'}</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
