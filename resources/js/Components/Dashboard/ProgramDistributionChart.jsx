import { BaseBarChart, ChartPanel, chartColors } from '@/Components/Charts';

const SERIES = [
    { dataKey: 'students', name: 'Students', fill: chartColors.emerald },
];

export default function ProgramDistributionChart({ data = [], isAnimationActive = true }) {
    return (
        <ChartPanel
            eyebrow="Current School Year"
            title="Program Distribution"
            empty={data.length === 0}
            emptyMessage="No program analytics available."
        >
            <BaseBarChart
                data={data}
                xKey="program"
                series={SERIES}
                isAnimationActive={isAnimationActive}
            />
        </ChartPanel>
    );
}
