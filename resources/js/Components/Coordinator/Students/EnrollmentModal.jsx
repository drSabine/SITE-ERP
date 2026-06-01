import { useForm } from '@inertiajs/react';
import { Modal, PrimaryButton, SecondaryButton, InputLabel, InputError } from '@/Components/ui';
import { YEAR_LEVELS, getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

export default function EnrollmentModal({ show, student, activeSchoolYear, existingEnrollments = [], onClose, onSuccess }) {
    const enrolledTermIds = new Set(existingEnrollments.map(enrollment => enrollment.academic_term_id));
    const terms = activeSchoolYear?.academic_terms ?? [];

    const defaultTermIds = terms
        .filter(term => term.semester !== 'summer' && !enrolledTermIds.has(term.id))
        .map(term => term.id);

    const { data, setData, post, processing, errors, reset } = useForm({
        student_id: student?.id ?? '',
        term_ids: defaultTermIds,
        year_level: student?.year_level ?? 1,
        load_curriculum: true,
    });

    const enrolledYearLevels = new Set(existingEnrollments.map(enrollment => enrollment.year_level).filter(Boolean));
    const hasGap = data.year_level > 1 &&
        Array.from({ length: data.year_level - 1 }, (_, index) => index + 1)
            .some(level => !enrolledYearLevels.has(level));

    const incCourses = existingEnrollments.flatMap(enrollment =>
        (enrollment.enrollment_courses ?? [])
            .filter(enrollmentCourse => enrollmentCourse.status === 'inc')
            .map(enrollmentCourse => ({
                ...enrollmentCourse,
                termSemester: enrollment.academic_term?.semester,
            }))
    );

    function toggleTerm(termId) {
        setData('term_ids', data.term_ids.includes(termId)
            ? data.term_ids.filter(id => id !== termId)
            : [...data.term_ids, termId]
        );
    }

    function handleSubmit(event) {
        event.preventDefault();
        post(route('coordinator.enrollments.store-school-year'), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => onSuccess(),
        });
    }

    const newTermsCount = data.term_ids.filter(termId => !enrolledTermIds.has(termId)).length;
    const isSubmitDisabled = processing || newTermsCount === 0 || data.term_ids.length === 0;
    const submitLabel = processing
        ? 'Processing...'
        : `Evaluate${newTermsCount > 0 ? ` (${newTermsCount} term${newTermsCount !== 1 ? 's' : ''})` : ''}`;

    return (
        <Modal show={show} maxWidth="lg" onClose={onClose} afterLeave={() => reset()}>
            <form onSubmit={handleSubmit}>
                <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">Add Evaluation</h2>
                    {student && (
                        <p className="mt-0.5 text-sm text-gray-500">
                            {student.last_name}, {student.first_name}
                        </p>
                    )}
                </div>

                <div className="space-y-5 px-6 py-5">
                    {!activeSchoolYear && (
                        <div className="border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-sm font-semibold text-amber-800">No Active School Year</p>
                            <p className="mt-0.5 text-xs text-amber-700">
                                The administrator must activate a school year before an evaluation record can be created.
                            </p>
                        </div>
                    )}

                    {activeSchoolYear && (
                        <>
                            <div className="flex items-center justify-between border border-gray-200 bg-gray-50 px-4 py-2.5">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">School Year</span>
                                <span className="text-sm font-semibold text-gray-800">S.Y. {activeSchoolYear.name}</span>
                            </div>

                            {student?.program && (
                                <div className="flex items-center justify-between border border-gray-200 bg-gray-50 px-4 py-2.5">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Program</span>
                                    <span className="text-sm font-semibold text-gray-800">{student.program.code}</span>
                                </div>
                            )}

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
                                <InputLabel value="Semesters" />
                                <div className="mt-2 space-y-2 border border-gray-200 px-4 py-3">
                                    {terms.length === 0 ? (
                                        <p className="text-sm text-gray-400">No terms configured for this school year.</p>
                                    ) : (
                                        terms.map(term => {
                                            const alreadyEnrolled = enrolledTermIds.has(term.id);
                                            const isChecked = data.term_ids.includes(term.id);

                                            return (
                                                <label
                                                    key={term.id}
                                                    className={`flex items-center justify-between gap-3 ${alreadyEnrolled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={alreadyEnrolled || isChecked}
                                                            disabled={alreadyEnrolled}
                                                            onChange={() => !alreadyEnrolled && toggleTerm(term.id)}
                                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                        <span className="text-sm text-gray-800">
                                                            {getSemesterLabel(term.semester)}
                                                            {term.is_active && (
                                                                <span className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600">Active</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    {alreadyEnrolled && (
                                                        <span className="text-xs text-gray-400">Already evaluated</span>
                                                    )}
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                                {errors.term_ids && <InputError message={errors.term_ids} className="mt-1" />}
                            </div>
                        </>
                    )}

                    {Object.entries(errors)
                        .filter(([field]) => !['year_level', 'term_ids'].includes(field))
                        .length > 0 && (
                        <div className="border border-red-200 bg-red-50 px-4 py-3">
                            {Object.entries(errors)
                                .filter(([field]) => !['year_level', 'term_ids'].includes(field))
                                .map(([field, message]) => (
                                    <p key={field} className="text-sm text-red-700">{message}</p>
                                ))}
                        </div>
                    )}

                    {hasGap && activeSchoolYear && (
                        <div className="border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-sm font-semibold text-amber-800">Year Level Gap</p>
                            <p className="mt-0.5 text-xs text-amber-700">
                                No prior year level record found. Normal for transferees and incoming students.
                            </p>
                        </div>
                    )}

                    {incCourses.length > 0 && (
                        <div className="border border-orange-200 bg-orange-50 px-4 py-3">
                            <p className="text-sm font-semibold text-orange-800">
                                {incCourses.length} Outstanding INC {incCourses.length === 1 ? 'Course' : 'Courses'}
                            </p>
                            <ul className="mt-1 space-y-0.5">
                                {incCourses.map(enrollmentCourse => (
                                    <li key={enrollmentCourse.id} className="text-xs text-orange-700">
                                        {enrollmentCourse.course?.course_code} &gt; {enrollmentCourse.course?.title}
                                        {enrollmentCourse.termSemester && (
                                            <span className="ml-1 text-orange-500">({getSemesterLabel(enrollmentCourse.termSemester)})</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {activeSchoolYear && (
                        <label className="flex cursor-pointer items-start gap-2">
                            <input
                                type="checkbox"
                                checked={data.load_curriculum}
                                onChange={event => setData('load_curriculum', event.target.checked)}
                                className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-700">
                                <span className="font-medium">Load standard curriculum</span>
                                <span className="block text-xs text-gray-500">
                                    Auto-populates courses based on program and year level.
                                </span>
                            </span>
                        </label>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" disabled={isSubmitDisabled || !activeSchoolYear}>
                        {submitLabel}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
