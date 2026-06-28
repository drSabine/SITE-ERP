import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    DataTable,
    StatusBadge,
    PrimaryButton,
    SecondaryButton,
    InputLabel,
    InputError,
    ConfirmModal,
} from '@/Components/ui';
import { BackIcon, TrashIcon, SearchIcon, ActivateIcon } from '@/Components/ui/Icons';
import { getMaxUnits, getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

function Panel({ title, hint, action, className = '', children }) {
    return (
        <section className={`border border-gray-200 bg-white shadow-sm ${className}`}>
            {(title || action) && (
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</h2>
                        {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
                    </div>
                    {action}
                </div>
            )}
            <div className="p-5">{children}</div>
        </section>
    );
}

/** Searchable course picker — replaces the giant 100-option <select>. */
function CoursePicker({ courses, selectedId, onSelect, withSemester = false }) {
    const [search, setSearch] = useState('');
    const query = search.trim().toLowerCase();
    const filtered = query
        ? courses.filter(course =>
            course.course_code.toLowerCase().includes(query) ||
            course.title.toLowerCase().includes(query))
        : courses;

    return (
        <div>
            <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Search code or title..."
                    className="block w-full rounded border-gray-300 pl-8 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
            </div>
            <div className="mt-2 max-h-56 divide-y divide-gray-100 overflow-y-auto border border-gray-200">
                {filtered.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-gray-400">No matching courses.</p>
                ) : filtered.map(course => {
                    const selected = String(course.id) === String(selectedId);
                    return (
                        <button
                            key={course.id}
                            type="button"
                            onClick={() => onSelect(selected ? '' : course.id)}
                            className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors ${
                                selected ? 'bg-emerald-50' : 'hover:bg-gray-50'
                            }`}
                        >
                            <span className="min-w-0 truncate">
                                <span className="font-mono font-semibold text-emerald-800">{course.course_code}</span>
                                <span className="ml-1.5 text-gray-600">{course.title}</span>
                            </span>
                            <span className="shrink-0 text-gray-400">
                                {course.units}u
                                {withSemester && ` · Yr ${course.year_level} ${getSemesterLabel(course.semester_type)}`}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

const COURSE_COLUMNS = [
    { key: 'code',  label: 'Code',  render: ec => ec.course?.course_code ?? '-', className: 'font-mono text-xs text-gray-600' },
    { key: 'title', label: 'Title', render: ec => ec.course?.title ?? '-',       className: 'text-gray-800' },
    { key: 'units', label: 'Units', headerClass: 'text-center', render: ec => ec.course?.units ?? '-', className: 'text-center text-gray-600' },
    { key: 'status', label: 'Status', headerClass: 'text-center', render: ec => <StatusBadge status={ec.status} />, className: 'text-center' },
];

export default function Index({ enrollment, availableCourses = [] }) {
    const [loadingAction, setLoadingAction] = useState(null);
    const [confirm, setConfirm] = useState(null);

    const addForm = useForm({ enrollment_id: enrollment.id, course_id: '' });
    const creditForm = useForm({ enrollment_id: enrollment.id, course_id: '' });

    const student = enrollment.student;
    const isOpen = enrollment.status === 'enrolled';
    const semester = enrollment.academic_term?.semester;
    const maxUnits = getMaxUnits(semester);

    const enrollmentCourses = enrollment.enrollment_courses ?? [];
    const activeCourses = enrollmentCourses.filter(ec => ['active', 'inc'].includes(ec.status));
    const creditedCourses = enrollmentCourses.filter(ec => ec.status === 'credited');
    const droppedCourses = enrollmentCourses.filter(ec => ec.status === 'dropped');

    const currentUnits = activeCourses.reduce((total, ec) => total + (ec.course?.units ?? 0), 0);
    const unitsColor = currentUnits > maxUnits ? 'text-red-600' : currentUnits >= maxUnits - 2 ? 'text-amber-600' : 'text-gray-900';

    const usedCourseIds = new Set(enrollmentCourses.map(ec => ec.course_id));
    const addableCourses = availableCourses.filter(course => !usedCourseIds.has(course.id));

    const selectedAddCourse = addableCourses.find(course => String(course.id) === String(addForm.data.course_id));
    const coReqs = selectedAddCourse?.co_requisites ?? [];

    const termLabel = `${getSemesterLabel(semester)} · S.Y. ${enrollment.academic_term?.school_year?.name ?? ''}`;

    function reloadProps(extra = {}) {
        return { preserveScroll: true, ...extra };
    }

    function handleLoadCurriculum() {
        setLoadingAction('curriculum');
        router.post(route('coordinator.enrollments.load-curriculum', enrollment.id), {}, reloadProps({
            onFinish: () => setLoadingAction(null),
        }));
    }

    function handleAddCourse() {
        addForm.post(route('coordinator.enrollment-courses.store'), reloadProps({
            onSuccess: () => addForm.reset('course_id'),
        }));
    }

    function handleForceAdd() {
        router.post(
            route('coordinator.enrollment-courses.store'),
            { enrollment_id: enrollment.id, course_id: addForm.data.course_id, force: true },
            reloadProps({
                onSuccess: () => { addForm.clearErrors(); addForm.reset('course_id'); },
            })
        );
    }

    function handleCreditCourse() {
        creditForm.post(route('coordinator.enrollment-courses.credit'), reloadProps({
            onSuccess: () => creditForm.reset('course_id'),
        }));
    }

    function confirmAction({ title, message, confirmLabel, key, run }) {
        setConfirm({
            title,
            message,
            confirmLabel,
            onConfirm: () => {
                setLoadingAction(key);
                run({
                    onSuccess: () => setConfirm(null),
                    onFinish: () => setLoadingAction(null),
                });
            },
        });
    }

    function handleDrop(ec) {
        confirmAction({
            title: 'Drop Course',
            message: <>Drop <strong>{ec.course?.course_code} — {ec.course?.title}</strong>? It can be restored later.</>,
            confirmLabel: 'Drop',
            key: `drop-${ec.id}`,
            run: opts => router.delete(route('coordinator.enrollment-courses.destroy', ec.id), reloadProps(opts)),
        });
    }

    function handleRemoveCredit(ec) {
        confirmAction({
            title: 'Remove Transfer Credit',
            message: <>Remove the transfer credit for <strong>{ec.course?.course_code} — {ec.course?.title}</strong>?</>,
            confirmLabel: 'Remove',
            key: `remove-credit-${ec.id}`,
            run: opts => router.delete(route('coordinator.enrollment-courses.destroy', ec.id), reloadProps(opts)),
        });
    }

    function handleRestore(ec) {
        confirmAction({
            title: 'Restore Course',
            message: <>Restore <strong>{ec.course?.course_code} — {ec.course?.title}</strong> to this enrollment?</>,
            confirmLabel: 'Restore',
            key: `restore-${ec.id}`,
            run: opts => router.post(route('coordinator.enrollment-courses.restore', ec.id), {}, reloadProps(opts)),
        });
    }

    return (
        <AuthenticatedLayout header="Manage Course Load">
            <Head title="Manage Course Load" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-6">
                    <Link
                        href={route('coordinator.students.index')}
                        className="inline-flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                        <BackIcon className="h-4 w-4" />
                        Back to Students
                    </Link>

                    {/* Summary bento */}
                    <section className="border border-gray-200 bg-white shadow-sm">
                        <div className="grid gap-px bg-gray-200 md:grid-cols-3">
                            <div className="bg-white p-5 md:col-span-2">
                                <h1 className="text-lg font-bold text-gray-900">
                                    {student?.last_name}, {student?.first_name}
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    {student?.program?.code} · {termLabel}
                                    {enrollment.year_level && <span className="ml-1 text-gray-400">({getYearLabel(enrollment.year_level)})</span>}
                                </p>
                                <div className="mt-3">
                                    <StatusBadge status={enrollment.status ?? 'enrolled'} />
                                    {enrollment.section?.name && (
                                        <span className="ml-2 text-xs text-gray-500">Section {enrollment.section.name}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col justify-center bg-white p-5">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Units</p>
                                <p className={`mt-1 text-3xl font-bold ${unitsColor}`}>
                                    {currentUnits}<span className="text-base font-medium text-gray-400"> / {maxUnits}</span>
                                </p>
                                {isOpen && (
                                    <button
                                        type="button"
                                        onClick={handleLoadCurriculum}
                                        disabled={loadingAction === 'curriculum'}
                                        className="mt-3 border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                    >
                                        {loadingAction === 'curriculum' ? 'Loading...' : 'Load Standard Curriculum'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Active courses + Add */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Panel title="Active Courses" className="lg:col-span-2">
                            <DataTable
                                compact
                                columns={COURSE_COLUMNS}
                                rows={activeCourses}
                                emptyMessage="No courses in this enrollment yet."
                                actions={isOpen ? ec => (
                                    <button
                                        type="button"
                                        onClick={() => handleDrop(ec)}
                                        disabled={loadingAction === `drop-${ec.id}`}
                                        title="Drop course"
                                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                ) : undefined}
                            />
                        </Panel>

                        {isOpen && (
                            <Panel title="Add a Course">
                                <CoursePicker
                                    courses={addableCourses}
                                    selectedId={addForm.data.course_id}
                                    onSelect={id => { addForm.setData('course_id', id); addForm.clearErrors(); }}
                                    withSemester
                                />
                                {coReqs.length > 0 && (
                                    <p className="mt-2 text-xs text-teal-600">
                                        Co-req: {coReqs.map(coReq => coReq.course_code).join(', ')}
                                    </p>
                                )}
                                {addForm.errors.course_id && <InputError message={addForm.errors.course_id} className="mt-2" />}
                                {addForm.errors.prereq_warning && (
                                    <div className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2.5">
                                        <p className="text-xs font-semibold text-amber-800">Prerequisite Not Met</p>
                                        <ul className="mt-1 space-y-0.5">
                                            {addForm.errors.prereq_warning.split('; ').map((item, index) => (
                                                <li key={index} className="text-xs text-amber-700">- {item}</li>
                                            ))}
                                        </ul>
                                        <div className="mt-2 flex gap-2">
                                            <button type="button" onClick={handleForceAdd} className="border border-amber-500 bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600">
                                                Add Anyway
                                            </button>
                                            <button type="button" onClick={() => { addForm.clearErrors(); addForm.reset('course_id'); }} className="border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <PrimaryButton
                                    type="button"
                                    onClick={handleAddCourse}
                                    disabled={addForm.processing || !addForm.data.course_id}
                                    className="mt-3 w-full justify-center"
                                >
                                    Add Course
                                </PrimaryButton>
                            </Panel>
                        )}
                    </div>

                    {/* Transfer credits + Credit */}
                    {(creditedCourses.length > 0 || isOpen) && (
                        <div className="grid gap-6 lg:grid-cols-3">
                            <Panel title={`Transfer Credits (${creditedCourses.length})`} className="lg:col-span-2">
                                <DataTable
                                    compact
                                    columns={COURSE_COLUMNS}
                                    rows={creditedCourses}
                                    emptyMessage="No transfer credits."
                                    actions={isOpen ? ec => (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCredit(ec)}
                                            disabled={loadingAction === `remove-credit-${ec.id}`}
                                            title="Remove credit"
                                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    ) : undefined}
                                />
                            </Panel>

                            {isOpen && (
                                <Panel title="Credit a Course" hint="Transfer student — satisfies prerequisites without taking the course here.">
                                    <CoursePicker
                                        courses={addableCourses}
                                        selectedId={creditForm.data.course_id}
                                        onSelect={id => { creditForm.setData('course_id', id); creditForm.clearErrors(); }}
                                    />
                                    {creditForm.errors.course_id && <InputError message={creditForm.errors.course_id} className="mt-2" />}
                                    <PrimaryButton
                                        type="button"
                                        onClick={handleCreditCourse}
                                        disabled={creditForm.processing || !creditForm.data.course_id}
                                        className="mt-3 w-full justify-center"
                                    >
                                        Credit Course
                                    </PrimaryButton>
                                </Panel>
                            )}
                        </div>
                    )}

                    {/* Dropped courses */}
                    {droppedCourses.length > 0 && (
                        <Panel title={`Dropped Courses (${droppedCourses.length})`}>
                            <DataTable
                                compact
                                columns={COURSE_COLUMNS.slice(0, 3)}
                                rows={droppedCourses}
                                emptyMessage=""
                                actions={isOpen ? ec => (
                                    <button
                                        type="button"
                                        onClick={() => handleRestore(ec)}
                                        disabled={loadingAction === `restore-${ec.id}`}
                                        title="Restore course"
                                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
                                    >
                                        <ActivateIcon className="h-4 w-4" /> Restore
                                    </button>
                                ) : undefined}
                            />
                        </Panel>
                    )}
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
