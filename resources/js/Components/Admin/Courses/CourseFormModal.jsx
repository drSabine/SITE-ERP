import { Modal, InputField, PrimaryButton, SecondaryButton } from '@/Components/ui';
import { ChevronDownIcon, ChevronRightIcon, CloseIcon, SearchIcon } from '@/Components/ui/Icons';
import { useForm, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const SEMESTER_LABELS = { first: '1st Sem', second: '2nd Sem', summer: 'Summer' };

const SEMESTER_OPTIONS = [
    { value: 'first', label: '1st Semester' },
    { value: 'second', label: '2nd Semester' },
    { value: 'summer', label: 'Summer' },
];

const SEMESTER_SORT = { first: 1, second: 2, summer: 3 };

function calculateUnits(lectureHours, labHours) {
    return Number(lectureHours || 0) + Number(labHours || 0);
}

// Show an empty field instead of a leading "0" so typing "1" yields 1, not 01.
function displayHours(value) {
    return value === 0 ? '' : value;
}

function parseHours(value) {
    return value === '' ? 0 : Number(value);
}

const CHIP_TONES = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    teal: 'border-teal-200 bg-teal-50 text-teal-800',
};

function ChipRow({ label, tone, courses, onRemove }) {
    if (courses.length === 0) return null;
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
            {courses.map(course => (
                <span key={course.id} className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs ${CHIP_TONES[tone]}`}>
                    {course.course_code}
                    <button type="button" onClick={() => onRemove(course)} className="hover:opacity-70">
                        <CloseIcon className="h-3 w-3" />
                    </button>
                </span>
            ))}
        </div>
    );
}

function PickerRow({ course, isPrereq, isCoReq, onToggle }) {
    return (
        <li className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs hover:bg-gray-50">
            <span className="min-w-0 truncate">
                <span className="font-mono font-semibold text-emerald-800">{course.course_code}</span>
                <span className="ml-1.5 text-gray-600">{course.title}</span>
                <span className="ml-1.5 text-gray-400">Yr {course.year_level} {SEMESTER_LABELS[course.semester_type] ?? ''}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
                <label className="flex cursor-pointer items-center gap-1 text-[11px] text-gray-500">
                    <input type="checkbox" checked={isPrereq} onChange={() => onToggle(course.id, 'prereq')} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    Pre
                </label>
                <label className="flex cursor-pointer items-center gap-1 text-[11px] text-gray-500">
                    <input type="checkbox" checked={isCoReq} onChange={() => onToggle(course.id, 'co_req')} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    Co
                </label>
            </span>
        </li>
    );
}

export default function CourseFormModal({ show, editTarget, programId, programCode, courses, onClose }) {
    const isEdit = Boolean(editTarget);
    const maxYearLevel = programCode === 'BSCE' ? 5 : 4;

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

    const [openYears, setOpenYears] = useState({});
    const [pickerSearch, setPickerSearch] = useState('');

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

    function resetModalState() {
        reset();
        setOpenYears({});
        setPickerSearch('');
    }

    const eligibleCourses = (courses ?? [])
        .filter(course => course.id !== editTarget?.id)
        .sort((courseA, courseB) => {
            if (courseA.year_level !== courseB.year_level) return courseA.year_level - courseB.year_level;
            return (SEMESTER_SORT[courseA.semester_type] ?? 9) - (SEMESTER_SORT[courseB.semester_type] ?? 9);
        });

    const query = pickerSearch.trim().toLowerCase();
    const searching = query.length > 0;
    const matches = course =>
        course.course_code.toLowerCase().includes(query) || course.title.toLowerCase().includes(query);

    const coursesByYear = eligibleCourses.reduce((groups, course) => {
        const key = course.year_level ?? 0;
        (groups[key] ||= []).push(course);
        return groups;
    }, {});
    const yearKeys = Object.keys(coursesByYear).map(Number).sort((a, b) => a - b);

    function toggleYear(year) {
        setOpenYears(previous => ({ ...previous, [year]: !previous[year] }));
    }

    const courseById = id => eligibleCourses.find(course => course.id === id);
    const selectedPrereqs = data.prerequisite_ids.map(courseById).filter(Boolean);
    const selectedCoReqs = data.co_requisite_ids.map(courseById).filter(Boolean);

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
        <Modal show={show} maxWidth="2xl" onClose={onClose} afterLeave={resetModalState}>
            <form onSubmit={handleSubmit} className="flex max-h-[88vh] flex-col">
                {/* Fixed header */}
                <div className="border-b border-gray-200 px-6 py-4">
                    <h3 className="text-base font-bold uppercase tracking-wide text-gray-900">
                        {isEdit ? 'Edit Course' : 'New Course'}
                    </h3>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    <div className="grid grid-cols-3 gap-4">
                        <InputField
                            label="Course Code"
                            id="c-code"
                            value={data.course_code}
                            onChange={event => setData('course_code', event.target.value.toUpperCase())}
                            error={errors.course_code}
                            placeholder="ITE 101"
                            required
                        />
                        <div className="col-span-2">
                            <InputField
                                label="Course Title"
                                id="c-title"
                                value={data.title}
                                onChange={event => setData('title', event.target.value)}
                                error={errors.title}
                                placeholder="Introduction to Computing"
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
                        />
                        <InputField
                            label="Lecture Hours"
                            id="c-lec"
                            type="number"
                            min={0}
                            placeholder="0"
                            value={displayHours(data.lec_hours)}
                            onChange={event => {
                                const lectureHours = parseHours(event.target.value);
                                setData({ ...data, lec_hours: lectureHours, units: calculateUnits(lectureHours, data.lab_hours) });
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
                            placeholder="0"
                            value={displayHours(data.lab_hours)}
                            onChange={event => {
                                const labHours = parseHours(event.target.value);
                                setData({ ...data, lab_hours: labHours, units: calculateUnits(data.lec_hours, labHours) });
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
                                onChange={event => { setData('year_level', Number(event.target.value)); clearErrors('over_unit_limit'); }}
                                className="mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                {Array.from({ length: maxYearLevel }, (_, index) => index + 1).map(year => (
                                    <option key={year} value={year}>Year {year}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="c-sem" className="block text-sm font-medium text-gray-700">Semester</label>
                            <select
                                id="c-sem"
                                value={data.semester_type}
                                onChange={event => { setData('semester_type', event.target.value); clearErrors('over_unit_limit'); }}
                                className="mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                {SEMESTER_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={`border px-3 py-2 text-xs ${semesterOverLimit ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                        Semester load (Yr {data.year_level}, {SEMESTER_LABELS[data.semester_type]}):&nbsp;
                        <strong>{semesterCurrentTotal} current + {calculatedUnits} this = {semesterProjectedTotal} units</strong>
                        {semesterOverLimit && <span className="ml-1 font-semibold">- exceeds 26-unit guideline</span>}
                    </div>

                    {errors.over_unit_limit && (
                        <div className="border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-sm font-semibold text-amber-800">Unit Limit Warning</p>
                            <p className="mt-0.5 text-xs text-amber-700">{errors.over_unit_limit}</p>
                            <div className="mt-3 flex gap-2">
                                <button type="button" onClick={handleForceUnitsSubmit} className="border border-amber-500 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
                                    Add Anyway
                                </button>
                                <button type="button" onClick={() => clearErrors('over_unit_limit')} className="border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {isEdit && (
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={data.is_active} onChange={event => setData('is_active', event.target.checked)} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                            Active course
                        </label>
                    )}

                    {eligibleCourses.length > 0 && (
                        <div>
                            <p className="mb-2 text-sm font-medium text-gray-700">Prerequisites &amp; Co-requisites</p>

                            {(selectedPrereqs.length > 0 || selectedCoReqs.length > 0) && (
                                <div className="mb-3 space-y-2 border border-gray-200 bg-gray-50 px-3 py-2.5">
                                    <ChipRow label="Pre-req" tone="emerald" courses={selectedPrereqs} onRemove={course => toggleType(course.id, 'prereq')} />
                                    <ChipRow label="Co-req" tone="teal" courses={selectedCoReqs} onRemove={course => toggleType(course.id, 'co_req')} />
                                </div>
                            )}

                            {/* Search */}
                            <div className="relative mb-2">
                                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={pickerSearch}
                                    onChange={event => setPickerSearch(event.target.value)}
                                    placeholder="Search a course to mark as pre/co-requisite..."
                                    className="block w-full rounded border-gray-300 pl-8 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Grouped picker — collapsed by default, auto-opens while searching. Contained height. */}
                            <div className="max-h-64 overflow-y-auto border border-gray-200">
                                {searching ? (() => {
                                    const found = eligibleCourses.filter(matches);
                                    if (found.length === 0) {
                                        return <p className="px-3 py-6 text-center text-xs text-gray-400">No courses match "{pickerSearch}".</p>;
                                    }
                                    return (
                                        <ul className="divide-y divide-gray-100 bg-white">
                                            {found.map(course => (
                                                <PickerRow
                                                    key={course.id}
                                                    course={course}
                                                    isPrereq={data.prerequisite_ids.includes(course.id)}
                                                    isCoReq={data.co_requisite_ids.includes(course.id)}
                                                    onToggle={toggleType}
                                                />
                                            ))}
                                        </ul>
                                    );
                                })() : (
                                    yearKeys.map(year => {
                                        const open = openYears[year];
                                        return (
                                            <div key={year} className="border-b border-gray-200 last:border-b-0">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleYear(year)}
                                                    className="flex w-full items-center justify-between bg-gray-50 px-3 py-2 text-left"
                                                >
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                                        {year ? `Year ${year}` : 'General'}
                                                        <span className="ml-2 font-normal text-gray-400">({coursesByYear[year].length})</span>
                                                    </span>
                                                    {open
                                                        ? <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                                        : <ChevronRightIcon className="h-4 w-4 text-gray-400" />}
                                                </button>
                                                {open && (
                                                    <ul className="divide-y divide-gray-100 bg-white">
                                                        {coursesByYear[year].map(course => (
                                                            <PickerRow
                                                                key={course.id}
                                                                course={course}
                                                                isPrereq={data.prerequisite_ids.includes(course.id)}
                                                                isCoReq={data.co_requisite_ids.includes(course.id)}
                                                                onToggle={toggleType}
                                                            />
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Fixed footer */}
                <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing}>{isEdit ? 'Save Changes' : 'Add Course'}</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
