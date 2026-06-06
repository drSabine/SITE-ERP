import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ActionsDropdown,
    ConfirmModal,
    DataTable,
    InputError,
    InputLabel,
    PagePanel,
    PrimaryButton,
} from '@/Components/ui';
import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

function buildTeacherName(teacher) {
    const profile = teacher.user_profile;
    if (!profile) return teacher.name;
    return `${profile.last_name}, ${profile.first_name}`;
}

export default function Index({ term, selectedSchoolYear, schoolYears, assignments, sections, teachers, courses }) {
    const [confirm, setConfirm] = useState(null);

    const assignmentForm = useForm({
        teacher_id: '',
        course_id: '',
        academic_term_id: term.id,
        section_id: '',
    });

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

    const assignmentColumns = [
        {
            key: 'section',
            label: 'Section',
            render: (row) => `${row.section?.name ?? '-'} (${row.section?.program?.code ?? '-'} ${getYearLabel(row.section?.year_level)})`,
        },
        {
            key: 'teacher',
            label: 'Teacher',
            render: (row) => buildTeacherName(row.teacher),
        },
        {
            key: 'subject',
            label: 'Subject',
            render: (row) => `${row.course?.course_code ?? '-'} - ${row.course?.title ?? '-'}`,
        },
        {
            key: 'units',
            label: 'Units',
            className: 'text-center text-gray-600',
            headerClass: 'text-center',
            render: (row) => row.course?.units ?? '-',
        },
    ];

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
        visitAssignmentContext({
            school_year_id: schoolYear.id,
            academic_term_id: firstTerm.id,
        });
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
            message: `Remove ${assignment.course?.course_code} from ${assignment.section?.name}?`,
            confirmLabel: 'Remove',
            onConfirm: () => router.delete(route('admin.assignments.destroy', assignment.id), {
                preserveScroll: true,
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    const pageDescription = `${getSemesterLabel(term.semester)} > S.Y. ${term.school_year?.name}`;

    return (
        <AuthenticatedLayout header="Teacher Assignment">
            <Head title="Teacher Assignment" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel title="Teacher Subject Assignment" description={pageDescription}>
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
                                            <option key={schoolYear.id} value={schoolYear.id}>
                                                S.Y. {schoolYear.name}
                                            </option>
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

                        <form onSubmit={submitAssignmentForm} className="grid grid-cols-1 gap-4 border-b border-gray-200 p-4 md:grid-cols-4">
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
                                        <option key={teacher.id} value={teacher.id}>
                                            {buildTeacherName(teacher)}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={assignmentForm.errors.teacher_id} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="assignment_course_id" value="Subject" />
                                <select
                                    id="assignment_course_id"
                                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    value={assignmentForm.data.course_id}
                                    onChange={(event) => assignmentForm.setData('course_id', event.target.value)}
                                    disabled={!assignmentForm.data.section_id}
                                >
                                    <option value="">Select subject</option>
                                    {filteredCourses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.course_code} - {course.title}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={assignmentForm.errors.course_id} className="mt-2" />
                                <InputError message={assignmentForm.errors.academic_term_id} className="mt-2" />
                            </div>

                            <div className="md:col-span-4">
                                <PrimaryButton disabled={assignmentForm.processing}>
                                    Save Assignment
                                </PrimaryButton>
                            </div>
                        </form>

                        <div className="p-4">
                            <DataTable
                                columns={assignmentColumns}
                                rows={assignments.data}
                                pagination={assignments}
                                emptyMessage="No teacher assignments found for this term."
                                actions={(row) => (
                                    <ActionsDropdown items={[
                                        { label: 'Remove', onClick: () => deleteAssignment(row), variant: 'danger' },
                                    ]} />
                                )}
                            />
                        </div>
                    </PagePanel>
                </div>
            </div>

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
