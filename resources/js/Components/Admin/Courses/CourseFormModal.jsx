import { Modal, InputField, PrimaryButton, SecondaryButton } from '@/Components/ui';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

const SEMESTER_OPTIONS = [
    { value: 'first',  label: '1st Semester' },
    { value: 'second', label: '2nd Semester' },
    { value: 'summer', label: 'Summer' },
];

export default function CourseFormModal({ show, editTarget, programId, onClose }) {
    const isEdit = Boolean(editTarget);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        program_id:    programId,
        course_code:   '',
        title:         '',
        units:         3,
        lec_hours:     3,
        lab_hours:     0,
        year_level:    1,
        semester_type: 'first',
        is_active:     true,
    });

    useEffect(() => {
        if (show && isEdit) {
            setData({
                program_id:    programId,
                course_code:   editTarget.course_code ?? '',
                title:         editTarget.title ?? '',
                units:         editTarget.units ?? 3,
                lec_hours:     editTarget.lec_hours ?? 3,
                lab_hours:     editTarget.lab_hours ?? 0,
                year_level:    editTarget.year_level ?? 1,
                semester_type: editTarget.semester_type ?? 'first',
                is_active:     editTarget.is_active ?? true,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, editTarget?.id]);

    function handleSubmit(event) {
        event.preventDefault();
        if (isEdit) {
            put(route('admin.courses.update', editTarget.id), { onSuccess: onClose });
        } else {
            post(route('admin.courses.store'), { onSuccess: onClose });
        }
    }

    return (
        <Modal show={show} maxWidth="lg" onClose={onClose} afterLeave={reset}>
            <form onSubmit={handleSubmit} className="p-6">
                <h3 className="text-base font-bold uppercase tracking-wide text-gray-900">
                    {isEdit ? 'Edit Course' : 'New Course'}
                </h3>

                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <InputField
                            label="Course Code"
                            id="c-code"
                            value={data.course_code}
                            onChange={event => setData('course_code', event.target.value.toUpperCase())}
                            error={errors.course_code}
                            required
                        />
                        <div className="col-span-2">
                            <InputField
                                label="Course Title"
                                id="c-title"
                                value={data.title}
                                onChange={event => setData('title', event.target.value)}
                                error={errors.title}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <InputField label="Units" id="c-units" type="number" min={1} max={9} value={data.units} onChange={event => setData('units', Number(event.target.value))} error={errors.units} required />
                        <InputField label="Lecture Hours" id="c-lec" type="number" min={0} value={data.lec_hours} onChange={event => setData('lec_hours', Number(event.target.value))} error={errors.lec_hours} required />
                        <InputField label="Lab Hours" id="c-lab" type="number" min={0} value={data.lab_hours} onChange={event => setData('lab_hours', Number(event.target.value))} error={errors.lab_hours} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="c-year" className="block text-sm font-medium text-gray-700">Year Level</label>
                            <select id="c-year" value={data.year_level} onChange={event => setData('year_level', Number(event.target.value))} className="mt-1 block w-full border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm">
                                {[1, 2, 3, 4].map(year => <option key={year} value={year}>Year {year}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="c-sem" className="block text-sm font-medium text-gray-700">Semester</label>
                            <select id="c-sem" value={data.semester_type} onChange={event => setData('semester_type', event.target.value)} className="mt-1 block w-full border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm">
                                {SEMESTER_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {isEdit && (
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={data.is_active} onChange={event => setData('is_active', event.target.checked)} className="border-gray-300 focus:ring-emerald-500 text-emerald-600" />
                            Active course
                        </label>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing}>{isEdit ? 'Save Changes' : 'Add Course'}</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
