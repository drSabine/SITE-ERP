import { DataTable, StatusBadge } from '@/Components/ui';
import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

export default function EvaluationHistoryGroup({ group, onManageClick }) {
    const columns = [
        {
            key: 'semester',
            label: 'Semester',
            render: enrollment => getSemesterLabel(enrollment.academic_term?.semester),
        },
        {
            key: 'year_level',
            label: 'Year',
            render: enrollment => getYearLabel(enrollment.year_level),
            className: 'text-gray-500',
        },
        {
            key: 'courses',
            label: 'Courses',
            render: enrollment => {
                const activeCount = (enrollment.enrollment_courses ?? []).filter(
                    enrollmentCourse => ['active', 'inc'].includes(enrollmentCourse.status)
                ).length;
                const incCount = (enrollment.enrollment_courses ?? []).filter(
                    enrollmentCourse => enrollmentCourse.status === 'inc'
                ).length;

                return (
                    <span className="text-gray-600">
                        {activeCount} course{activeCount !== 1 ? 's' : ''}
                        {incCount > 0 && (
                            <span className="ml-1.5 font-semibold text-orange-600">{incCount} INC</span>
                        )}
                    </span>
                );
            },
        },
        {
            key: 'status',
            label: 'Status',
            render: enrollment => <StatusBadge status={enrollment.status} />,
        },
    ];

    return (
        <div className="border border-gray-200">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    S.Y. {group.name}
                </p>
            </div>
            <DataTable
                compact
                columns={columns}
                rows={group.enrollments}
                emptyMessage="No records for this school year."
                actions={enrollment => (
                    <button
                        type="button"
                        onClick={() => onManageClick(enrollment)}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                    >
                        Manage
                    </button>
                )}
            />
        </div>
    );
}
