import { Area, CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartPanel, ChartTooltip, chartColors } from '@/Components/Charts';
import { axisTick, chartStyle, legendStyle } from '@/Components/Charts/chartTheme';

/**
 * Graduates as a filled area, with the year-over-year growth target as a dashed line
 * (beat the previous year by one). When the area sits below the line, the program fell
 * short of growing its graduate output that year.
 */
export default function GraduateTrendChart({ data = [], isAnimationActive = true }) {
    const hasData = data.some(row => row.graduates > 0 || row.target > 0);

    return (
        <ChartPanel
            eyebrow="Population"
            title="Graduates vs. Growth Target (Last 3 S.Y.)"
            empty={!hasData}
            emptyMessage="No graduation records yet."
            height="h-64"
        >
            <ComposedChart style={chartStyle} responsive data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="schoolYear" axisLine={false} tickLine={false} tick={axisTick} />
                <YAxis width="auto" allowDecimals={false} axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip content={<ChartTooltip />} wrapperStyle={{ zIndex: 10 }} />
                <Legend iconType="plainline" verticalAlign="top" height={28} wrapperStyle={legendStyle} />
                <Area
                    type="monotone"
                    dataKey="graduates"
                    name="Graduates"
                    stroke={chartColors.emerald}
                    fill={chartColors.emerald}
                    fillOpacity={0.18}
                    strokeWidth={2}
                    isAnimationActive={isAnimationActive}
                />
                <Line
                    type="monotone"
                    dataKey="target"
                    name="Growth target"
                    stroke={chartColors.amber}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={{ r: 3 }}
                    isAnimationActive={isAnimationActive}
                />
            </ComposedChart>
        </ChartPanel>
    );
}
