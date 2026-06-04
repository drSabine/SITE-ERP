import { BaseAreaChart, ChartPanel, chartColors } from '@/Components/Charts';

const SERIES = [
    { dataKey: 'evaluatedStudents', name: 'Students', fill: chartColors.emerald, stroke: chartColors.emerald },
];

export default function SchoolYearEvaluationTrend({ data = [], isAnimationActive = true }) {
    return (
        <ChartPanel
            eyebrow="Analytics"
            title="Student Evaluation Trend"
            empty={data.length === 0}
            emptyMessage="No school-year analytics available."
        >
            <BaseAreaChart
                data={data}
                xKey="schoolYear"
                series={SERIES}
                isAnimationActive={isAnimationActive}
            />
        </ChartPanel>
    );
}
