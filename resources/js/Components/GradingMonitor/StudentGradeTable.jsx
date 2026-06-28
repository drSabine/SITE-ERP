import { DataTable, StatusBadge } from '@/Components/ui';

function gradeDisplay(studentRow) {
    if (studentRow.status === 'dropped') return '—';
    if (studentRow.final_grade !== null && studentRow.final_grade !== undefined) {
        return Number(studentRow.final_grade).toFixed(2);
    }
    if (studentRow.status === 'inc') return 'INC';
    return '—';
}

export default function StudentGradeTable({ students }) {
    const columns = [
        {
            key: 'student',
            label: 'Student',
            render: (studentRow) =>
                `${studentRow.enrollment?.student?.last_name ?? '-'}, ${studentRow.enrollment?.student?.first_name ?? '-'}`,
        },
        {
            key: 'grade',
            label: 'Grade',
            className: 'tabular-nums',
            render: (studentRow) => {
                const value = gradeDisplay(studentRow);
                const isInc = studentRow.status === 'inc';
                const isFailed = studentRow.status === 'failed' || Number(studentRow.final_grade) === 5;
                return (
                    <span className={isInc ? 'font-semibold text-orange-600' : isFailed ? 'font-semibold text-red-600' : ''}>
                        {value}
                    </span>
                );
            },
        },
        {
            key: 'status',
            label: 'Status',
            render: (studentRow) => <StatusBadge status={studentRow.status} />,
        },
    ];

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Students under this teacher
            </p>
            <DataTable
                compact
                columns={columns}
                rows={students}
                emptyMessage="No students under this teacher assignment."
            />
        </div>
    );
}
