import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartPanel, chartColors } from '@/Components/Charts';
import { axisTick, chartStyle, legendStyle } from '@/Components/Charts/chartTheme';

function PyramidTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="border border-gray-200 bg-white px-2.5 py-2 shadow-sm">
            <p className="text-xs font-semibold text-gray-900">{label}</p>
            <div className="mt-1.5 space-y-1">
                {payload.map((item) => (
                    <p key={item.dataKey} className="whitespace-nowrap text-[11px] text-gray-500">
                        <span className="font-semibold" style={{ color: item.color }}>{item.name}</span>
                        <span>: {Math.abs(item.value)} students</span>
                    </p>
                ))}
            </div>
        </div>
    );
}

export default function ProgramDistributionChart({ data = [], isAnimationActive = true }) {
    return (
        <ChartPanel
            eyebrow="Current School Year"
            title="Enrollment by Year Level"
            empty={data.length === 0}
            emptyMessage="No program analytics available."
        >
            <BarChart
                style={chartStyle}
                responsive
                layout="vertical"
                data={data}
                stackOffset="sign"
                margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
            >
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" horizontal={false} />
                <XAxis
                    type="number"
                    tickFormatter={(value) => Math.abs(value)}
                    axisLine={false}
                    tickLine={false}
                    tick={axisTick}
                    allowDecimals={false}
                />
                <YAxis
                    type="category"
                    dataKey="yearLevel"
                    width={60}
                    axisLine={false}
                    tickLine={false}
                    tick={axisTick}
                />
                <Tooltip content={<PyramidTooltip />} wrapperStyle={{ zIndex: 10 }} />
                <Legend iconType="square" verticalAlign="top" height={28} wrapperStyle={legendStyle} />
                <Bar
                    stackId="pyramid"
                    name="BSIT"
                    dataKey="bsit"
                    fill={chartColors.emerald}
                    isAnimationActive={isAnimationActive}
                    radius={[0, 3, 3, 0]}
                />
                <Bar
                    stackId="pyramid"
                    name="BSCE"
                    dataKey="bsce"
                    fill={chartColors.amber}
                    isAnimationActive={isAnimationActive}
                    radius={[3, 0, 0, 3]}
                />
            </BarChart>
        </ChartPanel>
    );
}
