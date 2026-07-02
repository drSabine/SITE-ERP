import { useState } from 'react';
import { router } from '@inertiajs/react';
import { formatStudentName } from '@/Components/Coordinator/Shared';

export function useEnrollments({ selectedTermId, activeSchoolYear, filters = {} }) {
    const [search, setSearch]       = useState(filters.search ?? '');
    const [programId, setProgramId] = useState(filters.program_id ?? '');
    const [yearLevel, setYearLevel] = useState(filters.year_level ?? '');
    const [sectionId, setSectionId] = useState(filters.section_id ?? '');
    const [status, setStatus]       = useState(filters.status ?? 'enrolled');
    const [hasInc, setHasInc]       = useState(Boolean(filters.has_inc));
    const [confirm, setConfirm]     = useState(null);

    // Evaluations are always scoped to the admin-set active school year; the coordinator
    // can only switch between that year's terms.
    const selectedSchoolYear   = activeSchoolYear ?? null;
    const termsForSelectedYear = selectedSchoolYear?.academic_terms ?? [];
    const selectedTerm         = termsForSelectedYear
        .map(term => ({ ...term, school_year: selectedSchoolYear }))
        .find(term => term.id === selectedTermId);

    function navigate(overrides = {}) {
        router.get(route('coordinator.enrollments.index'), {
            search, term_id: selectedTermId ?? '', program_id: programId, year_level: yearLevel, section_id: sectionId, status, has_inc: hasInc ? 1 : '', ...overrides,
        }, { preserveState: true, preserveScroll: true });
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

    function handleSectionFilter(event) {
        const value = event.target.value;
        setSectionId(value);
        navigate({ section_id: value });
    }

    function handleStatusFilter(event) {
        const value = event.target.value;
        setStatus(value);
        navigate({ status: value });
    }

    function handleIncFilter(event) {
        const value = event.target.checked;
        setHasInc(value);
        navigate({ has_inc: value ? 1 : '' });
    }

    function manageCourseLoad(enrollment) {
        router.visit(route('coordinator.enrollments.course-load', enrollment.id));
    }

    function assignSection() {
        router.visit(route('coordinator.sections.index', { academic_term_id: selectedTermId }));
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

    function handleSearchSubmit(event) {
        event.preventDefault();
        navigate({ search });
    }

    function handleSearchClear() {
        setSearch('');
        navigate({ search: '' });
    }

    return {
        search, setSearch, handleSearchSubmit, handleSearchClear,
        programId, yearLevel, sectionId, status,
        hasInc, handleIncFilter,
        confirm, setConfirm,
        selectedTerm, selectedSchoolYear, termsForSelectedYear,
        handleTermTabClick,
        handleProgramFilter, handleYearLevelFilter, handleSectionFilter, handleStatusFilter,
        manageCourseLoad,
        assignSection,
        requestDropEnrollment,
    };
}
