import { useState } from 'react';
import { router } from '@inertiajs/react';

export function usePrograms() {
    const [showForm, setShowForm]     = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [confirm, setConfirm]       = useState(null);

    function openCreate() { setEditTarget(null); setShowForm(true); }
    function openEdit(program) { setEditTarget(program); setShowForm(true); }

    function requestDelete(program) {
        setConfirm({
            title: 'Delete Program',
            message: <>Delete <strong>{program.code} &gt; {program.name}</strong>? This cannot be undone.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('admin.programs.destroy', program.id), {
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
