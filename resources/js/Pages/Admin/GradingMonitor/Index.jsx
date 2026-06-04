import GradingMonitorPage from '@/Components/GradingMonitor/GradingMonitorPage';

export default function Index(props) {
    return (
        <GradingMonitorPage
            {...props}
            indexRouteName="admin.grading-monitor.index"
            studentsRouteName="admin.grading-monitor.students"
            canManageFinalization
        />
    );
}
