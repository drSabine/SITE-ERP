import GradingMonitorPage from '@/Components/GradingMonitor/GradingMonitorPage';

export default function Index(props) {
    return (
        <GradingMonitorPage
            {...props}
            indexRouteName="coordinator.grading-monitor.index"
            studentsRouteName="coordinator.grading-monitor.students"
        />
    );
}
