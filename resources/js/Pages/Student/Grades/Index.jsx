import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, StatusBadge, PrimaryButton } from '@/Components/ui';
import { PrintIcon } from '@/Components/ui/Icons';
import { getYearLabel } from '@/Components/Coordinator/Shared';
import { formatGrade, formatGwa, termTitle } from '@/utils/grades';

function studentName(student) {
    return `${student.last_name}, ${student.first_name}${student.middle_name ? ` ${student.middle_name}` : ''}${student.suffix ? ` ${student.suffix}` : ''}`;
}

function gradeCell(course) {
    const value = formatGrade(course);
    const isInc = course.status === 'inc';
    const isFailed = course.status === 'failed' || Number(course.final_grade) === 5;
    return (
        <span className={`tabular-nums font-semibold ${isInc ? 'text-orange-600' : isFailed ? 'text-red-600' : 'text-gray-900'}`}>
            {value}
        </span>
    );
}

const COLUMNS = [
    { key: 'code', label: 'Code', render: c => c.course_code, className: 'font-mono text-xs text-emerald-800' },
    { key: 'title', label: 'Subject', render: c => c.title, className: 'text-gray-800' },
    { key: 'units', label: 'Units', headerClass: 'text-center', className: 'text-center text-gray-600', render: c => c.units },
    { key: 'grade', label: 'Grade', headerClass: 'text-center', className: 'text-center', render: gradeCell },
    { key: 'status', label: 'Status', headerClass: 'text-center', className: 'text-center', render: c => <StatusBadge status={c.status} /> },
];

export default function Index({ student, terms = [], overallGwa }) {
    return (
        <AuthenticatedLayout header="My Grades">
            <Head title="My Grades" />

            <div className="py-8">
                <div className="mx-auto max-w-5xl space-y-6 px-6">
                    {/* Header */}
                    <section className="border border-gray-200 bg-white shadow-sm">
                        <div className="grid gap-px bg-gray-200 md:grid-cols-3">
                            <div className="bg-white p-5 md:col-span-2">
                                <h1 className="text-lg font-bold text-gray-900">{studentName(student)}</h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    {student.program?.code} · {student.program?.name} · {getYearLabel(student.year_level)}
                                </p>
                                <div className="mt-3 print:hidden">
                                    <PrimaryButton type="button" onClick={() => window.print()}>
                                        <PrintIcon className="mr-1.5 h-4 w-4" /> Print
                                    </PrimaryButton>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center bg-white p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Overall GWA</p>
                                <p className="mt-1 text-3xl font-bold text-emerald-700">{formatGwa(overallGwa)}</p>
                            </div>
                        </div>
                    </section>

                    {terms.length === 0 ? (
                        <div className="border border-gray-200 bg-white px-5 py-16 text-center text-sm text-gray-400 shadow-sm">
                            No grade records yet.
                        </div>
                    ) : (
                        terms.map(term => (
                            <section key={term.enrollment_id} className="border border-gray-200 bg-white shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-3">
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-900">{termTitle(term)}</h2>
                                        <p className="text-xs text-gray-400">
                                            {getYearLabel(term.year_level)}
                                            {term.is_active && <span className="ml-2 font-semibold uppercase tracking-wide text-emerald-700">In Progress</span>}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {term.inc_count > 0 && <StatusBadge status="inc" label={`${term.inc_count} INC`} />}
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Term GWA</p>
                                            <p className="text-lg font-bold text-gray-900">{formatGwa(term.gwa)}</p>
                                        </div>
                                    </div>
                                </div>
                                <DataTable
                                    compact
                                    columns={COLUMNS}
                                    rows={term.courses}
                                    emptyMessage="No subjects recorded for this term."
                                />
                            </section>
                        ))
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
