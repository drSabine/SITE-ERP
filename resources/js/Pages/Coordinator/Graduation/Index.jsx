import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, PagePanel, PrimaryButton, ConfirmModal, StatusBadge, SecondaryButton } from '@/Components/ui';
import { getYearLabel, StudentReviewModal } from '@/Components/Coordinator/Shared';

function StatCard({ label, value, accent = 'text-gray-900' }) {
    return (
        <div className="border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
        </div>
    );
}

export default function Index({ candidates = [], activeSchoolYear, graduatedThisYear = 0 }) {
    const [selected, setSelected] = useState([]);
    const [confirm, setConfirm] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [reviewStudentId, setReviewStudentId] = useState(null);

    const allSelected = candidates.length > 0 && selected.length === candidates.length;

    function toggle(id) {
        setSelected(previous => previous.includes(id) ? previous.filter(x => x !== id) : [...previous, id]);
    }
    function toggleAll() {
        setSelected(allSelected ? [] : candidates.map(candidate => candidate.id));
    }

    function confirmGraduate() {
        if (selected.length === 0) return;
        setConfirm({
            title: 'Confirm Graduation',
            message: <>Graduate <strong>{selected.length}</strong> student{selected.length !== 1 ? 's' : ''}? They will be recorded as graduated for S.Y. {activeSchoolYear?.name}.</>,
            confirmLabel: 'Graduate',
            onConfirm: () => {
                setProcessing(true);
                router.post(route('coordinator.graduation.graduate'), { student_ids: selected }, {
                    preserveScroll: true,
                    onSuccess: () => { setConfirm(null); setSelected([]); },
                    onFinish: () => setProcessing(false),
                });
            },
        });
    }

    const columns = [
        {
            key: 'select',
            label: '',
            widthClassName: 'w-10',
            render: row => (
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    checked={selected.includes(row.id)}
                    onChange={() => toggle(row.id)}
                />
            ),
        },
        { key: 'name', label: 'Student', className: 'font-semibold text-gray-900' },
        { key: 'program', label: 'Program', className: 'text-gray-600', render: row => row.program ?? '-' },
        { key: 'year_level', label: 'Year', className: 'text-gray-600', render: row => getYearLabel(row.year_level) },
        {
            key: 'completed',
            label: 'Curriculum',
            render: row => (
                <span className="inline-flex items-center gap-2">
                    <span className="text-gray-700">{row.completed}/{row.required} passed</span>
                    <StatusBadge status="passed" label="Eligible" />
                </span>
            ),
        },
    ];

    return (
        <AuthenticatedLayout header="Graduation">
            <Head title="Graduation" />

            <div className="py-8">
                <div className="mx-auto max-w-5xl space-y-6 px-6">
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard label="Eligible to Graduate" value={candidates.length} accent="text-emerald-700" />
                        <StatCard label={`Graduated (S.Y. ${activeSchoolYear?.name ?? '—'})`} value={graduatedThisYear} />
                    </div>

                    <PagePanel
                        title="Graduation Candidates"
                        description="Students who have passed every course in their program curriculum with no pending INC or active subjects. Review and confirm."
                        action={
                            <PrimaryButton onClick={confirmGraduate} disabled={selected.length === 0 || processing}>
                                Graduate {selected.length > 0 ? `(${selected.length})` : ''}
                            </PrimaryButton>
                        }
                    >
                        {candidates.length > 0 && (
                            <label className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                />
                                Select all ({candidates.length})
                            </label>
                        )}
                        <DataTable
                            columns={columns}
                            rows={candidates}
                            emptyMessage="No students are eligible to graduate right now."
                            actions={row => (
                                <SecondaryButton type="button" onClick={() => setReviewStudentId(row.id)}>
                                    Review
                                </SecondaryButton>
                            )}
                        />
                    </PagePanel>
                </div>
            </div>

            <StudentReviewModal
                show={reviewStudentId !== null}
                studentId={reviewStudentId}
                onClose={() => setReviewStudentId(null)}
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
