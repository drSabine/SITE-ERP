import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { formatStudentName } from '@/Components/Coordinator/Shared';

export function useStudents(filters = {}) {
    const [search, setSearch]         = useState(filters.search ?? '');
    const [programId, setProgramId]   = useState(filters.program_id ?? '');
    const [yearLevel, setYearLevel]   = useState(filters.year_level ?? '');
    const [status, setStatus]         = useState(filters.status ?? 'active');

    const [showStudentForm, setShowStudentForm]     = useState(false);
    const [studentFormTarget, setStudentFormTarget] = useState(null);

    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [drawerData, setDrawerData]               = useState(null);
    const [drawerLoading, setDrawerLoading]         = useState(false);

    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [confirm, setConfirm]                 = useState(null);

    useEffect(() => {
        if (!selectedStudentId) {
            setDrawerData(null);
            return;
        }

        setDrawerLoading(true);
        const controller = new AbortController();

        axios.get(route('coordinator.students.detail', selectedStudentId), { signal: controller.signal })
            .then(response => setDrawerData(response.data))
            .catch(error => {
                if (!axios.isCancel(error)) setDrawerData(null);
            })
            .finally(() => setDrawerLoading(false));

        return () => controller.abort();
    }, [selectedStudentId]);

    function refetchDrawerStudent() {
        if (!selectedStudentId) return;
        setDrawerLoading(true);
        axios.get(route('coordinator.students.detail', selectedStudentId))
            .then(response => setDrawerData(response.data))
            .catch(() => {})
            .finally(() => setDrawerLoading(false));
    }

    function applyFilters(overrides = {}) {
        router.get(route('coordinator.students.index'), {
            search, program_id: programId, year_level: yearLevel, status, ...overrides,
        }, { preserveState: true, preserveScroll: true });
    }

    function handleYearTab(value) {
        setYearLevel(value);
        applyFilters({ year_level: value });
    }

    function closeDrawer() {
        setSelectedStudentId(null);
        setDrawerData(null);
        setShowEnrollModal(false);
    }

    function manageCourseLoad(enrollment) {
        router.visit(route('coordinator.enrollments.course-load', enrollment.id));
    }

    function requestDeleteStudent(student) {
        setConfirm({
            title: 'Delete Student',
            message: <>Delete <strong>{formatStudentName(student, { middleInitial: true })}</strong>? This action cannot be undone.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('coordinator.students.destroy', student.id), {
                onSuccess: () => {
                    setConfirm(null);
                    if (selectedStudentId === student.id) closeDrawer();
                },
            }),
        });
    }

    return {
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
    };
}
