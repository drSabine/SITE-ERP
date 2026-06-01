import { useForm } from '@inertiajs/react';
import { Modal, PrimaryButton, SecondaryButton, InputLabel, InputError } from '@/Components/ui';
import { YEAR_LEVELS, getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

export default function AddEnrollmentModal({ show, term, students = [], enrolledStudentIds = [], droppedStudentIds = [], onClose }) {
    const droppedStudentIdSet = new Set(droppedStudentIds);
    const availableStudents = students.filter(student => !enrolledStudentIds.includes(student.id));

    const { data, setData, post, processing, errors, reset } = useForm({
        student_id: '',
        academic_term_id: term?.id ?? '',
        year_level: 1,
        load_curriculum: true,
    });

    function handleStudentChange(event) {
        const studentId = event.target.value;
        const student = availableStudents.find(s => String(s.id) === studentId);
        setData(previous => ({
            ...previous,
            student_id: studentId,
            year_level: student ? student.year_level : previous.year_level,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        post(route('coordinator.enrollments.store'), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    }

    const otherErrors = Object.entries(errors).filter(
        ([field]) => !['student_id', 'year_level'].includes(field)
    );

    return (
        <Modal show={show} maxWidth="md" onClose={onClose} afterLeave={() => reset()}>
            <form onSubmit={handleSubmit}>
                <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">New Evaluation</h2>
                    {term && (
                        <p className="mt-0.5 text-sm text-gray-500">
                            {getSemesterLabel(term.semester)} &gt; S.Y. {term.school_year?.name}
                        </p>
                    )}
                </div>

                <div className="space-y-5 px-6 py-5">
                    <div className="flex items-center justify-between border border-gray-200 bg-gray-50 px-4 py-2.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Academic Term
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                            {term
                                ? `${getSemesterLabel(term.semester)} > S.Y. ${term.school_year?.name}`
                                : 'No term selected'}
                        </span>
                    </div>

                    <div>
                        <InputLabel value="Student" />
                        <select
                            value={data.student_id}
                            onChange={handleStudentChange}
                            className="mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        >
                            <option value="">Select a student...</option>
                            {availableStudents.map(student => (
                                <option key={student.id} value={student.id}>
                                    {student.last_name}, {student.first_name}
                                    {student.program ? ` (${student.program.code})` : ''}
                                    {droppedStudentIdSet.has(student.id) ? ' (Re-evaluate)' : ''}
                                </option>
                            ))}
                        </select>
                        {availableStudents.length === 0 && (
                            <p className="mt-1 text-xs text-gray-400">
                                All active students already have an evaluation record for this term.
                            </p>
                        )}
                        {droppedStudentIds.length > 0 && (
                            <p className="mt-1 text-xs text-amber-600">
                                Students marked <strong>Re-evaluate</strong> were previously dropped from this term.
                            </p>
                        )}
                        {errors.student_id && <InputError message={errors.student_id} className="mt-1" />}
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

                    {otherErrors.length > 0 && (
                        <div className="border border-red-200 bg-red-50 px-4 py-3">
                            {otherErrors.map(([field, message]) => (
                                <p key={field} className="text-sm text-red-700">{message}</p>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" disabled={processing || !data.student_id || !term}>
                        {processing ? 'Processing...' : 'Add Evaluation'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
