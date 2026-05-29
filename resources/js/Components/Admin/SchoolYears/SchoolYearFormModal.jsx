import { Modal, InputLabel, TextInput, InputError, PrimaryButton, SecondaryButton } from '@/Components/ui';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export default function SchoolYearFormModal({ show, editTarget, onClose }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        start_date: '',
        end_date: '',
    });

    useEffect(() => {
        if (show && editTarget) {
            setData({
                name: editTarget.name,
                start_date: editTarget.start_date ?? '',
                end_date: editTarget.end_date ?? '',
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, editTarget?.id]);

    function handleSubmit(event) {
        event.preventDefault();
        if (editTarget) {
            put(route('admin.school-years.update', editTarget.id), { onSuccess: onClose });
        } else {
            post(route('admin.school-years.store'), { onSuccess: onClose });
        }
    }

    return (
        <Modal show={show} maxWidth="md" onClose={onClose} afterLeave={reset}>
            <form onSubmit={handleSubmit} className="p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    {editTarget ? 'Edit School Year' : 'New School Year'}
                </h3>

                <div className="mt-4 space-y-4">
                    <div>
                        <InputLabel htmlFor="sy-name" value="Name (e.g. 2025-2026)" />
                        <TextInput
                            id="sy-name"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={event => setData('name', event.target.value)}
                            maxLength={20}
                            required
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="sy-start" value="Start Date" />
                            <TextInput
                                id="sy-start"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.start_date}
                                onChange={event => setData('start_date', event.target.value)}
                                required
                            />
                            <InputError message={errors.start_date} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="sy-end" value="End Date" />
                            <TextInput
                                id="sy-end"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.end_date}
                                onChange={event => setData('end_date', event.target.value)}
                                required
                            />
                            <InputError message={errors.end_date} className="mt-1" />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing}>
                        {editTarget ? 'Save Changes' : 'Create'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
