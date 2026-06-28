import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ConfirmModal,
    DataTable,
    InputError,
    InputLabel,
    Modal,
    PagePanel,
    PrimaryButton,
    SecondaryButton,
    SegmentedTabs,
} from '@/Components/ui';
import { EditIcon, TrashIcon } from '@/Components/ui/Icons';
import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

function buildTeacherName(teacher) {
    const profile = teacher?.user_profile;
    if (!profile) return teacher?.name ?? '-';
    return `${profile.last_name}, ${profile.first_name}`;
}

const VIEW_TABS = [
    { value: 'section', label: 'By Section' },
    { value: 'teacher', label: 'By Teacher' },
];

function sumUnits(items) {
    return items.reduce((total, item) => total + (item.course?.units ?? 0), 0);
}

function groupBySection(assignments) {
    const map = new Map();
    for (const assignment of assignments) {
        const key = assignment.section?.id ?? 'none';
        if (!map.has(key)) map.set(key, { section: assignment.section, items: [] });
        map.get(key).items.push(assignment);
    }
    return [...map.values()].sort((a, b) => {
        const codeA = a.section?.program?.code ?? '';
        const codeB = b.section?.program?.code ?? '';
        if (codeA !== codeB) return codeA.localeCompare(codeB);
        if ((a.section?.year_level ?? 0) !== (b.section?.year_level ?? 0)) {
            return (a.section?.year_level ?? 0) - (b.section?.year_level ?? 0);
        }
        return (a.section?.name ?? '').localeCompare(b.section?.name ?? '');
    });
}

