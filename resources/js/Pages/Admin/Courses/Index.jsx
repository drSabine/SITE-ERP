import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, StatusBadge, ConfirmModal, DataTable, CardHeader } from '@/Components/ui';
import { CourseFormModal } from '@/Components/Admin/Courses';
import { SEMESTER_LABELS } from '@/Components/Admin/SchoolYears';
import { BackIcon } from '@/Components/ui/Icons';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

function groupCourses(courses) {
    const groups = {};
    courses.forEach(course => {
        const key = `${course.year_level ?? 0}-${course.semester_type ?? 'none'}`;
        if (!groups[key]) {
            groups[key] = {
                year_level:    course.year_level,
                semester_type: course.semester_type,
                courses:       [],
            };
        }
        groups[key].courses.push(course);
    });
    return Object.values(groups).sort((groupA, groupB) => {
        if (groupA.year_level !== groupB.year_level) return (groupA.year_level ?? 99) - (groupB.year_level ?? 99);
        const order = { first: 1, second: 2, summer: 3, none: 4 };
        return (order[groupA.semester_type] ?? 4) - (order[groupB.semester_type] ?? 4);
    });
}

export default function Index({ program, courses }) {
    const [showForm, setShowForm]     = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [confirm, setConfirm]       = useState(null);

    function openCreate() { setEditTarget(null); setShowForm(true); }
    function openEdit(course) { setEditTarget(course); setShowForm(true); }

    function requestDelete(course) {
        setConfirm({
            title: 'Delete Course',
            message: <>Delete <strong>{course.course_code} - {course.title}</strong>? This cannot be undone.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('admin.courses.destroy', course.id), {
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    const groups = groupCourses(courses);
    const columns = [
        { key: 'course_code', label: 'Code', widthClassName: 'w-28', headerClass: 'text-[11px]', className: 'font-mono text-xs font-semibold text-emerald-800 whitespace-nowrap' },
        { key: 'title',       label: 'Title', widthClassName: 'w-[48%]', className: 'text-gray-800' },
        { key: 'units',       label: 'Units', widthClassName: 'w-20', headerClass: 'text-center', className: 'text-center text-gray-600' },
        { key: 'lec_lab',     label: 'Lec/Lab', widthClassName: 'w-24', headerClass: 'text-center', render: course => `${course.lec_hours} / ${course.lab_hours}`, className: 'text-center text-gray-500 whitespace-nowrap' },
        { key: 'is_active',   label: 'Status', widthClassName: 'w-28', render: course => <StatusBadge status={course.is_active ? 'active' : 'inactive'} /> },
    ];

    return (
        <AuthenticatedLayout header="Courses">
            <Head title={`${program.code} Courses`} />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mb-4">
                        <Link
                            href={route('admin.programs.index')}
                            className="inline-flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                        >
                            <BackIcon className="h-4 w-4" />
                            Back to Programs
                        </Link>
                    </div>

                    <div className="mb-6 border border-gray-200 bg-white shadow-sm">
                        <CardHeader
                            title="Course Catalog"
                            description={
                                <div className="flex flex-wrap items-center gap-2">
                                    <Link href={route('admin.programs.index')} className="hover:text-emerald-700">Programs</Link>
                                    <span className="text-gray-300">&gt;</span>
                                    <span className="font-medium text-gray-800">{program.name}</span>
                                </div>
                            }
                            action={<PrimaryButton onClick={openCreate}>+ Add Course</PrimaryButton>}
                        />
                    </div>

                    {courses.length === 0 ? (
                        <div className="border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-400 shadow-sm">
                            No courses yet for {program.name}. Add the first one.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {groups.map(group => (
                                <div key={`${group.year_level}-${group.semester_type}`} className="border border-gray-200 bg-white shadow-sm">
                                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            {group.year_level ? `Year ${group.year_level}` : 'General'}
                                            {group.semester_type ? ` - ${SEMESTER_LABELS[group.semester_type] ?? group.semester_type}` : ''}
                                        </p>
                                    </div>
                                    <DataTable
                                        tableClassName="table-fixed"
                                        actionsColumnClassName="w-32"
                                        columns={columns}
                                        rows={group.courses}
                                        actions={course => (
                                            <>
                                                <button onClick={() => openEdit(course)} className="text-sm font-medium text-emerald-700 hover:text-emerald-900">Edit</button>
                                                <button onClick={() => requestDelete(course)} className="text-sm font-medium text-red-500 hover:text-red-700">Delete</button>
                                            </>
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>

            <CourseFormModal show={showForm} editTarget={editTarget} programId={program.id} onClose={() => setShowForm(false)} />

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
