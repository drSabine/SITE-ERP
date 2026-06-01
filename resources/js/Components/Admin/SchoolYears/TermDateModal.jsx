import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal, InputField, PrimaryButton, SecondaryButton } from '@/Components/ui';
import { SEMESTER_LABELS } from './utils';

export default function TermDateModal({ show, term, onClose, onSaved }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        start_date: '',
        end_date: '',
    });

    useEffect(() => {
        if (show && term) {
            setData({
                start_date: term.start_date ? String(term.start_date).substring(0, 10) : '',
                end_date:   term.end_date   ? String(term.end_date).substring(0, 10)   : '',
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, term?.id]);

    function handleSubmit(event) {
        event.preventDefault();
        put(route('admin.academic-terms.update', term.id), { onSuccess: onSaved });
    }

    return (
        <Modal show={show} maxWidth="sm" onClose={onClose} afterLeave={reset}>
            <form onSubmit={handleSubmit} className="p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    {term ? `${SEMESTER_LABELS[term.semester]} — Date Range` : 'Set Date Range'}
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-4">
                    <InputField
                        label="Start Date"
                        id="term-start"
                        type="date"
                        value={data.start_date}
                        onChange={event => setData('start_date', event.target.value)}
                        error={errors.start_date}
                    />
                    <InputField
                        label="End Date"
                        id="term-end"
                        type="date"
                        value={data.end_date}
                        onChange={event => setData('end_date', event.target.value)}
                        error={errors.end_date}
                    />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing}>Save Dates</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
