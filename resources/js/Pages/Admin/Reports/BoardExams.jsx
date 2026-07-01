import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ReportDocument, ReportStats, ReportSection, ReportTable } from '@/Components/Reports/ReportDocument';

export default function BoardExams({ generatedAt, records = [], analytics = {} }) {
    const summary = analytics.summary ?? {};
    const intakeTrend = analytics.intakeTrend ?? [];

    const intakeTotals = intakeTrend.reduce(
        (acc, r) => ({ takers: acc.takers + r.takers, passers: acc.passers + r.passers }),
        { takers: 0, passers: 0 },
    );
    const intakeRate = intakeTotals.takers > 0 ? Math.round((intakeTotals.passers / intakeTotals.takers) * 1000) / 10 : 0;

    return (
        <AuthenticatedLayout header="Board Exam Report">
            <Head title="Board Exam Report" />

            <ReportDocument
                title="Board Exam Passers Report"
                subtitle="Engineering licensure results (BSCE, BSENSE) · aggregate counts per intake."
                generatedAt={generatedAt}
                backHref={route('board-exams.index')}
                autoPrint
            >
                <ReportStats
                    items={[
                        { label: 'Total Takers', value: summary.totalTakers ?? 0 },
                        { label: 'Total Passers', value: summary.totalPassers ?? 0, accent: 'text-emerald-700' },
                        { label: 'Overall Pass Rate', value: `${summary.passRate ?? 0}%`, accent: 'text-emerald-700' },
                        { label: 'Did Not Pass', value: summary.didNotPass ?? 0 },
                        { label: 'First-Taker Rate', value: `${summary.firstTakerRate ?? 0}%` },
                        { label: 'Retaker Rate', value: `${summary.retakerRate ?? 0}%` },
                        { label: 'Intakes Recorded', value: summary.intakeCount ?? 0 },
                    ]}
                />

                <ReportSection title="Per-Intake Trend" description="Combined first-takers and retakers per exam intake.">
                    <ReportTable
                        columns={[
                            { key: 'label', label: 'Intake' },
                            { key: 'takers', label: 'Takers', align: 'right' },
                            { key: 'passers', label: 'Passers', align: 'right' },
                            { key: 'passRate', label: 'Pass Rate', align: 'right', render: r => `${r.passRate}%` },
                        ]}
                        rows={intakeTrend}
                        footer={['Total', intakeTotals.takers, intakeTotals.passers, `${intakeRate}%`]}
                        emptyMessage="No intake data."
                    />
                </ReportSection>

                <ReportSection title="Detailed Records" description="Every recorded board-exam result, newest first.">
                    <ReportTable
                        columns={[
                            { key: 'exam_name', label: 'Exam' },
                            { key: 'program', label: 'Program' },
                            { key: 'intake', label: 'Intake' },
                            { key: 'first', label: 'First (Pass/Take)', align: 'right', render: r => `${r.first_taker_passers}/${r.first_takers}` },
                            { key: 'retaker', label: 'Retaker (Pass/Take)', align: 'right', render: r => `${r.retaker_passers}/${r.retakers}` },
                            { key: 'total_passers', label: 'Passers', align: 'right' },
                            { key: 'pass_rate', label: 'Pass Rate', align: 'right', render: r => `${r.pass_rate}%` },
                        ]}
                        rows={records}
                        emptyMessage="No board exam records yet."
                    />
                </ReportSection>
            </ReportDocument>
        </AuthenticatedLayout>
    );
}
