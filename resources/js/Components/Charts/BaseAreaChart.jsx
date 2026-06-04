import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import { axisTick, chartColors, chartStyle, legendStyle } from './chartTheme';

export default function BaseAreaChart({
    data = [],
    xKey,
    series = [],
    chartProps = {},
    xAxisProps = {},
    yAxisProps = {},
    isAnimationActive = true,
}) {
    return (
        <AreaChart
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
                <Area
                    key={item.dataKey}
                    type="monotone"
                    dataKey={item.dataKey}
                    name={item.name}
                    stroke={item.stroke ?? item.fill}
                    fill={item.fill}
                    fillOpacity={item.fillOpacity ?? 0.18}
                    isAnimationActive={isAnimationActive}
                />
            ))}
        </AreaChart>
    );
}
