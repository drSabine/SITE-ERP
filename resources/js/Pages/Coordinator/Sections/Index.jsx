import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    DataTable,
    InputError,
    InputLabel,
    PagePanel,
    PrimaryButton,
    SecondaryButton,
    TextInput,
} from '@/Components/ui';
import { Modal, StatusBadge } from '@/Components/ui';
import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

export default function Index({ term, schoolYears, sections, programs }) {
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);

    const sectionForm = useForm({
        program_id: '',
        year_level: '',
        name: '',
    });

    const bulkForm = useForm({
        academic_term_id: term.id,
        program_id: '',
        year_level: '',
        section_id: '',
        enrollment_ids: [],
    });

    const [previewEnrollments, setPreviewEnrollments] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    const sectionColumns = [
        {
            key: 'name',
            label: 'Section',
            className: 'font-semibold text-gray-900',
            render: (row) => row.name,
        },
        {
            key: 'program',
            label: 'Program',
            render: (row) => row.program?.code ?? '-',
        },
        {
            key: 'year_level',
            label: 'Year Level',
            render: (row) => getYearLabel(row.year_level),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
        },
    ];

    function submitSectionForm(event) {
        event.preventDefault();
        sectionForm.post(route('coordinator.sections.store'), {
            preserveScroll: true,
            onSuccess: () => setShowSectionModal(false),
        });
    }

    function submitBulkForm(event) {
        event.preventDefault();
        bulkForm.post(route('coordinator.sections.bulk-assign-students'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowBulkModal(false);
                setPreviewEnrollments([]);
            },
        });
    }

    function handleBulkProgramChange(event) {
        const programId = event.target.value;
        bulkForm.setData('program_id', programId);
        bulkForm.setData('year_level', '');
        bulkForm.setData('section_id', '');
        bulkForm.setData('enrollment_ids', []);
        setPreviewEnrollments([]);
    }

    function handleBulkYearLevelChange(event) {
        const yearLevel = event.target.value;
        bulkForm.setData('year_level', yearLevel);
        bulkForm.setData('section_id', '');
        bulkForm.setData('enrollment_ids', []);
        setPreviewEnrollments([]);
    }

    function fetchPreviewStudents() {
        if (!bulkForm.data.program_id || !bulkForm.data.year_level || !bulkForm.data.academic_term_id) {
            setPreviewEnrollments([]);
            return;
        }

        setPreviewLoading(true);
        axios.get(route('coordinator.sections.students-preview'), {
            params: {
                academic_term_id: bulkForm.data.academic_term_id,
                program_id: bulkForm.data.program_id,
                year_level: bulkForm.data.year_level,
            },
        })
            .then((response) => {
                setPreviewEnrollments(response.data.enrollments ?? []);
                bulkForm.setData('enrollment_ids', []);
            })
            .catch(() => {
                setPreviewEnrollments([]);
            })
            .finally(() => setPreviewLoading(false));
    }

    function toggleEnrollment(enrollmentId, checked) {
        if (checked) {
            bulkForm.setData('enrollment_ids', [...bulkForm.data.enrollment_ids, enrollmentId]);
            return;
        }

        bulkForm.setData(
            'enrollment_ids',
            bulkForm.data.enrollment_ids.filter((id) => id !== enrollmentId)
        );
    }

    function toggleSelectAllEnrollments(checked) {
        if (checked) {
            bulkForm.setData('enrollment_ids', previewEnrollments.map((enrollment) => enrollment.id));
            return;
        }

        bulkForm.setData('enrollment_ids', []);
    }

    const pageDescription = `${getSemesterLabel(term.semester)} > S.Y. ${term.school_year?.name}`;
    const filteredBulkSections = sections.filter((section) =>
        String(section.program_id) === String(bulkForm.data.program_id) &&
        String(section.year_level) === String(bulkForm.data.year_level)
    );
    const allSelected = previewEnrollments.length > 0 && bulkForm.data.enrollment_ids.length === previewEnrollments.length;

    return (
        <AuthenticatedLayout header="Sections">
            <Head title="Sections" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel
                        title="Section Management"
                        description={pageDescription}
                        action={
                            <div className="flex items-center gap-2">
                                <SecondaryButton onClick={() => setShowSectionModal(true)}>
                                    + New Section
                                </SecondaryButton>
                                <PrimaryButton onClick={() => setShowBulkModal(true)}>
                                    Bulk Assign Students
                                </PrimaryButton>
                            </div>
                        }
                    >
                        <DataTable
                            columns={sectionColumns}
                            rows={sections}
                            emptyMessage="No sections yet."
                        />
                    </PagePanel>
                </div>
            </div>

            <Modal show={showSectionModal} onClose={() => setShowSectionModal(false)} afterLeave={() => sectionForm.reset()}>
                <form onSubmit={submitSectionForm} className="space-y-4 p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Create Section</h2>

                    <div>
                        <InputLabel htmlFor="section_program_id" value="Program" />
                        <select
                            id="section_program_id"
                            className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                            value={sectionForm.data.program_id}
                            onChange={(event) => sectionForm.setData('program_id', event.target.value)}
                        >
                            <option value="">Select program</option>
                            {programs.map((program) => (
                                <option key={program.id} value={program.id}>
                                    {program.code} - {program.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={sectionForm.errors.program_id} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="section_year_level" value="Year Level" />
                        <select
                            id="section_year_level"
                            className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                            value={sectionForm.data.year_level}
                            onChange={(event) => sectionForm.setData('year_level', event.target.value)}
                        >
                            <option value="">Select year level</option>
                            {[1, 2, 3, 4, 5].map((yearLevel) => (
                                <option key={yearLevel} value={yearLevel}>
                                    {getYearLabel(yearLevel)}
                                </option>
                            ))}
                        </select>
                        <InputError message={sectionForm.errors.year_level} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="section_name" value="Section Name" />
                        <TextInput
                            id="section_name"
                            value={sectionForm.data.name}
                            onChange={(event) => sectionForm.setData('name', event.target.value)}
                            className="mt-1 block w-full"
                            placeholder="e.g., BSIT-1A"
                        />
                        <InputError message={sectionForm.errors.name} className="mt-2" />
                    </div>

                    <div className="flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setShowSectionModal(false)}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton disabled={sectionForm.processing}>Save Section</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showBulkModal} onClose={() => setShowBulkModal(false)} afterLeave={() => {
                bulkForm.reset('program_id', 'year_level', 'section_id', 'enrollment_ids');
                setPreviewEnrollments([]);
            }}>
                <form onSubmit={submitBulkForm} className="space-y-4 p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Bulk Assign Students to Section</h2>

                    <div>
                        <InputLabel htmlFor="bulk_term_id" value="Term" />
                        <select
                            id="bulk_term_id"
                            className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                            value={bulkForm.data.academic_term_id}
                            onChange={(event) => bulkForm.setData('academic_term_id', event.target.value)}
                        >
                            {schoolYears.flatMap((schoolYear) =>
                                (schoolYear.academic_terms ?? []).map((academicTerm) => (
                                    <option key={academicTerm.id} value={academicTerm.id}>
                                        S.Y. {schoolYear.name} - {getSemesterLabel(academicTerm.semester)}
                                    </option>
                                ))
                            )}
                        </select>
                        <InputError message={bulkForm.errors.academic_term_id} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="bulk_program_id" value="Program" />
                        <select
                            id="bulk_program_id"
                            className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                            value={bulkForm.data.program_id}
                            onChange={handleBulkProgramChange}
                        >
                            <option value="">Select program</option>
                            {programs.map((program) => (
                                <option key={program.id} value={program.id}>
                                    {program.code} - {program.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={bulkForm.errors.program_id} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="bulk_year_level" value="Year Level" />
                        <select
                            id="bulk_year_level"
                            className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                            value={bulkForm.data.year_level}
                            onChange={handleBulkYearLevelChange}
                            disabled={!bulkForm.data.program_id}
                        >
                            <option value="">Select year level</option>
                            {[1, 2, 3, 4, 5].map((yearLevel) => (
                                <option key={yearLevel} value={yearLevel}>
                                    {getYearLabel(yearLevel)}
                                </option>
                            ))}
                        </select>
                        <InputError message={bulkForm.errors.year_level} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="bulk_section_id" value="Section" />
                        <select
                            id="bulk_section_id"
                            className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                            value={bulkForm.data.section_id}
                            onChange={(event) => bulkForm.setData('section_id', event.target.value)}
                        >
                            <option value="">Select section</option>
                            {filteredBulkSections.map((section) => (
                                <option key={section.id} value={section.id}>
                                    {section.name} - {section.program?.code} {getYearLabel(section.year_level)}
                                </option>
                            ))}
                        </select>
                        <InputError message={bulkForm.errors.section_id} className="mt-2" />
                    </div>

                    <div className="border border-gray-200 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-700">Students to assign</p>
                            <SecondaryButton
                                type="button"
                                onClick={fetchPreviewStudents}
                                disabled={!bulkForm.data.program_id || !bulkForm.data.year_level || previewLoading}
                            >
                                {previewLoading ? 'Loading...' : 'Load Students'}
                            </SecondaryButton>
                        </div>

                        {previewEnrollments.length > 0 && (
                            <label className="mb-2 flex items-center gap-2 border-b border-gray-200 pb-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    checked={allSelected}
                                    onChange={(event) => toggleSelectAllEnrollments(event.target.checked)}
                                />
                                Select all ({previewEnrollments.length})
                            </label>
                        )}

                        <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                            {previewEnrollments.map((enrollment) => (
                                <label key={enrollment.id} className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        checked={bulkForm.data.enrollment_ids.includes(enrollment.id)}
                                        onChange={(event) => toggleEnrollment(enrollment.id, event.target.checked)}
                                    />
                                    <span>
                                        {enrollment.student?.last_name}, {enrollment.student?.first_name}
                                    </span>
                                </label>
                            ))}
                        </div>

                        {!previewLoading && previewEnrollments.length === 0 && (
                            <p className="text-xs text-gray-500">
                                Select term, program, and year level, then click Load Students.
                            </p>
                        )}
                        <InputError message={bulkForm.errors.enrollment_ids} className="mt-2" />
                    </div>

                    <div className="flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setShowBulkModal(false)}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={
                                bulkForm.processing ||
                                !bulkForm.data.section_id ||
                                bulkForm.data.enrollment_ids.length === 0
                            }
                        >
                            Assign Students
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
