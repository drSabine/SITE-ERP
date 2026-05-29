import { Modal, InputField, PrimaryButton, SecondaryButton } from '@/Components/ui';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const ROLE_SELECT_OPTIONS = [
    { value: 'admin', label: 'Administrator', actualRole: 'admin', defaultSpec: '' },
    { value: 'coordinator_it', label: 'IT Coordinator', actualRole: 'coordinator', defaultSpec: 'Information Technology' },
    { value: 'coordinator_eng', label: 'Engineering Coordinator', actualRole: 'coordinator', defaultSpec: 'Engineering' },
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
};

function deriveRoleSelection(role, specialization) {
    if (role === 'coordinator') {
        return specialization === 'Engineering' ? 'coordinator_eng' : 'coordinator_it';
    }

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
    const specialization = profile?.specialization ?? '';

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
        specialization,
    };
}

export default function UserFormModal({ show, editTarget, onClose }) {
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
        const nextRoleSelection = deriveRoleSelection(nextFormData.role, nextFormData.specialization);

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
                degree: ['coordinator', 'teacher'].includes(found.actualRole) ? current.degree : '',
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

    const showsAcademicFields = data.role === 'teacher' || data.role === 'coordinator';

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
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Account</p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Display Name</label>
                            <input
                                type="text"
                                value={data.name}
                                readOnly
                                className="mt-1 block w-full border-gray-200 bg-gray-50 text-sm text-gray-500 shadow-sm"
                                placeholder="Auto-generated from name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="text"
                                value={data.email}
                                readOnly
                                className="mt-1 block w-full border-gray-200 bg-gray-50 text-sm text-gray-500 shadow-sm"
                                placeholder="Auto-generated from name"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label htmlFor="u-role" className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            id="u-role"
                            value={roleSelection}
                            onChange={event => handleRoleSelection(event.target.value)}
                            className="mt-1 block w-full border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        >
                            {ROLE_SELECT_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
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
