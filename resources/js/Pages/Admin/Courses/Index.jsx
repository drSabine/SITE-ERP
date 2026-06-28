import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, StatusBadge, ConfirmModal, DataTable, PagePanel, ActionsDropdown } from '@/Components/ui';
import { CourseFormModal } from '@/Components/Admin/Courses';
import { SEMESTER_LABELS } from '@/Components/Admin/SchoolYears';
import { BackIcon } from '@/Components/ui/Icons';
import { useCourses } from './useCourses';

export default function Index({ program, courses }) {
    const {
        showForm, setShowForm, editTarget,
        confirm, setConfirm,
        groups,
        openCreate, openEdit, requestDelete,
    } = useCourses(courses);
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

                    <PagePanel
                        className="mb-6"
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

                    {courses.length === 0 ? (
                        <div className="border border-gray-200 bg-white px-5 py-16 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                                <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900">No courses yet</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Get started by adding the first course to {program.name}.
                            </p>
                            <div className="mt-4">
                                <PrimaryButton onClick={openCreate}>+ Add Course</PrimaryButton>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {groups.map(group => (
                                <div key={`${group.year_level}-${group.semester_type}`} className="border border-gray-200 bg-white shadow-sm">
                                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            {group.year_level ? `Year ${group.year_level}` : 'General'}
                                            {group.semester_type ? ` > ${SEMESTER_LABELS[group.semester_type] ?? group.semester_type}` : ''}
                                        </p>
                                    </div>
                                    <DataTable
                                        tableClassName="table-fixed"
                                        actionsColumnClassName="w-32"
                                        columns={columns}
                                        rows={group.courses}
                                        actions={course => (
                                            <ActionsDropdown items={[
                                                { label: 'Edit', onClick: () => openEdit(course) },
                                                { label: 'Delete', onClick: () => requestDelete(course), variant: 'danger' },
                                            ]} />
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>

            <CourseFormModal show={showForm} editTarget={editTarget} programId={program.id} programCode={program.code} courses={courses} onClose={() => setShowForm(false)} />

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
