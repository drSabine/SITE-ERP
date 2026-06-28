import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { StatusBadge, ConfirmModal, DataTable, ActionsDropdown } from '@/Components/ui';
import { EnrollmentFilters, SchoolYearTermPicker } from '@/Components/Coordinator/Enrollments';
import { PagePanel, StudentReviewModal, formatStudentName, getSemesterLabel, getYearLabel, countIncCourses } from '@/Components/Coordinator/Shared';
import { useEnrollments } from './useEnrollments';

function StatTile({ label, value, accent = 'text-gray-900' }) {
    return (
        <div className="border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
        </div>
    );
}

export default function Index({ enrollments, summary = {}, schoolYears, programs, sections = [], selectedTermId, filters = {} }) {
    const {
        search, setSearch, handleSearchSubmit, handleSearchClear,
        programId, yearLevel, sectionId, status,
        hasInc, handleIncFilter,
        confirm, setConfirm,
        selectedTerm, selectedSchoolYear, termsForSelectedYear,
        handleSchoolYearChange, handleTermTabClick,
        handleProgramFilter, handleYearLevelFilter, handleSectionFilter, handleStatusFilter,
        manageCourseLoad,
        requestDropEnrollment,
    } = useEnrollments({ selectedTermId, schoolYears, filters });

    const [reviewStudentId, setReviewStudentId] = useState(null);

    const columns = [
        { key: 'name', label: 'Name', widthClassName: 'w-[30%]', className: 'font-semibold text-gray-900', render: row => formatStudentName(row.student, { middleInitial: true, includeSuffix: false }) },
        { key: 'program', label: 'Program', widthClassName: 'w-20', className: 'text-gray-600', render: row => row.student?.program?.code ?? '-' },
        { key: 'year_level', label: 'Year', widthClassName: 'w-24', className: 'text-gray-600', render: row => getYearLabel(row.year_level) },
        { key: 'section', label: 'Section', widthClassName: 'w-24', className: 'text-gray-600', render: row => row.section?.name ?? <span className="text-gray-300">—</span> },
        { key: 'courses', label: 'Subjects', widthClassName: 'w-20', headerClass: 'text-center', className: 'text-center text-gray-700', render: row => (row.enrollment_courses ?? []).length },
        {
            key: 'deficiency',
            label: 'Deficiency',
            widthClassName: 'w-28',
            render: row => {
                const incCount = countIncCourses(row);
                return incCount > 0
                    ? <StatusBadge status="inc" label={`${incCount} INC`} />
                    : <span className="text-xs text-gray-300">—</span>;
            },
        },
    ];

    const termLabel = selectedTerm
        ? `${getSemesterLabel(selectedTerm.semester)} > S.Y. ${selectedTerm.school_year?.name}`
        : 'No term selected';

    return (
        <AuthenticatedLayout header="Evaluations">
            <Head title="Evaluations" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-6">
                    <PagePanel
                        title="Evaluations"
                        description={termLabel}
                        action={
                            <Link
                                href={route('coordinator.enrollments.evaluate')}
                                className="inline-flex items-center border border-transparent bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
                            >
                                + New Evaluation
                            </Link>
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
                            search={search}
                            filters={filters}
                            programs={programs}
                            programId={programId}
                            yearLevel={yearLevel}
                            sections={sections}
                            sectionId={sectionId}
                            status={status}
                            onSearchChange={event => setSearch(event.target.value)}
                            onSearchSubmit={handleSearchSubmit}
                            onSearchClear={handleSearchClear}
                            onProgramChange={handleProgramFilter}
                            onYearLevelChange={handleYearLevelFilter}
                            onSectionChange={handleSectionFilter}
                            onStatusChange={handleStatusFilter}
                        />
                        <label className="flex cursor-pointer items-center gap-2 border-t border-gray-200 px-6 py-3 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={hasInc}
                                onChange={handleIncFilter}
                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            Show only students with <span className="font-semibold text-orange-600">INC</span>
                        </label>
                    </PagePanel>

                    {!selectedTermId ? (
                        <div className="border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-400 shadow-sm">
                            Select a school year and semester to view evaluations.
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                <StatTile label="Evaluated" value={summary.total ?? 0} accent="text-emerald-700" />
                                <StatTile label="Sectioned" value={summary.sectioned ?? 0} />
                                <StatTile label="No Section" value={summary.noSection ?? 0} accent={(summary.noSection ?? 0) > 0 ? 'text-amber-600' : 'text-gray-900'} />
                                <StatTile label="Students w/ INC" value={summary.withInc ?? 0} accent={(summary.withInc ?? 0) > 0 ? 'text-amber-600' : 'text-gray-900'} />
                            </div>

                            <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
                                <DataTable
                                    columns={columns}
                                    rows={enrollments.data}
                                    pagination={enrollments}
                                    emptyMessage="No evaluations found for this term."
                                    actions={row => (
                                        <ActionsDropdown items={[
                                            { label: 'Review', onClick: () => setReviewStudentId(row.student?.id), variant: 'primary' },
                                            { label: 'Manage Course Load', onClick: () => manageCourseLoad(row) },
                                            row.status === 'enrolled' && { label: 'Drop', onClick: () => requestDropEnrollment(row), variant: 'danger' },
                                        ]} />
                                    )}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <StudentReviewModal
                show={reviewStudentId !== null}
                studentId={reviewStudentId}
                onClose={() => setReviewStudentId(null)}
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
