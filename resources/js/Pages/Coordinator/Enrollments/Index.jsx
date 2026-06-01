import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { StatusBadge, ConfirmModal, DataTable, ActionsDropdown } from '@/Components/ui';
import { EnrollmentFilters, SchoolYearTermPicker } from '@/Components/Coordinator/Enrollments';
import {
    PagePanel,
    countIncCourses,
    formatStudentName,
    getSemesterLabel,
    getYearLabel,
} from '@/Components/Coordinator/Shared';

export default function Index({ enrollments, schoolYears, programs, selectedTermId, filters = {} }) {
    const [programId, setProgramId] = useState(filters.program_id ?? '');
    const [yearLevel, setYearLevel] = useState(filters.year_level ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [confirm, setConfirm] = useState(null);

    const allTerms = schoolYears.flatMap(schoolYear =>
        (schoolYear.academic_terms ?? []).map(term => ({ ...term, school_year: schoolYear }))
    );

    const selectedTerm = allTerms.find(term => term.id === selectedTermId);
    const selectedSchoolYear = selectedTerm?.school_year ?? null;
    const termsForSelectedYear = selectedSchoolYear
        ? (selectedSchoolYear.academic_terms ?? [])
        : [];

    function navigate(overrides = {}) {
        const params = {
            term_id: selectedTermId ?? '',
            program_id: programId,
            year_level: yearLevel,
            status,
            ...overrides,
        };

        router.get(route('coordinator.enrollments.index'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function handleSchoolYearChange(event) {
        const schoolYearId = Number(event.target.value);
        const schoolYear = schoolYears.find(item => item.id === schoolYearId);
        const firstTerm = schoolYear?.academic_terms?.[0];

        if (firstTerm) {
            navigate({ term_id: firstTerm.id });
        }
    }

    function handleTermTabClick(termId) {
        navigate({ term_id: termId });
    }

    function handleProgramFilter(event) {
        const value = event.target.value;
        setProgramId(value);
        navigate({ program_id: value });
    }

    function handleYearLevelFilter(event) {
        const value = event.target.value;
        setYearLevel(value);
        navigate({ year_level: value });
    }

    function handleStatusFilter(event) {
        const value = event.target.value;
        setStatus(value);
        navigate({ status: value });
    }

    function requestDropEnrollment(enrollment) {
        setConfirm({
            title: 'Drop Enrollment',
            message: <>Drop <strong>{formatStudentName(enrollment.student, { includeSuffix: false })}</strong> from this term? This action cannot be undone.</>,
            confirmLabel: 'Drop',
            onConfirm: () => router.post(route('coordinator.enrollments.drop', enrollment.id), {}, {
                onSuccess: () => setConfirm(null),
            }),
        });
    }

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
        ? `${getSemesterLabel(selectedTerm.semester)} - S.Y. ${selectedTerm.school_year?.name}`
        : 'No term selected';

    return (
        <AuthenticatedLayout header="Enrollments">
            <Head title="Enrollments" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel title="Enrollments" description={termLabel}>
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
                                        { label: 'View Student', href: `${route('coordinator.students.index')}?search=${row.student?.student_number ?? ''}` },
                                        row.status === 'enrolled' && { label: 'Drop', onClick: () => requestDropEnrollment(row), variant: 'danger' },
                                    ]} />
                                )}
                            />
                        )}
                    </PagePanel>
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
