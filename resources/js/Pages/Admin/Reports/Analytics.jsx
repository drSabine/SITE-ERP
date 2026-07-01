import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ReportDocument, ReportStats, ReportSection, ReportTable } from '@/Components/Reports/ReportDocument';

const SEMESTER_LABELS = { first: 'First Semester', second: 'Second Semester', summer: 'Summer' };

export default function Analytics({ generatedAt, activeTerm, studentCount = 0, enrolledCount = 0, analytics = {} }) {
    const evalTrend = analytics.schoolYearEvaluationTrend ?? [];
    const outcomes = analytics.evaluationOutcomeTrend ?? [];
    const population = analytics.programDistribution ?? [];
    const graduates = analytics.graduateTrend ?? [];

    const schoolYearName = activeTerm?.school_year?.name ?? '—';
    const semesterLabel = activeTerm ? (SEMESTER_LABELS[activeTerm.semester] ?? activeTerm.semester) : '—';

    const outcomeTotals = outcomes.reduce(
        (acc, r) => ({
            passed: acc.passed + r.passed,
            failed: acc.failed + r.failed,
            inc: acc.inc + r.inc,
            dropped: acc.dropped + r.dropped,
        }),
        { passed: 0, failed: 0, inc: 0, dropped: 0 },
    );
    const outcomeGrand = outcomeTotals.passed + outcomeTotals.failed + outcomeTotals.inc + outcomeTotals.dropped;

    const populationRows = population.map(r => {
        const bsit = r.bsit ?? 0;
        const bsce = Math.abs(r.bsce ?? 0);
        return { yearLevel: r.yearLevel, bsit, bsce, total: bsit + bsce };
    });
    const popTotals = populationRows.reduce(
        (acc, r) => ({ bsit: acc.bsit + r.bsit, bsce: acc.bsce + r.bsce, total: acc.total + r.total }),
        { bsit: 0, bsce: 0, total: 0 },
    );

    return (
        <AuthenticatedLayout header="Analytics Report">
            <Head title="Analytics Report" />

            <ReportDocument
                title="Institutional Analytics Report"
                subtitle="Enrollment, population, evaluation and graduate trends across all programs."
                generatedAt={generatedAt}
                backHref={route('dashboard')}
                autoPrint
            >
                <ReportStats
                    items={[
                        { label: 'Total Active Students', value: studentCount, accent: 'text-emerald-700' },
                        { label: 'Currently Enrolled', value: enrolledCount, accent: 'text-emerald-700' },
                        { label: 'Current School Year', value: schoolYearName },
                        { label: 'Active Term', value: semesterLabel },
                    ]}
                />

                <ReportSection title="Student Evaluation Trend" description="Distinct students evaluated per school year.">
                    <ReportTable
                        columns={[
                            { key: 'schoolYear', label: 'School Year' },
                            { key: 'evaluatedStudents', label: 'Evaluated Students', align: 'right' },
                        ]}
                        rows={evalTrend}
                        emptyMessage="No evaluation data."
                    />
                </ReportSection>

                <ReportSection title="Evaluation Outcome" description="Course-level outcomes per school year.">
                    <ReportTable
                        columns={[
                            { key: 'schoolYear', label: 'School Year' },
                            { key: 'passed', label: 'Passed', align: 'right' },
                            { key: 'failed', label: 'Failed', align: 'right' },
                            { key: 'inc', label: 'INC', align: 'right' },
                            { key: 'dropped', label: 'Dropped', align: 'right' },
                            { key: 'total', label: 'Total', align: 'right', render: r => r.passed + r.failed + r.inc + r.dropped },
                        ]}
                        rows={outcomes}
                        footer={['Total', outcomeTotals.passed, outcomeTotals.failed, outcomeTotals.inc, outcomeTotals.dropped, outcomeGrand]}
                        emptyMessage="No outcome data."
                    />
                </ReportSection>

                <ReportSection title="Program Population" description={`Students per year level for S.Y. ${schoolYearName}.`}>
                    <ReportTable
                        columns={[
                            { key: 'yearLevel', label: 'Year Level' },
                            { key: 'bsit', label: 'BSIT', align: 'right' },
                            { key: 'bsce', label: 'BSCE', align: 'right' },
                            { key: 'total', label: 'Total', align: 'right' },
                        ]}
                        rows={populationRows}
                        footer={['Total', popTotals.bsit, popTotals.bsce, popTotals.total]}
                        emptyMessage="No population data for the active school year."
                    />
                </ReportSection>

                <ReportSection title="Graduates" description="Graduates per school year against the year-over-year growth target.">
                    <ReportTable
                        columns={[
                            { key: 'schoolYear', label: 'School Year' },
                            { key: 'graduates', label: 'Graduates', align: 'right' },
                            { key: 'target', label: 'Growth Target', align: 'right' },
                            { key: 'needed', label: 'Shortfall', align: 'right', render: r => (r.needed > 0 ? r.needed : '—') },
                        ]}
                        rows={graduates}
                        emptyMessage="No graduate data."
                    />
                </ReportSection>
            </ReportDocument>
        </AuthenticatedLayout>
    );
}
