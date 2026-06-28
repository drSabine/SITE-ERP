import { ChartPanel, BaseBarChart, chartColors } from '@/Components/Charts';

function StatCard({ label, value, accent = 'text-gray-900' }) {
    return (
        <div className="border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
        </div>
    );
}

export default function CoordinatorIncAnalytics({ analytics = {} }) {
    const trend = analytics.incTrend ?? [];
    const byProgram = analytics.incByProgram ?? [];
    const summary = analytics.summary ?? {};

    const hasTrend = trend.some(row => row.inc > 0);
    const hasProgram = byProgram.some(row => row.inc > 0);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="INC (Active S.Y.)" value={summary.totalInc ?? 0} accent="text-amber-600" />
                <StatCard label="Evaluated Students" value={summary.evaluatedStudents ?? 0} />
                <StatCard label="Avg INC / Student" value={summary.avgIncPerStudent ?? 0} accent="text-amber-600" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <ChartPanel
                    eyebrow="Deficiency"
                    title="INC Trend by School Year"
                    empty={!hasTrend}
                    emptyMessage="No INC records yet."
                    height="h-64"
                >
                    <BaseBarChart
                        data={trend}
                        xKey="schoolYear"
                        series={[{ dataKey: 'inc', name: 'INC', fill: chartColors.amber }]}
                    />
                </ChartPanel>

                <ChartPanel
                    eyebrow="Deficiency"
                    title="INC by Program (Active S.Y.)"
                    empty={!hasProgram}
                    emptyMessage="No INC records for the active school year."
                    height="h-64"
                >
                    <BaseBarChart
                        data={byProgram}
                        xKey="program"
                        series={[{ dataKey: 'inc', name: 'INC', fill: chartColors.amber }]}
                    />
                </ChartPanel>
            </div>
        </div>
    );
}
