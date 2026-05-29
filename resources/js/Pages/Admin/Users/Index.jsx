import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, StatusBadge, ConfirmModal, DataTable, CardHeader, SearchBar } from '@/Components/ui';
import { UserFormModal } from '@/Components/Admin/Users';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const ROLE_LABEL = {
    admin:       'Administrator',
    coordinator: 'Program Coordinator',
    teacher:     'Teacher',
    student:     'Student',
};

const TABLE_FILTERS = [
    { label: 'All', value: 'all', role: '', status: 'active' },
    { label: 'Admin', value: 'admin', role: 'admin', status: 'active' },
    { label: 'Coordinator', value: 'coordinator', role: 'coordinator', status: 'active' },
    { label: 'Teacher', value: 'teacher', role: 'teacher', status: 'active' },
    { label: 'Student', value: 'student', role: 'student', status: 'active' },
    { label: 'Inactive', value: 'inactive', role: '', status: 'inactive' },
];

export default function Index({ users, filters = {} }) {
    const { auth } = usePage().props;
    const currentUserId = auth.user.id;
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [role, setRole] = useState(filters.role ?? '');
    const [status, setStatus] = useState(filters.status ?? 'active');

    function openCreate() {
        setEditTarget(null);
        setShowForm(true);
    }

    function openEdit(user) {
        setEditTarget(user);
        setShowForm(true);
    }

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

    const columns = [
        { key: 'id', label: 'User ID', className: 'font-mono text-gray-600', render: user => `USR-${String(user.id).padStart(4, '0')}` },
        { key: 'name', label: 'Name', className: 'font-semibold text-gray-900' },
        { key: 'role', label: 'Role', className: 'text-gray-600', render: user => ROLE_LABEL[user.role] ?? 'Not assigned' },
        { key: 'email', label: 'Email', className: 'text-gray-500' },
        { key: 'is_active', label: 'Status', render: user => <StatusBadge status={user.is_active ? 'active' : 'inactive'} /> },
    ];

    return (
        <AuthenticatedLayout header="Users">
            <Head title="Users" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="border border-gray-200 bg-white shadow-sm">
                        <CardHeader
                            title="User Accounts"
                            description="Administrators, coordinators, teachers, and students."
                            action={<PrimaryButton onClick={openCreate}>+ New Account</PrimaryButton>}
                        />

                        <div className="flex gap-0 border-b border-gray-200">
                            {TABLE_FILTERS.map(filter => {
                                const isActive = role === filter.role && status === filter.status;

                                return (
                                    <button
                                        key={filter.value}
                                        type="button"
                                        onClick={() => handleTableFilter(filter)}
                                        className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
                                            isActive
                                                ? 'border-b-2 border-emerald-600 bg-white text-emerald-700'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="border-b border-gray-100 px-6 py-3">
                            <SearchBar
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                onSubmit={handleSearch}
                                onClear={handleClear}
                                active={!!filters.search}
                                placeholder="Search by name, email, or user ID..."
                            />
                        </div>

                        <DataTable
                            columns={columns}
                            rows={users.data}
                            pagination={users}
                            emptyMessage="No accounts found."
                            actions={user => (
                                <>
                                    <button onClick={() => openEdit(user)} className="text-sm font-medium text-emerald-700 hover:text-emerald-900">Edit</button>
                                    {status === 'inactive' ? (
                                        <button onClick={() => requestReactivate(user)} className="text-sm font-medium text-emerald-700 hover:text-emerald-900">Reactivate</button>
                                    ) : (
                                        user.id !== currentUserId && (
                                            <button onClick={() => requestDeactivate(user)} className="text-sm font-medium text-red-500 hover:text-red-700">Deactivate</button>
                                        )
                                    )}
                                </>
                            )}
                        />
                    </div>
                </div>
            </div>

            <UserFormModal
                key={editTarget?.id ?? 'create'}
                show={showForm}
                editTarget={editTarget}
                onClose={() => setShowForm(false)}
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
