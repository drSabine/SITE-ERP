import { useForm } from '@inertiajs/react';
import { Modal, InputField, PrimaryButton, SecondaryButton, InputLabel, InputError } from '@/Components/ui';
import { STUDENT_STATUS_OPTIONS, YEAR_LEVELS, getYearLabel } from '@/Components/Coordinator/Shared';

export default function StudentFormModal({ show, editTarget, programs, onClose }) {
    const isEdit = !!editTarget;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        student_number: editTarget?.student_number ?? '',
        first_name: editTarget?.first_name ?? '',
        middle_name: editTarget?.middle_name ?? '',
        last_name: editTarget?.last_name ?? '',
        suffix: editTarget?.suffix ?? '',
        sex: editTarget?.sex ?? 'Male',
        birthdate: editTarget?.birthdate ? String(editTarget.birthdate).substring(0, 10) : '',
        program_id: editTarget?.program_id ?? '',
        year_level: editTarget?.year_level ?? 1,
        address: editTarget?.address ?? '',
        contact_number: editTarget?.contact_number ?? '',
        email: editTarget?.email ?? '',
        status: editTarget?.status ?? 'active',
        remarks: editTarget?.remarks ?? '',
    });

    function handleSubmit(event) {
        event.preventDefault();

        if (isEdit) {
            put(route('coordinator.students.update', editTarget.id), { onSuccess: () => onClose() });
        } else {
            post(route('coordinator.students.store'), { onSuccess: () => onClose() });
        }
    }

    return (
        <Modal show={show} maxWidth="2xl" onClose={onClose} afterLeave={reset}>
            <form onSubmit={handleSubmit}>
                <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {isEdit ? 'Edit Student' : 'New Student'}
                    </h2>
                </div>

                <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
                    <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Personal Information</p>
                        <div className="grid grid-cols-3 gap-4">
                            <InputField
                                label="Student Number"
                                id="student_number"
                                value={data.student_number}
                                onChange={event => setData('student_number', event.target.value)}
                                error={errors.student_number}
                                disabled={isEdit}
                                placeholder="e.g. 2025-0001"
                            />
                            <InputField
                                label="First Name"
                                id="first_name"
                                value={data.first_name}
                                onChange={event => setData('first_name', event.target.value)}
                                error={errors.first_name}
                            />
                            <InputField
                                label="Middle Name"
                                id="middle_name"
                                value={data.middle_name}
                                onChange={event => setData('middle_name', event.target.value)}
                                error={errors.middle_name}
                            />
                            <InputField
                                label="Last Name"
                                id="last_name"
                                value={data.last_name}
                                onChange={event => setData('last_name', event.target.value)}
                                error={errors.last_name}
                            />
                            <InputField
                                label="Suffix"
                                id="suffix"
                                value={data.suffix}
                                onChange={event => setData('suffix', event.target.value)}
                                error={errors.suffix}
                                placeholder="Jr., III..."
                            />
                            <div>
                                <InputLabel value="Sex" />
                                <select
                                    value={data.sex}
                                    onChange={event => setData('sex', event.target.value)}
                                    className="mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                {errors.sex && <InputError message={errors.sex} className="mt-1" />}
                            </div>
                            <InputField
                                label="Birthdate"
                                id="birthdate"
                                type="date"
                                value={data.birthdate}
                                onChange={event => setData('birthdate', event.target.value)}
                                error={errors.birthdate}
                            />
                        </div>
                    </div>

                    <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Academic Information</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Program" />
                                <select
                                    value={data.program_id}
                                    onChange={event => setData('program_id', event.target.value)}
                                    className="mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                >
                                    <option value="">Select program...</option>
                                    {programs.map(program => (
                                        <option key={program.id} value={program.id}>
                                            {program.code} - {program.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.program_id && <InputError message={errors.program_id} className="mt-1" />}
                            </div>
                            <div>
                                <InputLabel value="Year Level" />
                                <select
                                    value={data.year_level}
                                    onChange={event => setData('year_level', Number(event.target.value))}
                                    className="mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                >
                                    {YEAR_LEVELS.map(level => (
                                        <option key={level} value={level}>{getYearLabel(level)}</option>
                                    ))}
                                </select>
                                {errors.year_level && <InputError message={errors.year_level} className="mt-1" />}
                            </div>
                            {isEdit && (
                                <div>
                                    <InputLabel value="Status" />
                                    <select
                                        value={data.status}
                                        onChange={event => setData('status', event.target.value)}
                                        className="mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    >
                                        {STUDENT_STATUS_OPTIONS.map(item => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>
                                    {errors.status && <InputError message={errors.status} className="mt-1" />}
                                </div>
                            )}
                            <InputField
                                label="Contact Number"
                                id="contact_number"
                                value={data.contact_number}
                                onChange={event => setData('contact_number', event.target.value)}
                                error={errors.contact_number}
                            />
                            <InputField
                                label="Email Address"
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={event => setData('email', event.target.value)}
                                error={errors.email}
                                className="col-span-2"
                            />
                            <InputField
                                label="Address"
                                id="address"
                                value={data.address}
                                onChange={event => setData('address', event.target.value)}
                                error={errors.address}
                                className="col-span-2"
                            />
                            <InputField
                                label="Remarks"
                                id="remarks"
                                value={data.remarks}
                                onChange={event => setData('remarks', event.target.value)}
                                error={errors.remarks}
                                className="col-span-2"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" disabled={processing}>
                        {isEdit ? 'Save Changes' : 'Create Student'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
