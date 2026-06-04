import { DataTable, StatusBadge } from '@/Components/ui';

export default function StudentGradeTable({ students }) {
    const columns = [
        {
            key: 'student',
            label: 'Student',
            render: (studentRow) => `${studentRow.enrollment?.student?.last_name}, ${studentRow.enrollment?.student?.first_name}`,
        },
        {
            key: 'grade',
            label: 'Grade',
            render: (studentRow) => studentRow.final_grade !== null ? Number(studentRow.final_grade).toFixed(2) : 'INC',
        },
        {
            key: 'status',
            label: 'Status',
            render: (studentRow) => <StatusBadge status={studentRow.status} />,
        },
    ];

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Students under this teacher</p>
            <DataTable
                columns={columns}
                rows={students}
                emptyMessage="No students under this teacher assignment."
            />
        </div>
    );
}
