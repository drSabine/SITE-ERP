import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, ConfirmModal, DataTable, PagePanel, ActionsDropdown } from '@/Components/ui';
import { DownloadIcon } from '@/Components/ui/Icons';
import { BoardExamAnalytics } from '@/Components/Dashboard';
import { BoardExamFormModal } from '@/Components/BoardExam';
import { useBoardExams } from './useBoardExams';

export default function Index({ results, programs = [], months = {}, analytics = {} }) {
    const isAdmin = usePage().props.auth.user.role === 'admin';
    const {
        showForm, setShowForm, editTarget,
        confirm, setConfirm,
        openCreate, openEdit, requestDelete,
    } = useBoardExams();

    const columns = [
        { key: 'exam_name', label: 'Exam', className: 'font-medium text-gray-900' },
        { key: 'program', label: 'Program', className: 'font-mono text-xs text-emerald-800' },
        { key: 'intake', label: 'Intake', className: 'text-gray-600' },
        { key: 'total_takers', label: 'Takers', className: 'text-gray-700' },
        { key: 'total_passers', label: 'Passers', className: 'font-semibold text-emerald-700' },
        {
            key: 'pass_rate',
            label: 'Pass Rate',
            render: row => <span className="font-semibold text-gray-900">{row.pass_rate}%</span>,
        },
    ];

    return (
        <AuthenticatedLayout header="Board Exam Passers">
            <Head title="Board Exam Passers" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-6">
                    <BoardExamAnalytics analytics={analytics} />

                    <PagePanel
                        title="Board Exam Records"
                        description="Record engineering licensure passers per intake. Counts only, no individual student data."
                        action={
                            <div className="flex items-center gap-2">
                                {isAdmin && (
                                    <Link
                                        href={route('admin.reports.board-exams')}
                                        className="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                                    >
                                        <DownloadIcon className="h-4 w-4" /> Export PDF
                                    </Link>
                                )}
                                <PrimaryButton onClick={openCreate}>+ Record Passers</PrimaryButton>
                            </div>
                        }
                    >
                        <DataTable
                            columns={columns}
                            rows={results.data}
                            pagination={results}
                            emptyMessage="No board exam records yet. Record passers to get started."
                            actions={result => (
                                <ActionsDropdown items={[
                                    { label: 'Edit', onClick: () => openEdit(result) },
                                    { label: 'Delete', onClick: () => requestDelete(result), variant: 'danger' },
                                ]} />
                            )}
                        />
                    </PagePanel>
                </div>
            </div>

            <BoardExamFormModal
                show={showForm}
                editTarget={editTarget}
                programs={programs}
                months={months}
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
