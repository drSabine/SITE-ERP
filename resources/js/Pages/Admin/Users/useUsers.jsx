import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';

export const ROLE_LABEL = {
    admin:                   'Administrator',
    coordinator_it:          'IT Coordinator',
    coordinator_engineering: 'Engineering Coordinator',
    teacher:                 'Teacher',
    student:                 'Student',
};

export const TABLE_FILTERS = [
    { label: 'All',         value: 'all',                     role: '',                         status: 'active' },
    { label: 'Admin',       value: 'admin',                   role: 'admin',                    status: 'active' },
    { label: 'IT Coord.',   value: 'coordinator_it',          role: 'coordinator_it',           status: 'active' },
    { label: 'Eng. Coord.', value: 'coordinator_engineering', role: 'coordinator_engineering',  status: 'active' },
    { label: 'Teacher',     value: 'teacher',                 role: 'teacher',                  status: 'active' },
    { label: 'Student',     value: 'student',                 role: 'student',                  status: 'active' },
    { label: 'Inactive',    value: 'inactive',                role: '',                         status: 'inactive' },
];

export function useUsers(filters = {}) {
    const { auth } = usePage().props;
    const currentUserId = auth.user.id;

    const [showForm, setShowForm]     = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [confirm, setConfirm]       = useState(null);
    const [search, setSearch]         = useState(filters.search ?? '');
    const [role, setRole]             = useState(filters.role ?? '');
    const [status, setStatus]         = useState(filters.status ?? 'active');

    function openCreate() { setEditTarget(null); setShowForm(true); }
    function openEdit(user) { setEditTarget(user); setShowForm(true); }

    function handleSearch(event) {
        event.preventDefault();
        router.get(route('admin.users.index'), { search, role, status }, { preserveState: true, preserveScroll: true });
    }

    function handleTableFilter(filter) {
        setRole(filter.role);
        setStatus(filter.status);
        router.get(route('admin.users.index'), { search, role: filter.role, status: filter.status }, { preserveState: true, preserveScroll: true });
    }

    function handleClear() {
        setSearch('');
        router.get(route('admin.users.index'), { search: '', role, status }, { preserveState: true, preserveScroll: true });
    }

    function requestDeactivate(user) {
        setConfirm({
            title: 'Deactivate Account',
            message: <>Deactivate <strong>{user.name}</strong>? They will be moved to the inactive list.</>,
            confirmLabel: 'Deactivate',
            onConfirm: () => router.delete(route('admin.users.destroy', user.id), {
                preserveScroll: true,
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    function requestReactivate(user) {
        setConfirm({
            title: 'Reactivate Account',
            message: <>Reactivate <strong>{user.name}</strong> and return this account to the active list?</>,
            confirmLabel: 'Reactivate',
            onConfirm: () => router.patch(route('admin.users.reactivate', user.id), {}, {
                preserveScroll: true,
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    return {
        currentUserId,
        showForm, setShowForm,
        editTarget,
        confirm, setConfirm,
        search, setSearch,
        role, status,
        openCreate, openEdit,
        handleSearch, handleTableFilter, handleClear,
        requestDeactivate, requestReactivate,
    };
}
