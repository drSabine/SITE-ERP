import { useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { formatStudentName } from '@/Components/Coordinator/Shared';

export function useEnrollments({ selectedTermId, schoolYears, filters = {} }) {
    const [programId, setProgramId] = useState(filters.program_id ?? '');
    const [yearLevel, setYearLevel] = useState(filters.year_level ?? '');
    const [status, setStatus]       = useState(filters.status ?? 'enrolled');
    const [confirm, setConfirm]     = useState(null);

    const [showAddModal, setShowAddModal]               = useState(false);
    const [managingRow, setManagingRow]                 = useState(null);
    const [managingStudentData, setManagingStudentData] = useState(null);
    const [managingLoading, setManagingLoading]         = useState(false);

    const allTerms = schoolYears.flatMap(sy =>
        (sy.academic_terms ?? []).map(term => ({ ...term, school_year: sy }))
    );
    const selectedTerm         = allTerms.find(term => term.id === selectedTermId);
    const selectedSchoolYear   = selectedTerm?.school_year ?? null;
    const termsForSelectedYear = selectedSchoolYear ? (selectedSchoolYear.academic_terms ?? []) : [];

    function navigate(overrides = {}) {
        router.get(route('coordinator.enrollments.index'), {
            term_id: selectedTermId ?? '', program_id: programId, year_level: yearLevel, status, ...overrides,
        }, { preserveState: true, preserveScroll: true });
    }

    function handleSchoolYearChange(event) {
        const sy = schoolYears.find(item => item.id === Number(event.target.value));
        const firstTerm = sy?.academic_terms?.[0];
        if (firstTerm) navigate({ term_id: firstTerm.id });
    }

    function handleTermTabClick(termId) { navigate({ term_id: termId }); }

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

    function openCourseManager(row) {
        setManagingRow(row);
        setManagingStudentData(null);
        setManagingLoading(true);
        axios.get(route('coordinator.students.detail', row.student.id))
            .then(response => setManagingStudentData(response.data))
            .catch(() => {})
            .finally(() => setManagingLoading(false));
    }

    function closeCourseManager() {
        setManagingRow(null);
        setManagingStudentData(null);
    }

    function refetchManagingStudent() {
        if (!managingRow?.student?.id) return;
        axios.get(route('coordinator.students.detail', managingRow.student.id))
            .then(response => setManagingStudentData(response.data))
            .catch(() => {});
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

    return {
        programId, yearLevel, status,
        confirm, setConfirm,
        showAddModal, setShowAddModal,
        managingRow, managingStudentData, managingLoading,
        allTerms, selectedTerm, selectedSchoolYear, termsForSelectedYear,
        handleSchoolYearChange, handleTermTabClick,
        handleProgramFilter, handleYearLevelFilter, handleStatusFilter,
        openCourseManager, closeCourseManager, refetchManagingStudent,
        requestDropEnrollment,
    };
}
