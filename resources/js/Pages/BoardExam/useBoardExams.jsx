import { useState } from 'react';
import { router } from '@inertiajs/react';

export function useBoardExams() {
    const [showForm, setShowForm]     = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [confirm, setConfirm]       = useState(null);

    function openCreate() { setEditTarget(null); setShowForm(true); }
    function openEdit(result) { setEditTarget(result); setShowForm(true); }

    function requestDelete(result) {
        setConfirm({
            title: 'Delete Board Exam Record',
            message: <>Delete <strong>{result.exam_name}</strong> ({result.intake}) for <strong>{result.program}</strong>? This cannot be undone.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('board-exams.destroy', result.id), {
                preserveScroll: true,
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    return {
        showForm, setShowForm,
        editTarget,
        confirm, setConfirm,
        openCreate, openEdit,
        requestDelete,
    };
}
