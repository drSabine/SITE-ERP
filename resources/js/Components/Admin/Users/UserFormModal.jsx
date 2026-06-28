import { Modal, InputField, PrimaryButton, SecondaryButton, InputLabel, InputError } from '@/Components/ui';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { YEAR_LEVELS, getYearLabel } from '@/Components/Coordinator/Shared';

const ROLE_SELECT_OPTIONS = [
    { value: 'admin', label: 'Administrator', actualRole: 'admin', defaultSpec: '' },
    { value: 'coordinator_it', label: 'IT Coordinator', actualRole: 'coordinator_it', defaultSpec: 'Information Technology' },
    { value: 'coordinator_eng', label: 'Engineering Coordinator', actualRole: 'coordinator_engineering', defaultSpec: 'Engineering' },
    { value: 'teacher', label: 'Teacher', actualRole: 'teacher', defaultSpec: '' },
    { value: 'student', label: 'Student', actualRole: 'student', defaultSpec: '' },
];

const EMPTY_FORM = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'teacher',
    is_active: true,
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    degree: '',
    specialization: '',
    // student-specific
    program_id: '',
    year_level: 1,
    sex: 'Male',
};

function deriveRoleSelection(role) {
    if (role === 'coordinator_engineering') return 'coordinator_eng';
    if (role === 'coordinator_it') return 'coordinator_it';
    return role ?? 'teacher';
}

function buildDisplayName(firstName, middleName, lastName, suffix) {
    const middle = middleName ? ` ${middleName.charAt(0)}.` : '';
    const suffixLabel = suffix ? ` ${suffix}` : '';
    return `${firstName}${middle} ${lastName}${suffixLabel}`.trim();
}

function buildEmail(firstName, lastName) {
    const clean = string => string.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!firstName && !lastName) return '';
    return `${clean(firstName)}.${clean(lastName)}@site.spup`;
}

function buildFormData(editTarget) {
    if (!editTarget) return { ...EMPTY_FORM };

    const profile = editTarget.user_profile;
    const student = editTarget.student;

    return {
        name: editTarget.name ?? '',
        email: editTarget.email ?? '',
        password: '',
        password_confirmation: '',
        role: editTarget.role ?? 'teacher',
        is_active: editTarget.is_active ?? true,
        first_name: profile?.first_name ?? '',
        middle_name: profile?.middle_name ?? '',
        last_name: profile?.last_name ?? '',
        suffix: profile?.suffix ?? '',
        degree: profile?.degree ?? '',
        specialization: profile?.specialization ?? '',
        // student-specific
        program_id: student?.program_id ?? '',
        year_level: student?.year_level ?? 1,
        sex: student?.sex ?? 'Male',
    };
}

