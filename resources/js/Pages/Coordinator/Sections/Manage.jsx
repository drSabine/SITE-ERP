import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, PrimaryButton, ConfirmModal, StatusBadge, SearchBar } from '@/Components/ui';
import { BackIcon, TrashIcon } from '@/Components/ui/Icons';
import { formatStudentName, getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

function Panel({ title, action, className = '', children }) {
    return (
        <section className={`border border-gray-200 bg-white shadow-sm ${className}`}>
            {(title || action) && (
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</h2>
                    {action}
                </div>
            )}
            <div className="p-5">{children}</div>
        </section>
    );
}

export default function Manage({ section, term, roster = [], assignable = [] }) {
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [processing, setProcessing] = useState(false);

    const query = search.trim().toLowerCase();
    const filteredAssignable = query
        ? assignable.filter(enrollment => formatStudentName(enrollment.student).toLowerCase().includes(query))
        : assignable;

    const allSelected = filteredAssignable.length > 0 && filteredAssignable.every(e => selected.includes(e.id));

    function toggle(id) {
        setSelected(previous => previous.includes(id) ? previous.filter(x => x !== id) : [...previous, id]);
    }

    function toggleAll() {
        setSelected(allSelected ? [] : filteredAssignable.map(e => e.id));
    }

    function assignStudents() {
        if (selected.length === 0) return;
        setProcessing(true);
        router.post(route('coordinator.sections.bulk-assign-students'), {
            academic_term_id: term.id,
            section_id: section.id,
            enrollment_ids: selected,
        }, {
            preserveScroll: true,
            onSuccess: () => setSelected([]),
            onFinish: () => setProcessing(false),
        });
    }

    function removeStudent(enrollment) {
        setConfirm({
            title: 'Remove from Section',
            message: <>Remove <strong>{formatStudentName(enrollment.student)}</strong> from {section.name}? Their enrollment stays; only the section assignment is cleared.</>,
            confirmLabel: 'Remove',
            onConfirm: () => router.post(route('coordinator.sections.unassign', section.id), { enrollment_id: enrollment.id }, {
                preserveScroll: true,
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    return (
        <AuthenticatedLayout header="Manage Section">
            <Head title={`Manage ${section.name}`} />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-6">
                    <Link
                        href={route('coordinator.sections.index')}
                        className="inline-flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                        <BackIcon className="h-4 w-4" />
                        Back to Sections
                    </Link>

                    {/* Section info bento */}
                    <section className="border border-gray-200 bg-white shadow-sm">
                        <div className="grid gap-px bg-gray-200 md:grid-cols-3">
                            <div className="bg-white p-5 md:col-span-2">
                                <h1 className="text-lg font-bold text-gray-900">{section.name}</h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    {section.program?.code} · {getYearLabel(section.year_level)} · {getSemesterLabel(term.semester)} S.Y. {term.school_year?.name}
                                </p>
                                <div className="mt-3"><StatusBadge status={section.is_active ? 'active' : 'inactive'} /></div>
                            </div>
                            <div className="flex flex-col justify-center bg-white p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Assigned This Term</p>
                                <p className="mt-1 text-3xl font-bold text-gray-900">{roster.length}</p>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Current roster */}
                        <Panel title={`Roster (${roster.length})`}>
                            <DataTable
                                compact
                                columns={[
                                    { key: 'name', label: 'Student', render: row => formatStudentName(row.student, { middleInitial: true }), className: 'text-gray-800' },
                                    { key: 'year', label: 'Year', headerClass: 'text-center', className: 'text-center text-gray-500', render: row => getYearLabel(row.year_level) },
                                ]}
                                rows={roster}
                                emptyMessage="No students assigned yet. Add some from the panel beside this one."
                                actions={row => (
                                    <button
                                        type="button"
                                        onClick={() => removeStudent(row)}
                                        title="Remove from section"
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                )}
                            />
                        </Panel>

                        {/* Add students */}
                        <Panel
                            title={`Add Students (${assignable.length} eligible)`}
                            action={
                                <PrimaryButton type="button" onClick={assignStudents} disabled={processing || selected.length === 0}>
                                    Assign {selected.length > 0 ? `(${selected.length})` : ''}
                                </PrimaryButton>
                            }
                        >
                            <p className="mb-3 text-xs text-gray-400">
                                Eligible = {section.program?.code} {getYearLabel(section.year_level)} students evaluated this term without a section.
                            </p>
                            <SearchBar value={search} onChange={event => setSearch(event.target.value)} onSubmit={event => event.preventDefault()} placeholder="Search student..." />

                            {filteredAssignable.length === 0 ? (
                                <p className="py-8 text-center text-xs text-gray-400">No eligible students to add.</p>
                            ) : (
                                <>
                                    <label className="mb-2 mt-3 flex items-center gap-2 border-b border-gray-200 pb-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                            checked={allSelected}
                                            onChange={toggleAll}
                                        />
                                        Select all ({filteredAssignable.length})
                                    </label>
                                    <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                                        {filteredAssignable.map(enrollment => (
                                            <label key={enrollment.id} className="flex items-center gap-2 px-1 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                    checked={selected.includes(enrollment.id)}
                                                    onChange={() => toggle(enrollment.id)}
                                                />
                                                {formatStudentName(enrollment.student, { middleInitial: true })}
                                            </label>
                                        ))}
                                    </div>
                                </>
                            )}
                        </Panel>
                    </div>
                </div>
            </div>

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
