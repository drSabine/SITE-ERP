import {
    AreaChart, Area,
    BarChart, Bar,
    CartesianGrid, Tooltip, XAxis, YAxis, Legend,
} from 'recharts';
import { ChartPanel, chartColors } from '@/Components/Charts';
import { axisTick, chartStyle, legendStyle } from '@/Components/Charts/chartTheme';

function PercentTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="border border-gray-200 bg-white px-2.5 py-2 shadow-sm">
            <p className="text-xs font-semibold text-gray-900">{label}</p>
            <div className="mt-1.5 space-y-1">
                {payload.map(item => (
                    <p key={item.dataKey} className="whitespace-nowrap text-[11px] text-gray-500">
                        <span className="font-semibold" style={{ color: item.color }}>{item.name}</span>
                        <span>: {item.value}%</span>
                    </p>
                ))}
            </div>
        </div>
    );
}

const PROGRAM_COLORS = {
    bsense: chartColors.emerald,
    bsce:   chartColors.amber,
};

function getProgramColor(code) {
    return PROGRAM_COLORS[code.toLowerCase()] ?? chartColors.gray;
}

function deriveSeries(data, exclude = []) {
    if (!data.length) return [];
    return Object.keys(data[0])
        .filter(key => !exclude.includes(key))
        .map(key => ({
            dataKey: key,
            name:    key.toUpperCase(),
            fill:    getProgramColor(key),
            stroke:  getProgramColor(key),
        }));
}

function SummaryCard({ label, value, sub }) {
    return (
        <div className="border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
        </div>
    );
}

export default function PassingRateAnalytics({ analytics }) {
    const { trend = [], programComparison = [], summaryStats = {} } = analytics ?? {};

    const trendSeries      = deriveSeries(trend, ['period']);
    const comparisonSeries = deriveSeries(programComparison, ['year']);

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SummaryCard
                    label="Overall Pass Rate"
                    value={summaryStats.totalRecords ? `${summaryStats.overallRate}%` : '—'}
                    sub="Across all board exam periods"
                />
                <SummaryCard
                    label="Highest Recorded"
                    value={summaryStats.highest ? `${summaryStats.highest.rate}%` : '—'}
                    sub={summaryStats.highest ? `${summaryStats.highest.program} · ${summaryStats.highest.period}` : 'No data yet'}
                />
                <SummaryCard
                    label="Total Records Logged"
                    value={summaryStats.totalRecords ?? 0}
                    sub="Board exam periods recorded"
                />
            </div>

            {/* Trend + Comparison side by side */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ChartPanel
                    eyebrow="Pass Rate"
                    title="Trend Over Time"
                    empty={!trend.length}
                    emptyMessage="No records yet. Add board exam results to see trends."
                    height="h-64"
                >
                    <AreaChart style={chartStyle} responsive data={trend} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="period" axisLine={false} tickLine={false} tick={axisTick} />
                        <YAxis domain={[0, 100]} width={36} axisLine={false} tickLine={false} tick={axisTick} tickFormatter={value => `${value}%`} />
                        <Tooltip content={<PercentTooltip />} wrapperStyle={{ zIndex: 10 }} />
                        <Legend iconType="square" verticalAlign="top" height={28} wrapperStyle={legendStyle} />
                        {trendSeries.map(series => (
                            <Area
                                key={series.dataKey}
                                type="monotone"
                                dataKey={series.dataKey}
                                name={series.name}
                                stroke={series.stroke}
                                fill={series.fill}
                                fillOpacity={0.18}
                            />
                        ))}
                    </AreaChart>
                </ChartPanel>

                <ChartPanel
                    eyebrow="Program"
                    title="Year-over-Year Comparison"
                    empty={!programComparison.length}
                    emptyMessage="Not enough data for year-over-year comparison."
                    height="h-64"
                >
                    <BarChart style={chartStyle} responsive data={programComparison} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={axisTick} />
                        <YAxis domain={[0, 100]} width={36} axisLine={false} tickLine={false} tick={axisTick} tickFormatter={value => `${value}%`} />
                        <Tooltip content={<PercentTooltip />} wrapperStyle={{ zIndex: 10 }} />
                        <Legend iconType="square" verticalAlign="top" height={28} wrapperStyle={legendStyle} />
                        {comparisonSeries.map(series => (
                            <Bar key={series.dataKey} dataKey={series.dataKey} name={series.name} fill={series.fill} />
                        ))}
                    </BarChart>
                </ChartPanel>
            </div>
        </div>
    );
}
