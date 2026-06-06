import { Link } from '@inertiajs/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartPanel, chartColors } from '@/Components/Charts';
import { axisTick, chartStyle } from '@/Components/Charts/chartTheme';

const PROGRAM_COLORS = {
    bsense: chartColors.emerald,
    bsce:   chartColors.amber,
};

function getProgramColor(code) {
    return PROGRAM_COLORS[code?.toLowerCase()] ?? chartColors.gray;
}

function RateBadge({ rate }) {
    const color = rate >= 75 ? 'text-emerald-700' : rate >= 50 ? 'text-amber-600' : 'text-red-600';
    return <span className={`text-2xl font-bold ${color}`}>{rate}%</span>;
}

export default function PassingRatePreview({ preview = {} }) {
    const { latest = [], miniChart = [] } = preview;

    const hasMiniChart = miniChart.length > 0;
    const programCodes = hasMiniChart
        ? Object.keys(miniChart[0]).filter(key => key !== 'period')
        : [];

    return (
        <div className="border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Board Exams</p>
                    <h2 className="mt-0.5 text-sm font-semibold text-gray-900">Latest Passing Rates</h2>
                </div>
                <Link
                    href={route('coordinator.passing-rates.index')}
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                >
                    View All →
                </Link>
            </div>

            {!latest.length ? (
                <div className="flex h-24 items-center justify-center">
                    <p className="text-xs text-gray-400">No passing rate records yet.</p>
                </div>
            ) : (
                <div className="p-4 space-y-4">
                    {/* Latest rate cards */}
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(latest.length, 3)}, minmax(0, 1fr))` }}>
                        {latest.map(item => (
                            <div key={item.programCode} className="border border-gray-100 bg-gray-50 px-3 py-2.5">
                                <p className="text-xs font-semibold text-gray-500">{item.programCode}</p>
                                <RateBadge rate={item.rate} />
                                <p className="text-[10px] text-gray-400">as of {item.period}</p>
                            </div>
                        ))}
                    </div>

                    {/* Mini trend chart */}
                    {hasMiniChart && (
                        <div className="h-28">
                            <BarChart style={chartStyle} responsive data={miniChart} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={axisTick} />
                                <YAxis domain={[0, 100]} width={30} axisLine={false} tickLine={false} tick={axisTick} tickFormatter={value => `${value}%`} />
                                <Tooltip formatter={(value, name) => [`${value}%`, name?.toUpperCase()]} />
                                {programCodes.map(code => (
                                    <Bar key={code} dataKey={code} name={code} fill={getProgramColor(code)} />
                                ))}
                            </BarChart>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