export default function Index({ term, selectedSchoolYear, schoolYears, assignments, sections, teachers, courses }) {
    const [confirm, setConfirm] = useState(null);
    const [view, setView] = useState('section');
    const [teacherFilterId, setTeacherFilterId] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    const assignmentForm = useForm({
        teacher_id: '',
        course_id: '',
        academic_term_id: term.id,
        section_id: '',
    });

    const editForm = useForm({ teacher_id: '', course_id: '' });

    const selectedSchoolYearTerms = selectedSchoolYear?.academic_terms ?? [];
    const selectedTerm = selectedSchoolYearTerms.find((academicTerm) => academicTerm.id === Number(term.id)) ?? term;

    const selectedAssignmentSection = sections.find((section) => section.id === Number(assignmentForm.data.section_id));
    const filteredCourses = (() => {
        if (!selectedAssignmentSection) return [];
        return courses.filter((course) =>
            course.program_id === selectedAssignmentSection.program_id &&
            Number(course.year_level) === Number(selectedAssignmentSection.year_level) &&
            course.semester_type === selectedTerm.semester
        );
    })();

    const sectionGroups = groupBySection(assignments);
    const teacherAssignments = teacherFilterId
        ? assignments.filter((assignment) => String(assignment.teacher?.id) === String(teacherFilterId))
        : [];

    function visitAssignmentContext(overrides = {}) {
        router.get(route('admin.assignments.index'), {
            school_year_id: selectedSchoolYear.id,
            academic_term_id: term.id,
            ...overrides,
        }, { preserveScroll: true });
    }

    function changeSchoolYear(event) {
        const schoolYear = schoolYears.find((item) => item.id === Number(event.target.value));
        const firstTerm = schoolYear?.academic_terms?.[0];
        if (!firstTerm) return;
        assignmentForm.setData('academic_term_id', firstTerm.id);
        visitAssignmentContext({ school_year_id: schoolYear.id, academic_term_id: firstTerm.id });
    }

    function changeTerm(academicTerm) {
        assignmentForm.setData('academic_term_id', academicTerm.id);
        assignmentForm.reset('course_id');
        visitAssignmentContext({ academic_term_id: academicTerm.id });
    }

    function submitAssignmentForm(event) {
        event.preventDefault();
        assignmentForm.post(route('admin.assignments.store'), {
            preserveScroll: true,
            onSuccess: () => assignmentForm.reset('teacher_id', 'course_id', 'section_id'),
        });
    }

    function deleteAssignment(assignment) {
        setConfirm({
            title: 'Remove Assignment',
            message: <>Remove <strong>{assignment.course?.course_code}</strong> from {assignment.section?.name}?</>,
            confirmLabel: 'Remove',
            onConfirm: () => router.delete(route('admin.assignments.destroy', assignment.id), {
                preserveScroll: true,
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    function openEdit(assignment) {
        editForm.clearErrors();
        editForm.setData({
            teacher_id: String(assignment.teacher?.id ?? ''),
            course_id: String(assignment.course?.id ?? ''),
        });
        setEditTarget(assignment);
    }

    function submitEdit(event) {
        event.preventDefault();
        editForm.put(route('admin.assignments.update', editTarget.id), {
            preserveScroll: true,
            onSuccess: () => setEditTarget(null),
        });
    }

    const editSection = editTarget?.section ?? null;
    const editFilteredCourses = editSection
        ? courses.filter((course) =>
            course.program_id === editSection.program_id &&
            Number(course.year_level) === Number(editSection.year_level) &&
            course.semester_type === selectedTerm.semester)
        : [];

    function rowActions(assignment) {
        return (
            <>
                <button type="button" onClick={() => openEdit(assignment)} title="Edit assignment" className="text-emerald-700 hover:text-emerald-900">
                    <EditIcon className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => deleteAssignment(assignment)} title="Remove assignment" className="text-red-500 hover:text-red-700">
                    <TrashIcon className="h-4 w-4" />
                </button>
            </>
        );
    }

    const pageDescription = `${getSemesterLabel(term.semester)} > S.Y. ${term.school_year?.name}`;

    return (
        <AuthenticatedLayout header="Teacher Assignment">
            <Head title="Teacher Assignment" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-6">
                    {/* Context + assign form */}
                    <PagePanel
                        title="Assign Subject to Teacher"
                        description={pageDescription}
                        action={
                            <SecondaryButton onClick={() => setShowForm((value) => !value)}>
                                {showForm ? 'Close' : '+ New Assignment'}
                            </SecondaryButton>
                        }
                    >
                        <div className="border-b border-gray-200 px-4 py-4">
                            <div className="grid gap-4 md:grid-cols-[280px_1fr] md:items-end">
                                <div>
                                    <InputLabel htmlFor="assignment_school_year_id" value="School Year" />
                                    <select
                                        id="assignment_school_year_id"
                                        className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                        value={selectedSchoolYear.id}
                                        onChange={changeSchoolYear}
                                    >
                                        {schoolYears.map((schoolYear) => (
                                            <option key={schoolYear.id} value={schoolYear.id}>S.Y. {schoolYear.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSchoolYearTerms.map((academicTerm) => (
                                        <button
                                            key={academicTerm.id}
                                            type="button"
                                            onClick={() => changeTerm(academicTerm)}
                                            className={`border px-4 py-2 text-xs font-semibold uppercase tracking-widest ${
                                                academicTerm.id === Number(term.id)
                                                    ? 'border-emerald-700 bg-emerald-700 text-white'
                                                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {getSemesterLabel(academicTerm.semester)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {showForm && (
                        <form onSubmit={submitAssignmentForm} className="grid grid-cols-1 gap-4 p-4 md:grid-cols-4">
                            <div>
                                <InputLabel htmlFor="assignment_section_id" value="Section" />
                                <select
                                    id="assignment_section_id"
                                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    value={assignmentForm.data.section_id}
                                    onChange={(event) => {
                                        assignmentForm.setData('section_id', event.target.value);
                                        assignmentForm.setData('course_id', '');
                                    }}
                                >
                                    <option value="">Select section</option>
                                    {sections.map((section) => (
                                        <option key={section.id} value={section.id}>
                                            {section.name} - {section.program?.code} {getYearLabel(section.year_level)}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={assignmentForm.errors.section_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="assignment_teacher_id" value="Teacher" />
                                <select
                                    id="assignment_teacher_id"
                                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    value={assignmentForm.data.teacher_id}
                                    onChange={(event) => assignmentForm.setData('teacher_id', event.target.value)}
                                >
                                    <option value="">Select teacher</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>{buildTeacherName(teacher)}</option>
                                    ))}
                                </select>
                                <InputError message={assignmentForm.errors.teacher_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="assignment_course_id" value="Subject" />
                                <select
                                    id="assignment_course_id"
                                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-50"
                                    value={assignmentForm.data.course_id}
                                    onChange={(event) => assignmentForm.setData('course_id', event.target.value)}
                                    disabled={!assignmentForm.data.section_id}
                                >
                                    <option value="">Select subject</option>
                                    {filteredCourses.map((course) => (
                                        <option key={course.id} value={course.id}>{course.course_code} - {course.title}</option>
                                    ))}
                                </select>
                                <InputError message={assignmentForm.errors.course_id} className="mt-2" />
                                <InputError message={assignmentForm.errors.academic_term_id} className="mt-2" />
                            </div>
                            <div className="flex items-end">
                                <PrimaryButton disabled={assignmentForm.processing} className="w-full justify-center">
                                    Save Assignment
                                </PrimaryButton>
                            </div>
                        </form>
                        )}
                    </PagePanel>

                    {/* Views */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Current Assignments</h2>
                            <SegmentedTabs options={VIEW_TABS} value={view} onChange={setView} />
                        </div>

                        {assignments.length === 0 ? (
                            <div className="border border-gray-200 bg-white px-5 py-16 text-center text-sm text-gray-400 shadow-sm">
                                No teacher assignments for this term yet.
                            </div>
                        ) : view === 'section' ? (
                            <div className="grid gap-4 lg:grid-cols-2">
                                {sectionGroups.map((group) => (
                                    <section key={group.section?.id ?? 'none'} className="border border-gray-200 bg-white shadow-sm">
                                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">{group.section?.name ?? 'Unassigned'}</p>
                                                <p className="text-xs text-gray-500">
                                                    {group.section?.program?.code} · {getYearLabel(group.section?.year_level)}
                                                </p>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-400">{sumUnits(group.items)} units</span>
                                        </div>
                                        <DataTable
                                            compact
                                            columns={[
                                                { key: 'subject', label: 'Subject', render: (row) => `${row.course?.course_code ?? '-'} - ${row.course?.title ?? '-'}`, className: 'text-gray-800' },
                                                { key: 'teacher', label: 'Teacher', render: (row) => buildTeacherName(row.teacher), className: 'text-gray-600' },
                                                { key: 'units', label: 'Units', headerClass: 'text-center', className: 'text-center text-gray-600', render: (row) => row.course?.units ?? '-' },
                                            ]}
                                            rows={group.items}
                                            emptyMessage="No subjects."
                                            actions={rowActions}
                                        />
                                    </section>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-gray-200 bg-white shadow-sm">
                                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="sm:w-80">
                                        <InputLabel htmlFor="teacher_filter" value="Search Teacher" />
                                        <select
                                            id="teacher_filter"
                                            className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                            value={teacherFilterId}
                                            onChange={(event) => setTeacherFilterId(event.target.value)}
                                        >
                                            <option value="">Select a teacher...</option>
                                            {teachers.map((teacher) => (
                                                <option key={teacher.id} value={teacher.id}>{buildTeacherName(teacher)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {teacherFilterId && (
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Load</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {teacherAssignments.length} subject{teacherAssignments.length !== 1 ? 's' : ''}
                                                <span className="ml-2 text-sm font-medium text-gray-400">{sumUnits(teacherAssignments)} units</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {teacherFilterId ? (
                                    <DataTable
                                        compact
                                        columns={[
                                            { key: 'section', label: 'Section', render: (row) => `${row.section?.name ?? '-'} (${row.section?.program?.code ?? '-'} ${getYearLabel(row.section?.year_level)})`, className: 'text-gray-700' },
                                            { key: 'subject', label: 'Subject', render: (row) => `${row.course?.course_code ?? '-'} - ${row.course?.title ?? '-'}`, className: 'text-gray-800' },
                                            { key: 'units', label: 'Units', headerClass: 'text-center', className: 'text-center text-gray-600', render: (row) => row.course?.units ?? '-' },
                                        ]}
                                        rows={teacherAssignments}
                                        emptyMessage="This teacher has no load for this term."
                                        actions={rowActions}
                                    />
                                ) : (
                                    <p className="px-5 py-12 text-center text-sm text-gray-400">Select a teacher to view their load.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal show={editTarget !== null} maxWidth="md" onClose={() => setEditTarget(null)} afterLeave={() => editForm.reset()}>
                <form onSubmit={submitEdit}>
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Edit Assignment</h2>
                        {editTarget && (
                            <p className="mt-0.5 text-sm text-gray-500">
                                {editTarget.section?.name} · {editTarget.section?.program?.code} {getYearLabel(editTarget.section?.year_level)}
                            </p>
                        )}
                    </div>

                    <div className="space-y-4 px-6 py-5">
                        <div>
                            <InputLabel htmlFor="edit_teacher_id" value="Teacher" />
                            <select
                                id="edit_teacher_id"
                                className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                value={editForm.data.teacher_id}
                                onChange={(event) => editForm.setData('teacher_id', event.target.value)}
                            >
                                <option value="">Select teacher</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>{buildTeacherName(teacher)}</option>
                                ))}
                            </select>
                            <InputError message={editForm.errors.teacher_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit_course_id" value="Subject" />
                            <select
                                id="edit_course_id"
                                className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                value={editForm.data.course_id}
                                onChange={(event) => editForm.setData('course_id', event.target.value)}
                            >
                                <option value="">Select subject</option>
                                {editFilteredCourses.map((course) => (
                                    <option key={course.id} value={course.id}>{course.course_code} - {course.title}</option>
                                ))}
                            </select>
                            <InputError message={editForm.errors.course_id} className="mt-2" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                        <SecondaryButton type="button" onClick={() => setEditTarget(null)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={editForm.processing}>Save Changes</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                show={confirm !== null}
                title={confirm?.title}
                message={confirm?.message}
                confirmLabel={confirm?.confirmLabel}
                onConfirm={confirm?.onConfirm}
                onClose={() => setConfirm(null)}
            />
        </AuthenticatedLayout>
    );
}
