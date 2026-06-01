import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, StatusBadge, ConfirmModal, DataTable, ActionsDropdown } from '@/Components/ui';
import { EnrollmentFilters, SchoolYearTermPicker, AddEnrollmentModal } from '@/Components/Coordinator/Enrollments';
import { CourseManagerModal } from '@/Components/Coordinator/Students';
import { PagePanel, formatStudentName, getSemesterLabel, getYearLabel, countIncCourses } from '@/Components/Coordinator/Shared';
import { useEnrollments } from './useEnrollments';

export default function Index({ enrollments, schoolYears, programs, selectedTermId, students, enrolledStudentIds = [], droppedStudentIds = [], filters = {} }) {
    const {
        programId, yearLevel, status,
        confirm, setConfirm,
        showAddModal, setShowAddModal,
        managingRow, managingStudentData, managingLoading,
        selectedTerm, selectedSchoolYear, termsForSelectedYear,
        handleSchoolYearChange, handleTermTabClick,
        handleProgramFilter, handleYearLevelFilter, handleStatusFilter,
        openCourseManager, closeCourseManager, refetchManagingStudent,
        requestDropEnrollment,
    } = useEnrollments({ selectedTermId, schoolYears, filters });

    const columns = [
        {
            key: 'student_number',
            label: 'Student No.',
            className: 'font-mono text-xs text-gray-500',
            render: row => row.student?.student_number ?? '-',
        },
        {
            key: 'name',
            label: 'Name',
            className: 'font-semibold text-gray-900',
            render: row => formatStudentName(row.student, { includeSuffix: false }),
        },
        {
            key: 'program',
            label: 'Program',
            className: 'text-gray-600',
            render: row => row.student?.program?.code ?? '-',
        },
        {
            key: 'year_level',
            label: 'Year',
            className: 'text-gray-600',
            render: row => getYearLabel(row.year_level),
        },
        {
            key: 'courses',
            label: 'Courses',
            className: 'text-center text-gray-600',
            headerClass: 'text-center',
            render: row => {
                const activeCount = (row.enrollment_courses ?? []).length;
                const incCount = countIncCourses(row);

                return (
                    <span>
                        {activeCount}
                        {incCount > 0 && (
                            <span className="ml-1.5 text-xs font-semibold text-orange-600">{incCount} INC</span>
                        )}
                    </span>
                );
            },
        },
        {
            key: 'status',
            label: 'Status',
            render: row => <StatusBadge status={row.status} />,
        },
    ];

    const termLabel = selectedTerm
        ? `${getSemesterLabel(selectedTerm.semester)} > S.Y. ${selectedTerm.school_year?.name}`
        : 'No term selected';

    return (
        <AuthenticatedLayout header="Enrollments">
            <Head title="Enrollments" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel
                        title="Enrollments"
                        description={termLabel}
                        action={
                            <PrimaryButton
                                onClick={() => setShowAddModal(true)}
                                disabled={!selectedTermId}
                            >
                                + New Enrollment
                            </PrimaryButton>
                        }
                    >
                        <SchoolYearTermPicker
                            schoolYears={schoolYears}
                            selectedSchoolYear={selectedSchoolYear}
                            selectedTermId={selectedTermId}
                            terms={termsForSelectedYear}
                            onSchoolYearChange={handleSchoolYearChange}
                            onTermClick={handleTermTabClick}
                        />

                        <EnrollmentFilters
                            programs={programs}
                            programId={programId}
                            yearLevel={yearLevel}
                            status={status}
                            onProgramChange={handleProgramFilter}
                            onYearLevelChange={handleYearLevelFilter}
                            onStatusChange={handleStatusFilter}
                        />

                        {!selectedTermId ? (
                            <div className="px-6 py-16 text-center text-sm text-gray-400">
                                Select a school year and semester to view enrollments.
                            </div>
                        ) : (
                            <DataTable
                                columns={columns}
                                rows={enrollments.data}
                                pagination={enrollments}
                                emptyMessage="No enrollments found for this term."
                                actions={row => (
                                    <ActionsDropdown items={[
                                        { label: 'Manage Courses', onClick: () => openCourseManager(row) },
                                        { label: 'View Student', href: `${route('coordinator.students.index')}?search=${row.student?.student_number ?? ''}` },
                                        row.status === 'enrolled' && { label: 'Drop', onClick: () => requestDropEnrollment(row), variant: 'danger' },
                                    ]} />
                                )}
                            />
                        )}
                    </PagePanel>
                </div>
            </div>

            <CourseManagerModal
                show={managingRow !== null}
                student={managingRow?.student ?? null}
                enrollment={
                    managingStudentData
                        ? (managingStudentData.student?.enrollments ?? []).find(enrollment => enrollment.id === managingRow?.id) ?? null
                        : null
                }
                availableCourses={managingStudentData?.availableCourses ?? []}
                loading={managingLoading}
                onClose={closeCourseManager}
                onActionDone={refetchManagingStudent}
            />

            <AddEnrollmentModal
                key={`add-enrollment-${selectedTermId ?? 'none'}`}
                show={showAddModal}
                term={selectedTerm ?? null}
                students={students ?? []}
                enrolledStudentIds={enrolledStudentIds}
                droppedStudentIds={droppedStudentIds}
                onClose={() => setShowAddModal(false)}
            />

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
