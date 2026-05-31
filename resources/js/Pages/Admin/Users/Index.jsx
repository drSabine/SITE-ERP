import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, StatusBadge, ConfirmModal, DataTable, SearchBar, PagePanel, SegmentedTabs, Dropdown } from '@/Components/ui';
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
                    <PagePanel
                        title="User Accounts"
                        description="Administrators, coordinators, teachers, and students."
                        action={<PrimaryButton onClick={openCreate}>+ New Account</PrimaryButton>}
                    >
                        <SegmentedTabs
                            options={TABLE_FILTERS}
                            value={TABLE_FILTERS.find(f => f.role === role && f.status === status)?.value ?? 'all'}
                            onChange={tabValue => handleTableFilter(TABLE_FILTERS.find(f => f.value === tabValue))}
                        />

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
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="text-sm font-medium text-gray-500 hover:text-gray-700">
                                            Actions
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content width="40" align="right">
                                        <button
                                            onClick={() => openEdit(user)}
                                            className="block w-full px-4 py-2 text-start text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Edit
                                        </button>
                                        {status === 'inactive' ? (
                                            <button
                                                onClick={() => requestReactivate(user)}
                                                className="block w-full px-4 py-2 text-start text-sm text-emerald-700 hover:bg-emerald-50"
                                            >
                                                Reactivate
                                            </button>
                                        ) : (
                                            user.id !== currentUserId && (
                                                <button
                                                    onClick={() => requestDeactivate(user)}
                                                    className="block w-full px-4 py-2 text-start text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    Deactivate
                                                </button>
                                            )
                                        )}
                                    </Dropdown.Content>
                                </Dropdown>
                            )}
                        />
                    </PagePanel>
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
