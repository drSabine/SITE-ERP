import { useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

export function syStatus(sy) {
    if (sy.is_active) return 'active';
    if (sy.status === 'finalized') return 'finalized';
    return 'inactive';
}

export function useSchoolYears() {
    const [showForm, setShowForm]         = useState(false);
    const [editTarget, setEditTarget]     = useState(null);
    const [expandedSY, setExpandedSY]     = useState(null);
    const [terms, setTerms]               = useState([]);
    const [loadingTerms, setLoadingTerms] = useState(false);
    const [confirm, setConfirm]           = useState(null);

    function openCreate() { setEditTarget(null); setShowForm(true); }
    function openEdit(sy) { setEditTarget(sy); setShowForm(true); }

    function loadTerms(syId) {
        return axios.get(route('admin.academic-terms.index'), { params: { school_year_id: syId } })
            .then(response => setTerms(response.data));
    }

    function toggleExpand(sy) {
        if (expandedSY === sy.id) { setExpandedSY(null); setTerms([]); return; }
        setExpandedSY(sy.id);
        setLoadingTerms(true);
        loadTerms(sy.id).finally(() => setLoadingTerms(false));
    }

    function activateSY(sy) {
        router.post(route('admin.school-years.activate', sy.id));
    }

    function activateTerm(term) {
        router.post(route('admin.academic-terms.activate', term.id), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => loadTerms(expandedSY),
        });
    }

    function addSummerTerm(sy) {
        router.post(route('admin.academic-terms.store', sy.id), { semester: 'summer' }, {
            onSuccess: () => loadTerms(sy.id),
        });
    }

    function requestFinalizeSY(sy) {
        setConfirm({
            title: 'Finalize School Year',
            message: <>Lock <strong>{sy.name}</strong> and mark it finalized. No further changes allowed.</>,
            confirmLabel: 'Finalize School Year',
            onConfirm: () => router.post(route('admin.school-years.finalize', sy.id), {}, {
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    function requestDeleteSY(sy) {
        setConfirm({
            title: 'Delete School Year',
            message: <>Delete <strong>{sy.name}</strong>? This action cannot be undone.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('admin.school-years.destroy', sy.id), {
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    return {
        showForm, setShowForm,
        editTarget,
        expandedSY,
        terms,
        loadingTerms,
        confirm, setConfirm,
        openCreate, openEdit,
        toggleExpand,
        activateSY, activateTerm, addSummerTerm,
        requestFinalizeSY, requestDeleteSY,
    };
}
