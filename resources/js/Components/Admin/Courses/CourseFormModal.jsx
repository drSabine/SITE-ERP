import { Modal, InputField, PrimaryButton, SecondaryButton } from '@/Components/ui';
import { useForm, router } from '@inertiajs/react';
import { useEffect } from 'react';

const SEMESTER_OPTIONS = [
    { value: 'first', label: '1st Semester' },
    { value: 'second', label: '2nd Semester' },
    { value: 'summer', label: 'Summer' },
];

const SEMESTER_SORT = { first: 1, second: 2, summer: 3 };

function calculateUnits(lectureHours, labHours) {
    return Number(lectureHours || 0) + Number(labHours || 0);
}

export default function CourseFormModal({ show, editTarget, programId, courses, onClose }) {
    const isEdit = Boolean(editTarget);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        program_id: programId,
        course_code: '',
        title: '',
        units: 3,
        lec_hours: 3,
        lab_hours: 0,
        year_level: 1,
        semester_type: 'first',
        is_active: true,
        prerequisite_ids: [],
        co_requisite_ids: [],
    });

    useEffect(() => {
        if (show && isEdit) {
            setData({
                program_id: programId,
                course_code: editTarget.course_code ?? '',
                title: editTarget.title ?? '',
                units: calculateUnits(editTarget.lec_hours ?? 3, editTarget.lab_hours ?? 0),
                lec_hours: editTarget.lec_hours ?? 3,
                lab_hours: editTarget.lab_hours ?? 0,
                year_level: editTarget.year_level ?? 1,
                semester_type: editTarget.semester_type ?? 'first',
                is_active: editTarget.is_active ?? true,
                prerequisite_ids: (editTarget.prerequisites ?? []).map(prerequisite => prerequisite.id),
                co_requisite_ids: (editTarget.co_requisites ?? []).map(corequisite => corequisite.id),
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, editTarget?.id]);

    const eligibleCourses = (courses ?? [])
        .filter(course => course.id !== editTarget?.id)
        .sort((courseA, courseB) => {
            if (courseA.year_level !== courseB.year_level) {
                return courseA.year_level - courseB.year_level;
            }

            return (SEMESTER_SORT[courseA.semester_type] ?? 9) - (SEMESTER_SORT[courseB.semester_type] ?? 9);
        });

    const semesterCurrentTotal = (courses ?? [])
        .filter(course => course.year_level === data.year_level && course.semester_type === data.semester_type && course.id !== editTarget?.id)
        .reduce((sum, course) => sum + calculateUnits(course.lec_hours, course.lab_hours), 0);

    const calculatedUnits = calculateUnits(data.lec_hours, data.lab_hours);
    const semesterProjectedTotal = semesterCurrentTotal + calculatedUnits;
    const semesterOverLimit = semesterProjectedTotal > 26;

    function toggleType(courseId, type) {
        if (type === 'prereq') {
            const already = data.prerequisite_ids.includes(courseId);
            setData({
                ...data,
                prerequisite_ids: already
                    ? data.prerequisite_ids.filter(id => id !== courseId)
                    : [...data.prerequisite_ids, courseId],
                co_requisite_ids: data.co_requisite_ids.filter(id => id !== courseId),
            });
        } else {
            const already = data.co_requisite_ids.includes(courseId);
            setData({
                ...data,
                co_requisite_ids: already
                    ? data.co_requisite_ids.filter(id => id !== courseId)
                    : [...data.co_requisite_ids, courseId],
                prerequisite_ids: data.prerequisite_ids.filter(id => id !== courseId),
            });
        }
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (isEdit) {
            put(route('admin.courses.update', editTarget.id), { onSuccess: onClose });
        } else {
            post(route('admin.courses.store'), { onSuccess: onClose });
        }
    }

    function handleForceUnitsSubmit() {
        const submitData = { ...data, units: calculatedUnits, force_units: true };

        if (isEdit) {
            router.put(route('admin.courses.update', editTarget.id), submitData, { onSuccess: onClose });
        } else {
            router.post(route('admin.courses.store'), submitData, { onSuccess: onClose });
        }
    }

    return (
        <Modal show={show} maxWidth="2xl" onClose={onClose} afterLeave={reset}>
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
                        <InputField
                            label="Units"
                            id="c-units"
                            type="number"
                            value={calculatedUnits}
                            disabled
                            readOnly
                            error={errors.units}
                            inputClassName="bg-gray-50 text-gray-700"
                            required
                        />
                        <InputField
                            label="Lecture Hours"
                            id="c-lec"
                            type="number"
                            min={0}
                            value={data.lec_hours}
                            onChange={event => {
                                const lectureHours = Number(event.target.value);
                                setData({
                                    ...data,
                                    lec_hours: lectureHours,
                                    units: calculateUnits(lectureHours, data.lab_hours),
                                });
                                clearErrors('over_unit_limit');
                            }}
                            error={errors.lec_hours}
                            required
                        />
                        <InputField
                            label="Lab Hours"
                            id="c-lab"
                            type="number"
                            min={0}
                            value={data.lab_hours}
                            onChange={event => {
                                const labHours = Number(event.target.value);
                                setData({
                                    ...data,
                                    lab_hours: labHours,
                                    units: calculateUnits(data.lec_hours, labHours),
                                });
                                clearErrors('over_unit_limit');
                            }}
                            error={errors.lab_hours}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="c-year" className="block text-sm font-medium text-gray-700">Year Level</label>
                            <select
                                id="c-year"
                                value={data.year_level}
                                onChange={event => {
                                    setData('year_level', Number(event.target.value));
                                    clearErrors('over_unit_limit');
                                }}
                                className="mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                {[1, 2, 3, 4].map(year => (
                                    <option key={year} value={year}>Year {year}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="c-sem" className="block text-sm font-medium text-gray-700">Semester</label>
                            <select
                                id="c-sem"
                                value={data.semester_type}
                                onChange={event => {
                                    setData('semester_type', event.target.value);
                                    clearErrors('over_unit_limit');
                                }}
                                className="mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                {SEMESTER_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={`border px-3 py-2 text-xs ${semesterOverLimit ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                        Semester load (Yr {data.year_level}, {data.semester_type}):&nbsp;
                        <strong>{semesterCurrentTotal} current + {calculatedUnits} this = {semesterProjectedTotal} units</strong>
                        {semesterOverLimit && <span className="ml-1 font-semibold">- exceeds 26-unit guideline</span>}
                    </div>

                    {errors.over_unit_limit && (
                        <div className="border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-sm font-semibold text-amber-800">Unit Limit Warning</p>
                            <p className="mt-0.5 text-xs text-amber-700">{errors.over_unit_limit}</p>
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleForceUnitsSubmit}
                                    className="border border-amber-500 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                                >
                                    Add Anyway
                                </button>
                                <button
                                    type="button"
                                    onClick={() => clearErrors('over_unit_limit')}
                                    className="border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {isEdit && (
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={event => setData('is_active', event.target.checked)}
                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            Active course
                        </label>
                    )}

                    {eligibleCourses.length > 0 && (
                        <div>
                            <p className="mb-1 text-sm font-medium text-gray-700">
                                Prerequisites &amp; Co-requisites
                                {(data.prerequisite_ids.length + data.co_requisite_ids.length) > 0 && (
                                    <span className="ml-2 text-xs text-emerald-600">
                                        ({data.prerequisite_ids.length} pre-req, {data.co_requisite_ids.length} co-req selected)
                                    </span>
                                )}
                            </p>
                            <div className="max-h-48 overflow-y-auto border border-gray-200">
                                <table className="min-w-full text-xs">
                                    <thead className="sticky top-0 bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">Course</th>
                                            <th className="w-20 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500">Pre-req</th>
                                            <th className="w-20 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500">Co-req</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {eligibleCourses.map(course => (
                                            <tr key={course.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-1.5">
                                                    <span className="font-mono font-semibold text-emerald-800">{course.course_code}</span>
                                                    <span className="ml-1 text-gray-600">{course.title}</span>
                                                    <span className="ml-1 text-gray-400">- Yr {course.year_level}</span>
                                                </td>
                                                <td className="px-3 py-1.5 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.prerequisite_ids.includes(course.id)}
                                                        onChange={() => toggleType(course.id, 'prereq')}
                                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                </td>
                                                <td className="px-3 py-1.5 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.co_requisite_ids.includes(course.id)}
                                                        onChange={() => toggleType(course.id, 'co_req')}
                                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
