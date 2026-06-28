import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { StatusBadge, ConfirmModal, DataTable, ActionsDropdown } from '@/Components/ui';
import { StudentFormModal, StudentDrawer, EnrollmentModal, StudentFilters } from '@/Components/Coordinator/Students';
import { PagePanel, SegmentedTabs, YEAR_TABS, getYearLabel, formatStudentName } from '@/Components/Coordinator/Shared';
import { useStudents } from './useStudents';

export default function Index({ students, programs, activeSchoolYear, schoolYears, filters = {} }) {
    const {
        search, setSearch,
        programId, setProgramId,
        yearLevel, status, setStatus,
        showStudentForm, setShowStudentForm,
        studentFormTarget, setStudentFormTarget,
        selectedStudentId, setSelectedStudentId,
        drawerData,
        drawerLoading,
        showEnrollModal, setShowEnrollModal,
        confirm, setConfirm,
        handleYearTab,
        applyFilters,
        closeDrawer,
        manageCourseLoad,
        requestDeleteStudent,
        refetchDrawerStudent,
    } = useStudents(filters);

    const columns = [
        {
            key: 'name',
            label: 'Name',
            className: 'font-semibold text-gray-900',
            render: student => formatStudentName(student, { middleInitial: true }),
        },
        {
            key: 'program',
            label: 'Program',
            className: 'text-gray-600',
            render: student => student.program?.code ?? '-',
        },
        {
            key: 'year_level',
            label: 'Year',
            className: 'text-gray-600 text-sm',
            render: student => getYearLabel(student.year_level),
        },
        {
            key: 'enrollment',
            label: activeSchoolYear ? `S.Y. ${activeSchoolYear.name}` : 'Evaluation',
            render: student => {
                if (!activeSchoolYear) {
                    return <span className="text-xs text-gray-400">No active S.Y.</span>;
                }

                const isEnrolled = (student.enrollments ?? []).some(enrollment => enrollment.status === 'enrolled');

                return <StatusBadge status={isEnrolled ? 'enrolled' : 'not_enrolled'} label={isEnrolled ? 'Evaluated' : 'Not Evaluated'} />;
            },
        },
        {
            key: 'status',
            label: 'Status',
            render: student => <StatusBadge status={student.status} />,
        },
    ];

    return (
        <AuthenticatedLayout header="Students">
            <Head title="Students" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel
                        title="Students"
                        description={activeSchoolYear
                            ? `S.Y. ${activeSchoolYear.name} > Sorted by year level`
                            : 'Manage student records.'}
                    >
                        <SegmentedTabs options={YEAR_TABS} value={yearLevel} onChange={handleYearTab} />

                        <StudentFilters
                            search={search}
                            filters={filters}
                            programs={programs}
                            programId={programId}
                            status={status}
                            onSearchChange={event => setSearch(event.target.value)}
                            onSearchSubmit={event => {
                                event.preventDefault();
                                applyFilters();
                            }}
                            onSearchClear={() => {
                                setSearch('');
                                applyFilters({ search: '' });
                            }}
                            onProgramChange={event => {
                                setProgramId(event.target.value);
                                applyFilters({ program_id: event.target.value });
                            }}
                            onStatusChange={event => {
                                setStatus(event.target.value);
                                applyFilters({ status: event.target.value });
                            }}
                        />

                        <DataTable
                            columns={columns}
                            rows={students.data}
                            pagination={students}
                            emptyMessage="No students found."
                            actions={student => (
                                <ActionsDropdown items={[
                                    {
                                        label: 'View Profile',
                                        onClick: () => {
                                            setSelectedStudentId(student.id);
                                            setShowEnrollModal(false);
                                        },
                                        variant: 'primary',
                                    },
                                    { label: 'Edit', onClick: () => { setStudentFormTarget(student); setShowStudentForm(true); } },
                                    { label: 'Delete', onClick: () => requestDeleteStudent(student), variant: 'danger' },
                                ]} />
                            )}
                        />
                    </PagePanel>
                </div>
            </div>

            <StudentFormModal
                key={studentFormTarget?.id ?? 'create-student'}
                show={showStudentForm}
                editTarget={studentFormTarget}
                programs={programs}
                onClose={() => {
                    setShowStudentForm(false);
                    if (studentFormTarget && selectedStudentId === studentFormTarget.id) {
                        refetchDrawerStudent();
                    }
                }}
            />

            <StudentDrawer
                show={selectedStudentId !== null}
                student={drawerData?.student ?? null}
                loading={drawerLoading}
                onClose={closeDrawer}
                onEnrollClick={() => setShowEnrollModal(true)}
                onManageClick={manageCourseLoad}
                onEditClick={student => {
                    setStudentFormTarget(student);
                    setShowStudentForm(true);
                }}
                onDeleteClick={requestDeleteStudent}
            />

            <EnrollmentModal
                key={`enroll-${drawerData?.student?.id ?? 'none'}`}
                show={showEnrollModal}
                student={drawerData?.student ?? null}
                activeSchoolYear={activeSchoolYear}
                existingEnrollments={drawerData?.student?.enrollments ?? []}
                onClose={() => setShowEnrollModal(false)}
                onSuccess={() => {
                    setShowEnrollModal(false);
                    refetchDrawerStudent();
                }}
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
