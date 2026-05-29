import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, StatusBadge, DataTable, CardHeader } from '@/Components/ui';
import { ProgramFormModal } from '@/Components/Admin/Programs';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ programs }) {
    const [showForm, setShowForm]     = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    function openCreate() { setEditTarget(null); setShowForm(true); }
    function openEdit(program) { setEditTarget(program); setShowForm(true); }

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
                    <div className="border border-gray-200 bg-white shadow-sm">

                        <CardHeader
                            title="Programs"
                            description="Manage degree programs and their course catalogs."
                            action={<PrimaryButton onClick={openCreate}>+ New Program</PrimaryButton>}
                        />

                        <DataTable
                            columns={columns}
                            rows={programs}
                            emptyMessage="No programs yet. Create one to get started."
                            actions={program => (
                                <>
                                    <Link href={route('admin.courses.index', { program_id: program.id })} className="text-sm font-medium text-gray-500 hover:text-gray-700">
                                        Manage Courses
                                    </Link>
                                    <button onClick={() => openEdit(program)} className="text-sm font-medium text-emerald-700 hover:text-emerald-900">Edit</button>
                                </>
                            )}
                        />

                    </div>
                </div>
            </div>

            <ProgramFormModal show={showForm} editTarget={editTarget} onClose={() => setShowForm(false)} />
        </AuthenticatedLayout>
    );
}
