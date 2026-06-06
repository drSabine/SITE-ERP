import { Area, AreaChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartPanel, ChartTooltip, chartColors } from '@/Components/Charts';
import { axisTick, chartStyle, legendStyle } from '@/Components/Charts/chartTheme';

// Stacked bottom-to-top: passed (largest/good) anchors the base; failures stack above.
const AREAS = [
    { dataKey: 'passed',  name: 'Passed',  stroke: chartColors.emerald, fill: chartColors.emerald },
    { dataKey: 'dropped', name: 'Dropped', stroke: chartColors.gray,    fill: chartColors.gray    },
    { dataKey: 'inc',     name: 'INC',     stroke: chartColors.amber,   fill: chartColors.amber   },
    { dataKey: 'failed',  name: 'Failed',  stroke: chartColors.red,     fill: chartColors.red     },
];

export default function EvaluationOutcomeTrend({ data = [], isAnimationActive = true }) {
    const hasData = data.some((year) => year.passed + year.failed + year.inc + year.dropped > 0);

    return (
        <ChartPanel
            eyebrow="Evaluation"
            title="Outcome Trend by School Year"
            empty={!hasData}
            emptyMessage="No outcome analytics available."
            height="h-64"
        >
            <AreaChart
                style={chartStyle}
                responsive
                data={data}
                margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
            >
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="schoolYear"
                    axisLine={false}
                    tickLine={false}
                    tick={axisTick}
                />
                <YAxis
                    width="auto"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={axisTick}
                />
                <Tooltip content={<ChartTooltip />} wrapperStyle={{ zIndex: 10 }} />
                <Legend iconType="square" verticalAlign="top" height={28} wrapperStyle={legendStyle} />
                {AREAS.map((area) => (
                    <Area
                        key={area.dataKey}
                        type="monotone"
                        dataKey={area.dataKey}
                        name={area.name}
                        stackId="outcomes"
                        stroke={area.stroke}
                        fill={area.fill}
                        fillOpacity={0.75}
                        isAnimationActive={isAnimationActive}
                    />
                ))}
            </AreaChart>
        </ChartPanel>
    );
}