export default function UserFormModal({ show, editTarget, programs = [], onClose }) {
    const isEdit = Boolean(editTarget);
    const { data, setData, post, put, processing, errors, reset } = useForm(EMPTY_FORM);
    const [roleSelection, setRoleSelection] = useState('teacher');
    const [showPasswordFields, setShowPasswordFields] = useState(false);

    function resetModalState() {
        reset();
        setRoleSelection('teacher');
        setShowPasswordFields(false);
    }

    useEffect(() => {
        if (!show) return;

        const nextFormData = buildFormData(editTarget);
        const nextRoleSelection = deriveRoleSelection(nextFormData.role);

        setRoleSelection(nextRoleSelection);
        setShowPasswordFields(false);
        setData(() => nextFormData);
    }, [show, editTarget, setData]);

    function handleNameChange(field, value) {
        const updated = { ...data, [field]: value };
        const generatedName = buildDisplayName(updated.first_name, updated.middle_name, updated.last_name, updated.suffix);
        const generatedEmail = buildEmail(updated.first_name, updated.last_name);
        setData(current => ({ ...current, [field]: value, name: generatedName, email: generatedEmail }));
    }

    function handleRoleSelection(value) {
        setRoleSelection(value);
        const found = ROLE_SELECT_OPTIONS.find(option => option.value === value);

        if (found) {
            setData(current => ({
                ...current,
                role: found.actualRole,
                degree: ['coordinator_it', 'coordinator_engineering', 'teacher'].includes(found.actualRole) ? current.degree : '',
                specialization: found.defaultSpec,
            }));
        }
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (isEdit) {
            put(route('admin.users.update', editTarget.id), { onSuccess: onClose });
            return;
        }

        post(route('admin.users.store'), { onSuccess: onClose });
    }

    const showsAcademicFields = ['teacher', 'coordinator_it', 'coordinator_engineering'].includes(data.role);
    const showsStudentFields  = data.role === 'student';

    return (
        <Modal show={show} maxWidth="lg" onClose={onClose} afterLeave={resetModalState}>
            <form onSubmit={handleSubmit} className="p-6">
                <h3 className="text-base font-bold uppercase tracking-wide text-gray-900">
                    {isEdit ? 'Edit User Account' : 'New User Account'}
                </h3>

                <div className="mt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Personal Information</p>
                    <div className="grid grid-cols-3 gap-4">
                        <InputField label="First Name" id="u-fname" value={data.first_name} onChange={event => handleNameChange('first_name', event.target.value)} error={errors.first_name} required />
                        <InputField label="Middle Name" id="u-mname" value={data.middle_name} onChange={event => handleNameChange('middle_name', event.target.value)} error={errors.middle_name} />
                        <InputField label="Last Name" id="u-lname" value={data.last_name} onChange={event => handleNameChange('last_name', event.target.value)} error={errors.last_name} required />
                    </div>
                    <div className="mt-4">
                        <InputField label="Suffix" id="u-suffix" value={data.suffix} onChange={event => handleNameChange('suffix', event.target.value)} error={errors.suffix} placeholder="Jr., Sr., III" />
                    </div>
                    {showsAcademicFields && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <InputField label="Degree" id="u-degree" value={data.degree} onChange={event => setData('degree', event.target.value)} error={errors.degree} placeholder="MIT, PhD..." />
                            <InputField label="Specialization" id="u-spec" value={data.specialization} onChange={event => setData('specialization', event.target.value)} error={errors.specialization} placeholder="e.g. Networks, Data Science" />
                        </div>
                    )}

                    {showsStudentFields && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Student Record</p>
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
                                            <option key={program.id} value={program.id}>{program.code} &gt; {program.name}</option>
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
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Account</p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Display Name</label>
                            <p className="mt-1 text-sm text-gray-600">{data.name || <span className="text-gray-400 italic">Auto-generated from name</span>}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="mt-1 text-sm text-gray-600">{data.email || <span className="text-gray-400 italic">Auto-generated from name</span>}</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label htmlFor="u-role" className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            id="u-role"
                            value={roleSelection}
                            onChange={event => handleRoleSelection(event.target.value)}
                            disabled={isEdit}
                            className="mt-1 block w-full border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            {ROLE_SELECT_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        {isEdit && (
                            <p className="mt-1 text-xs text-gray-400">Role is locked after creation and cannot be changed.</p>
                        )}
                    </div>

                    {isEdit ? (
                        <>
                            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={data.is_active} onChange={event => setData('is_active', event.target.checked)} className="border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                Active account
                            </label>

                            <div className="mt-4 border-t border-gray-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordFields(current => !current)}
                                    className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
                                >
                                    {showPasswordFields ? 'Hide Password Fields' : 'Change Password'}
                                </button>

                                {showPasswordFields && (
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <InputField label="New Password" id="u-password" type="password" value={data.password} onChange={event => setData('password', event.target.value)} error={errors.password} />
                                        <InputField label="Confirm Password" id="u-password-confirm" type="password" value={data.password_confirmation} onChange={event => setData('password_confirmation', event.target.value)} error={errors.password_confirmation} />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <InputField label="Password" id="u-password" type="password" value={data.password} onChange={event => setData('password', event.target.value)} error={errors.password} required />
                            <InputField label="Confirm Password" id="u-password-confirm" type="password" value={data.password_confirmation} onChange={event => setData('password_confirmation', event.target.value)} error={errors.password_confirmation} required />
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing}>{isEdit ? 'Save Changes' : 'Create Account'}</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
