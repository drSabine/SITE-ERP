import { BaseBarChart, ChartPanel, chartColors } from '@/Components/Charts';

const OUTCOMES = [
    { key: 'passed', label: 'Passed', color: chartColors.emerald },
    { key: 'failed', label: 'Failed', color: chartColors.red },
    { key: 'inc', label: 'INC', color: chartColors.amber },
    { key: 'dropped', label: 'Dropped', color: chartColors.gray },
];

export default function EvaluationOutcomeTrend({ data = [], isAnimationActive = true }) {
    return (
        <ChartPanel
            eyebrow="Evaluation"
            title="Outcome Trend"
            empty={data.length === 0}
            emptyMessage="No outcome analytics available."
        >
            <BaseBarChart
                data={data}
                xKey="schoolYear"
                series={OUTCOMES.map(outcome => ({
                    dataKey: outcome.key,
                    name: outcome.label,
                    fill: outcome.color,
                    stackId: 'outcomes',
                }))}
                isAnimationActive={isAnimationActive}
            />
        </ChartPanel>
    );
}
