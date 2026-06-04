import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import { axisTick, chartColors, chartStyle, legendStyle } from './chartTheme';

export default function BaseBarChart({
    data = [],
    xKey,
    series = [],
    chartProps = {},
    xAxisProps = {},
    yAxisProps = {},
    isAnimationActive = true,
}) {
    return (
        <BarChart
            style={chartStyle}
            responsive
            data={data}
            {...chartProps}
        >
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
                dataKey={xKey}
                axisLine={false}
                tickLine={false}
                tick={axisTick}
                {...xAxisProps}
            />
            <YAxis
                width="auto"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={axisTick}
                {...yAxisProps}
            />
            <Tooltip content={<ChartTooltip />} wrapperStyle={{ zIndex: 10 }} />
            <Legend iconType="square" verticalAlign="top" height={28} wrapperStyle={legendStyle} />
            {series.map(item => (
                <Bar
                    key={item.dataKey}
                    dataKey={item.dataKey}
                    name={item.name}
                    stackId={item.stackId}
                    fill={item.fill}
                    isAnimationActive={isAnimationActive}
                />
            ))}
        </BarChart>
    );
}
