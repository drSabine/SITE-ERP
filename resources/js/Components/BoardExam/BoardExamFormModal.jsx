import { Modal, InputField, InputLabel, InputError, PrimaryButton, SecondaryButton } from '@/Components/ui';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

const selectClass = 'mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500';

export default function BoardExamFormModal({ show, editTarget, programs = [], months = {}, onClose }) {
    const isEdit = Boolean(editTarget);
    const monthEntries = Object.entries(months); // [['1','January'], ...]
    const currentYear = new Date().getFullYear();

    const { data, setData, post, put, processing, errors, reset } = useForm({
        program_id: programs[0]?.id ?? '',
        exam_name: '',
        exam_year: currentYear,
        exam_month: 3,
        first_takers: 0,
        first_taker_passers: 0,
        retakers: 0,
        retaker_passers: 0,
        remarks: '',
    });

    useEffect(() => {
        if (show && isEdit) {
            setData({
                program_id:          editTarget.program_id ?? '',
                exam_name:           editTarget.exam_name ?? '',
                exam_year:           editTarget.exam_year ?? currentYear,
                exam_month:          editTarget.exam_month ?? 3,
                first_takers:        editTarget.first_takers ?? 0,
                first_taker_passers: editTarget.first_taker_passers ?? 0,
                retakers:            editTarget.retakers ?? 0,
                retaker_passers:     editTarget.retaker_passers ?? 0,
                remarks:             editTarget.remarks ?? '',
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, editTarget?.id]);

    function handleSubmit(event) {
        event.preventDefault();
        if (isEdit) {
            put(route('board-exams.update', editTarget.id), { onSuccess: onClose });
        } else {
            post(route('board-exams.store'), { onSuccess: onClose });
        }
    }

    return (
        <Modal show={show} maxWidth="lg" onClose={onClose} afterLeave={reset}>
            <form onSubmit={handleSubmit} className="p-6">
                <h3 className="text-base font-bold uppercase tracking-wide text-gray-900">
                    {isEdit ? 'Edit Board Exam Record' : 'Record Board Exam Passers'}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                    Enter the headcounts for one exam intake. Pass rates and charts are computed automatically.
                </p>

                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="be-program" value="Program" />
                            <select
                                id="be-program"
                                className={selectClass}
                                value={data.program_id}
                                onChange={event => setData('program_id', Number(event.target.value))}
                                required
                            >
                                {programs.map(program => (
                                    <option key={program.id} value={program.id}>{program.code} · {program.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.program_id} className="mt-1" />
                        </div>

                        <InputField
                            label="Exam Name"
                            id="be-name"
                            value={data.exam_name}
                            onChange={event => setData('exam_name', event.target.value)}
                            error={errors.exam_name}
                            placeholder="Civil Engineer Licensure Exam"
                            maxLength={191}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="be-month" value="Intake Month" />
                            <select
                                id="be-month"
                                className={selectClass}
                                value={data.exam_month}
                                onChange={event => setData('exam_month', Number(event.target.value))}
                                required
                            >
                                {monthEntries.map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            <InputError message={errors.exam_month} className="mt-1" />
                        </div>

                        <InputField
                            label="Year"
                            id="be-year"
                            type="number"
                            min={2000}
                            max={2100}
                            value={data.exam_year}
                            onChange={event => setData('exam_year', Number(event.target.value))}
                            error={errors.exam_year}
                            required
                        />
                    </div>

                    <fieldset className="border border-gray-200 p-4">
                        <legend className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">First-Takers</legend>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Took the exam"
                                id="be-first-takers"
                                type="number"
                                min={0}
                                value={data.first_takers}
                                onChange={event => setData('first_takers', Number(event.target.value))}
                                error={errors.first_takers}
                                required
                            />
                            <InputField
                                label="Passed"
                                id="be-first-passers"
                                type="number"
                                min={0}
                                value={data.first_taker_passers}
                                onChange={event => setData('first_taker_passers', Number(event.target.value))}
                                error={errors.first_taker_passers}
                                required
                            />
                        </div>
                    </fieldset>

                    <fieldset className="border border-gray-200 p-4">
                        <legend className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Retakers</legend>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Took the exam"
                                id="be-retakers"
                                type="number"
                                min={0}
                                value={data.retakers}
                                onChange={event => setData('retakers', Number(event.target.value))}
                                error={errors.retakers}
                                required
                            />
                            <InputField
                                label="Passed"
                                id="be-retaker-passers"
                                type="number"
                                min={0}
                                value={data.retaker_passers}
                                onChange={event => setData('retaker_passers', Number(event.target.value))}
                                error={errors.retaker_passers}
                                required
                            />
                        </div>
                    </fieldset>

                    <div>
                        <InputLabel htmlFor="be-remarks" value="Remarks (optional)" />
                        <textarea
                            id="be-remarks"
                            className={selectClass}
                            rows={2}
                            maxLength={1000}
                            value={data.remarks}
                            onChange={event => setData('remarks', event.target.value)}
                        />
                        <InputError message={errors.remarks} className="mt-1" />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing}>{isEdit ? 'Save Changes' : 'Save Record'}</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
