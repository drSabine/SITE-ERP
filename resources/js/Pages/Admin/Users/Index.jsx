import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, StatusBadge, ConfirmModal, DataTable, SearchBar, PagePanel, SegmentedTabs, ActionsDropdown } from '@/Components/ui';
import { UserFormModal } from '@/Components/Admin/Users';
import { useUsers, ROLE_LABEL, TABLE_FILTERS } from './useUsers';

export default function Index({ users, filters = {}, programs = [] }) {
    const {
        currentUserId,
        showForm, setShowForm, editTarget,
        confirm, setConfirm,
        search, setSearch,
        role, status,
        openCreate, openEdit,
        handleSearch, handleTableFilter, handleClear,
        requestDeactivate, requestReactivate,
    } = useUsers(filters);

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
                                <ActionsDropdown items={[
                                    { label: 'Edit', onClick: () => openEdit(user) },
                                    status === 'inactive'
                                        ? { label: 'Reactivate', onClick: () => requestReactivate(user), variant: 'primary' }
                                        : user.id !== currentUserId && { label: 'Deactivate', onClick: () => requestDeactivate(user), variant: 'danger' },
                                ]} />
                            )}
                        />
                    </PagePanel>
                </div>
            </div>

            <UserFormModal
                key={editTarget?.id ?? 'create'}
                show={showForm}
                editTarget={editTarget}
                programs={programs}
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
