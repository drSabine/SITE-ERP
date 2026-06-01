import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Modal, PrimaryButton, SecondaryButton, StatusBadge, InputLabel, InputError, DataTable, ConfirmModal } from '@/Components/ui';
import { MAX_ENROLLMENT_UNITS, getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

export default function CourseManagerModal({ show, student, enrollment, availableCourses, loading = false, onClose, onActionDone }) {
    const [loadingAction, setLoadingAction] = useState(null);
    const [confirm, setConfirm] = useState(null);

    const addForm    = useForm({ enrollment_id: enrollment?.id ?? '', course_id: '' });
    const creditForm = useForm({ enrollment_id: enrollment?.id ?? '', course_id: '' });

    // Sync enrollment_id when enrollment becomes available after async load
    useEffect(() => {
        if (enrollment?.id) {
            if (!addForm.data.enrollment_id)    addForm.setData('enrollment_id', enrollment.id);
            if (!creditForm.data.enrollment_id) creditForm.setData('enrollment_id', enrollment.id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enrollment?.id]);

    const activeCourses = (enrollment?.enrollment_courses ?? []).filter(
        enrollmentCourse => ['active', 'inc'].includes(enrollmentCourse.status)
    );

    const creditedCourses = (enrollment?.enrollment_courses ?? []).filter(
        enrollmentCourse => enrollmentCourse.status === 'credited'
    );

    const droppedCourses = (enrollment?.enrollment_courses ?? []).filter(
        enrollmentCourse => enrollmentCourse.status === 'dropped'
    );

    const currentUnits = activeCourses.reduce(
        (total, enrollmentCourse) => total + (enrollmentCourse.course?.units ?? 0),
        0
    );

    const allUsedCourseIds = new Set(
        (enrollment?.enrollment_courses ?? []).map(enrollmentCourse => enrollmentCourse.course_id)
    );

    const addableCourses    = (availableCourses ?? []).filter(course => !allUsedCourseIds.has(course.id));
    const creditableCourses = addableCourses;

    const selectedAddCourse = addableCourses.find(course => String(course.id) === String(addForm.data.course_id));
    const coReqs            = selectedAddCourse?.co_requisites ?? [];

    const termLabel = enrollment
        ? `${getSemesterLabel(enrollment.academic_term?.semester)} ${enrollment.academic_term?.school_year?.name ?? ''}`
        : 'No term selected';

    function handleLoadCurriculum() {
        setLoadingAction('curriculum');
        router.post(
            route('coordinator.enrollments.load-curriculum', enrollment.id),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => onActionDone(),
                onFinish: () => setLoadingAction(null),
            }
        );
    }

    function handleAddCourse(event) {
        event.preventDefault();
        addForm.post(route('coordinator.enrollment-courses.store'), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                addForm.reset('course_id');
                onActionDone();
            },
        });
    }

    function handleForceAdd() {
        router.post(
            route('coordinator.enrollment-courses.store'),
            { enrollment_id: enrollment?.id, course_id: addForm.data.course_id, force: true },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    addForm.clearErrors();
                    addForm.reset('course_id');
                    onActionDone();
                },
            }
        );
    }

    function handleDropCourse(enrollmentCourseId) {
        const enrollmentCourse = activeCourses.find(ec => ec.id === enrollmentCourseId);
        setConfirm({
            title: 'Drop Course',
            message: <>Drop <strong>{enrollmentCourse?.course?.course_code} &gt; {enrollmentCourse?.course?.title}</strong> from this enrollment? The course can be restored later.</>,
            confirmLabel: 'Drop',
            onConfirm: () => {
                setLoadingAction(`drop-${enrollmentCourseId}`);
                router.delete(route('coordinator.enrollment-courses.destroy', enrollmentCourseId), {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        setConfirm(null);
                        onActionDone();
                    },
                    onFinish: () => setLoadingAction(null),
                });
            },
        });
    }

    function handleRemoveCreditedCourse(enrollmentCourseId) {
        const enrollmentCourse = creditedCourses.find(ec => ec.id === enrollmentCourseId);
        setConfirm({
            title: 'Remove Transfer Credit',
            message: <>Remove the transfer credit for <strong>{enrollmentCourse?.course?.course_code} &gt; {enrollmentCourse?.course?.title}</strong>? The course will no longer satisfy prerequisites.</>,
            confirmLabel: 'Remove',
            onConfirm: () => {
                setLoadingAction(`remove-credit-${enrollmentCourseId}`);
                router.delete(route('coordinator.enrollment-courses.destroy', enrollmentCourseId), {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        setConfirm(null);
                        onActionDone();
                    },
                    onFinish: () => setLoadingAction(null),
                });
            },
        });
    }

    function handleCreditCourse(event) {
        event.preventDefault();
        creditForm.post(route('coordinator.enrollment-courses.credit'), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                creditForm.reset('course_id');
                onActionDone();
            },
        });
    }

    function handleRestoreCourse(enrollmentCourseId) {
        const enrollmentCourse = droppedCourses.find(ec => ec.id === enrollmentCourseId);
        setConfirm({
            title: 'Restore Course',
            message: <>Restore <strong>{enrollmentCourse?.course?.course_code} &gt; {enrollmentCourse?.course?.title}</strong> back to this enrollment?</>,
            confirmLabel: 'Restore',
            onConfirm: () => {
                setLoadingAction(`restore-${enrollmentCourseId}`);
                router.post(route('coordinator.enrollment-courses.restore', enrollmentCourseId), {}, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        setConfirm(null);
                        onActionDone();
                    },
                    onFinish: () => setLoadingAction(null),
                });
            },
        });
    }

    return (
        <Modal show={show} maxWidth="2xl" onClose={onClose} afterLeave={() => { addForm.reset(); creditForm.reset(); }}>
            <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Manage Course Load</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                    {student?.last_name}, {student?.first_name}
                    {' | '}
                    {termLabel}
                    {enrollment?.year_level && (
                        <span className="ml-1 text-gray-400">({getYearLabel(enrollment.year_level)})</span>
                    )}
                </p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
                {loading && (
                    <p className="py-10 text-center text-sm text-gray-400">Loading courses...</p>
                )}
                {!loading && (<>
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold ${currentUnits > MAX_ENROLLMENT_UNITS ? 'text-red-600' : currentUnits >= MAX_ENROLLMENT_UNITS - 2 ? 'text-amber-600' : 'text-gray-700'}`}>
                            {currentUnits} / {MAX_ENROLLMENT_UNITS} units
                        </span>
                        <StatusBadge status={enrollment?.status ?? 'enrolled'} />
                    </div>
                    <button
                        type="button"
                        onClick={handleLoadCurriculum}
                        disabled={loadingAction === 'curriculum'}
                        className="border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                        {loadingAction === 'curriculum' ? 'Loading...' : 'Load Standard Curriculum'}
                    </button>
                </div>

                <DataTable
                    compact
                    columns={[
                        { key: 'code',   label: 'Code',   render: ec => ec.course?.course_code ?? '-', className: 'font-mono text-xs text-gray-600' },
                        { key: 'title',  label: 'Title',  render: ec => ec.course?.title ?? '-',        className: 'text-gray-800' },
                        { key: 'units',  label: 'Units',  headerClass: 'text-center', render: ec => ec.course?.units ?? '-', className: 'text-center text-gray-600' },
                        { key: 'status', label: 'Status', headerClass: 'text-center', render: ec => <StatusBadge status={ec.status} />, className: 'text-center' },
                    ]}
                    rows={activeCourses}
                    emptyMessage="No courses in this enrollment yet."
                    actions={enrollment?.status === 'enrolled' ? enrollmentCourse => (
                        <button
                            type="button"
                            onClick={() => handleDropCourse(enrollmentCourse.id)}
                            disabled={loadingAction === `drop-${enrollmentCourse.id}`}
                            className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
                        >
                            Drop
                        </button>
                    ) : undefined}
                />

                {creditedCourses.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Transfer Credits ({creditedCourses.length})
                        </p>
                        <DataTable
                            compact
                            columns={[
                                { key: 'code',  label: 'Code',  render: ec => ec.course?.course_code ?? '-', className: 'font-mono text-xs text-teal-700' },
                                { key: 'title', label: 'Title', render: ec => ec.course?.title ?? '-',        className: 'text-gray-700' },
                                { key: 'units', label: 'Units', headerClass: 'text-center', render: ec => ec.course?.units ?? '-', className: 'text-center text-gray-600' },
                                { key: 'badge', label: 'Status', headerClass: 'text-center', render: () => <StatusBadge status="credited" />, className: 'text-center' },
                            ]}
                            rows={creditedCourses}
                            emptyMessage=""
                            actions={enrollment?.status === 'enrolled' ? enrollmentCourse => (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveCreditedCourse(enrollmentCourse.id)}
                                    disabled={loadingAction === `remove-credit-${enrollmentCourse.id}`}
                                    className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
                                >
                                    Remove
                                </button>
                            ) : undefined}
                        />
                    </div>
                )}

                {enrollment?.status === 'enrolled' && (
                    <form onSubmit={handleAddCourse} className="mt-4 flex items-end gap-2 border-t border-gray-100 pt-4">
                        <div className="flex-1">
                            <InputLabel value="Add a Course" />
                            <select
                                value={addForm.data.course_id}
                                onChange={event => {
                                    addForm.setData('course_id', event.target.value);
                                    addForm.clearErrors();
                                }}
                                className="mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="">Select course to add...</option>
                                {addableCourses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.course_code} &gt; {course.title} ({course.units} units, Yr {course.year_level} {getSemesterLabel(course.semester_type)})
                                    </option>
                                ))}
                            </select>
                            {coReqs.length > 0 && (
                                <p className="mt-1 text-xs text-teal-600">
                                    Co-req: {coReqs.map(coReq => coReq.course_code).join(', ')}
                                </p>
                            )}
                            {addForm.errors.course_id && (
                                <InputError message={addForm.errors.course_id} className="mt-1" />
                            )}
                            {addForm.errors.prereq_warning && (
                                <div className="mt-3 border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-amber-800">Prerequisite Not Met</p>
                                    <p className="mt-0.5 text-xs text-amber-700">This student has not completed the required prerequisites:</p>
                                    <ul className="mb-3 mt-1 space-y-0.5">
                                        {addForm.errors.prereq_warning.split('; ').map((prerequisite, index) => (
                                            <li key={index} className="text-xs text-amber-700">- {prerequisite}</li>
                                        ))}
                                    </ul>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleForceAdd}
                                            className="border border-amber-500 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                                        >
                                            Add Anyway
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                addForm.clearErrors();
                                                addForm.reset('course_id');
                                            }}
                                            className="border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <PrimaryButton type="submit" disabled={addForm.processing || !addForm.data.course_id}>
                            Add
                        </PrimaryButton>
                    </form>
                )}

                {enrollment?.status === 'enrolled' && (
                    <form onSubmit={handleCreditCourse} className="mt-4 flex items-end gap-2 border-t border-gray-100 pt-4">
                        <div className="flex-1">
                            <InputLabel value="Credit a Course (Transfer Student)" />
                            <p className="mb-1 text-xs text-gray-400">Marks a course as credited; satisfies prerequisites without the student having taken the course here.</p>
                            <select
                                value={creditForm.data.course_id}
                                onChange={event => {
                                    creditForm.setData('course_id', event.target.value);
                                    creditForm.clearErrors();
                                }}
                                className="mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="">Select course to credit...</option>
                                {creditableCourses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.course_code} &gt; {course.title} ({course.units} units)
                                    </option>
                                ))}
                            </select>
                            {creditForm.errors.course_id && (
                                <InputError message={creditForm.errors.course_id} className="mt-1" />
                            )}
                        </div>
                        <PrimaryButton type="submit" disabled={creditForm.processing || !creditForm.data.course_id}>
                            Credit
                        </PrimaryButton>
                    </form>
                )}

                {droppedCourses.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Dropped Courses ({droppedCourses.length})
                        </p>
                        <DataTable
                            compact
                            columns={[
                                { key: 'code',  label: 'Code',  render: ec => ec.course?.course_code ?? '-', className: 'font-mono text-xs text-gray-400' },
                                { key: 'title', label: 'Title', render: ec => ec.course?.title ?? '-',        className: 'text-gray-400' },
                                { key: 'units', label: 'Units', headerClass: 'text-center', render: ec => ec.course?.units ?? '-', className: 'text-center text-gray-400' },
                            ]}
                            rows={droppedCourses}
                            emptyMessage=""
                            actions={enrollment?.status === 'enrolled' ? enrollmentCourse => (
                                <button
                                    type="button"
                                    onClick={() => handleRestoreCourse(enrollmentCourse.id)}
                                    disabled={loadingAction === `restore-${enrollmentCourse.id}`}
                                    className="text-xs font-medium text-emerald-600 hover:text-emerald-800 disabled:opacity-40"
                                >
                                    Restore
                                </button>
                            ) : undefined}
                        />
                    </div>
                )}
                </>)}
            </div>

            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
                <SecondaryButton type="button" onClick={onClose}>Close</SecondaryButton>
            </div>

            <ConfirmModal
                show={confirm !== null}
                title={confirm?.title}
                message={confirm?.message}
                confirmLabel={confirm?.confirmLabel}
                onConfirm={confirm?.onConfirm}
                onClose={() => setConfirm(null)}
            />
        </Modal>
    );
}
