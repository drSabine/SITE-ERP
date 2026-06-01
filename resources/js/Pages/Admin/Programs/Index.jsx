import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, StatusBadge, ConfirmModal, DataTable, PagePanel, ActionsDropdown } from '@/Components/ui';
import { ProgramFormModal } from '@/Components/Admin/Programs';
import { usePrograms } from './usePrograms';

export default function Index({ programs }) {
    const {
        showForm, setShowForm, editTarget,
        confirm, setConfirm,
        openCreate, openEdit, requestDelete,
    } = usePrograms();

    const columns = [
        { key: 'code',         label: 'Code',         className: 'font-mono font-semibold text-emerald-800' },
        { key: 'name',         label: 'Program Name',  className: 'font-medium text-gray-900' },
        { key: 'courses_count', label: 'Courses',      className: 'text-gray-500' },
        { key: 'is_active',    label: 'Status',        render: program => <StatusBadge status={program.is_active ? 'active' : 'inactive'} /> },
    ];

    return (
        <AuthenticatedLayout header="Programs">
            <Head title="Programs" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel
                        title="Programs"
                        description="Manage degree programs and their course catalogs."
                        action={<PrimaryButton onClick={openCreate}>+ New Program</PrimaryButton>}
                    >
                        <DataTable
                            columns={columns}
                            rows={programs}
                            emptyMessage="No programs yet. Create one to get started."
                            actions={program => (
                                <ActionsDropdown items={[
                                    { label: 'Manage Courses', href: route('admin.courses.index', { program_id: program.id }) },
                                    { label: 'Edit', onClick: () => openEdit(program) },
                                    !program.courses_count && { label: 'Delete', onClick: () => requestDelete(program), variant: 'danger' },
                                ]} />
                            )}
                        />
                    </PagePanel>
                </div>
            </div>

            <ProgramFormModal show={showForm} editTarget={editTarget} onClose={() => setShowForm(false)} />

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
