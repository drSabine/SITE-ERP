import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    LineChart,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ChartPanel, chartColors } from '@/Components/Charts';
import { axisTick, chartStyle, legendStyle } from '@/Components/Charts/chartTheme';

// Keys whose values are percentages — the tooltip appends "%" for these.
const RATE_KEYS = new Set(['passRate', 'firstTakerRate', 'retakerRate', 'pctFirstTakers', 'pctRetakers']);

function ExamTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    return (
        <div className="border border-gray-200 bg-white px-2.5 py-2 shadow-sm">
            <p className="text-xs font-semibold text-gray-900">{label}</p>
            <div className="mt-1.5 space-y-1">
                {payload.map(item => (
                    <p key={item.dataKey} className="whitespace-nowrap text-[11px] text-gray-500">
                        <span className="font-semibold" style={{ color: item.color }}>{item.name}</span>
                        <span>: {item.value}{RATE_KEYS.has(item.dataKey) ? '%' : ''}</span>
                    </p>
                ))}
            </div>
        </div>
    );
}

function StatCard({ label, value, suffix = '', accent = 'text-gray-900' }) {
    return (
        <div className="border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}{suffix}</p>
        </div>
    );
}

export default function BoardExamAnalytics({ analytics = {}, isAnimationActive = true }) {
    const trend = analytics.intakeTrend ?? [];
    const summary = analytics.summary ?? {};
    const hasData = trend.length > 0;

    return (
        <div className="space-y-4">
            <div>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Board Exam Performance</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Takers" value={summary.totalTakers ?? 0} />
                    <StatCard label="Total Passers" value={summary.totalPassers ?? 0} accent="text-emerald-700" />
                    <StatCard label="Overall Pass Rate" value={summary.passRate ?? 0} suffix="%" accent="text-emerald-700" />
                    <StatCard label="Did Not Pass" value={summary.didNotPass ?? 0} accent="text-red-600" />
                </div>
            </div>

            <ChartPanel
                eyebrow="Licensure"
                title="Passers & Performance by Intake"
                empty={!hasData}
                emptyMessage="No board exam records yet. Record passers to see analytics."
                height="h-72"
            >
                <ComposedChart style={chartStyle} responsive data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} />
                    <YAxis
                        yAxisId="left"
                        width="auto"
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={axisTick}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 100]}
                        width="auto"
                        unit="%"
                        axisLine={false}
                        tickLine={false}
                        tick={axisTick}
                    />
                    <Tooltip content={<ExamTooltip />} wrapperStyle={{ zIndex: 10 }} />
                    <Legend iconType="square" verticalAlign="top" height={28} wrapperStyle={legendStyle} />
                    <Bar yAxisId="left" dataKey="passers" name="Passers" stackId="takers" fill={chartColors.emerald} isAnimationActive={isAnimationActive} />
                    <Bar yAxisId="left" dataKey="didNotPass" name="Did Not Pass" stackId="takers" fill={chartColors.gray} isAnimationActive={isAnimationActive} />
                    <Line yAxisId="right" type="monotone" dataKey="passRate" name="Pass Rate" stroke={chartColors.amber} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={isAnimationActive} />
                </ComposedChart>
            </ChartPanel>

            <div className="grid gap-4 md:grid-cols-2">
                <ChartPanel
                    eyebrow="Composition"
                    title="First-Takers vs Retakers by Intake"
                    empty={!hasData}
                    emptyMessage="No board exam records yet."
                    height="h-64"
                >
                    <ComposedChart style={chartStyle} responsive data={trend} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} />
                        <YAxis width="auto" allowDecimals={false} axisLine={false} tickLine={false} tick={axisTick} />
                        <Tooltip content={<ExamTooltip />} wrapperStyle={{ zIndex: 10 }} />
                        <Legend iconType="square" verticalAlign="top" height={28} wrapperStyle={legendStyle} />
                        <Bar dataKey="firstTakers" name="First-Takers" stackId="composition" fill={chartColors.emerald} isAnimationActive={isAnimationActive} />
                        <Bar dataKey="retakers" name="Retakers" stackId="composition" fill={chartColors.amber} isAnimationActive={isAnimationActive} />
                    </ComposedChart>
                </ChartPanel>

                <ChartPanel
                    eyebrow="Performance"
                    title="Passing Rate: First-Takers vs Retakers"
                    empty={!hasData}
                    emptyMessage="No board exam records yet."
                    height="h-64"
                >
                    <LineChart style={chartStyle} responsive data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} />
                        <YAxis domain={[0, 100]} width="auto" unit="%" axisLine={false} tickLine={false} tick={axisTick} />
                        <Tooltip content={<ExamTooltip />} wrapperStyle={{ zIndex: 10 }} />
                        <Legend iconType="square" verticalAlign="top" height={28} wrapperStyle={legendStyle} />
                        <Line type="monotone" dataKey="firstTakerRate" name="First-Takers" stroke={chartColors.emerald} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={isAnimationActive} />
                        <Line type="monotone" dataKey="retakerRate" name="Retakers" stroke={chartColors.amber} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={isAnimationActive} />
                        <Line type="monotone" dataKey="passRate" name="Overall" stroke={chartColors.gray} strokeWidth={2} strokeDasharray="4 3" dot={false} isAnimationActive={isAnimationActive} />
                    </LineChart>
                </ChartPanel>
            </div>
        </div>
    );
}
