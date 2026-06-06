import { useState } from 'react';
import { router } from '@inertiajs/react';

export function usePassingRates() {
    const [activeTab, setActiveTab]    = useState('analytics');
    const [showForm, setShowForm]      = useState(false);
    const [editTarget, setEditTarget]  = useState(null);
    const [confirm, setConfirm]        = useState(null);

    function openCreate() { setEditTarget(null); setShowForm(true); }
    function openEdit(record) { setEditTarget(record); setShowForm(true); }

    function requestDelete(record) {
        setConfirm({
            title:        'Delete Record',
            message:      <>Delete the passing rate record for <strong>{record.program?.code}</strong> ({monthName(record.exam_month)} {record.exam_year})? This cannot be undone.</>,
            confirmLabel: 'Delete',
            onConfirm:    () => router.delete(route('coordinator.passing-rates.destroy', record.id), {
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    return {
        activeTab, setActiveTab,
        showForm, setShowForm,
        editTarget,
        confirm, setConfirm,
        openCreate, openEdit,
        requestDelete,
    };
}

export function monthName(month) {
    const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return names[month] ?? '';
}
