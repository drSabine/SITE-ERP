import { Link, usePage, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ConfirmModal } from '@/Components/ui';
import {
    DashboardIcon,
    SchoolYearsIcon,
    UsersIcon,
    ProgramsIcon,
    StudentsIcon,
    EnrollmentsIcon,
    SectionsIcon,
    AssignmentsIcon,
    GradingMonitorIcon,
    GraduationIcon,
    GradesIcon,
    MyGradesIcon,
    DocumentsIcon,
    SubmissionStatusIcon,
    VerifyIcon,
    ActivityLogsIcon,
} from '@/Components/ui/Icons';

const ROLE_LABEL = {
    admin: 'Administrator',
    coordinator: 'Program Coordinator',
    teacher: 'Teacher',
    student: 'Student',
};

function buildNavSections(role, hasTeachingLoad, documentsPendingCount) {
    const sections = [
        {
            title: null,
            items: [{ label: 'Dashboard', href: route('dashboard'), match: '/dashboard', Icon: DashboardIcon }],
        },
    ];

    if (role === 'admin') {
        sections.push({
            title: 'Administration',
            items: [
                { label: 'School Years', href: route('admin.school-years.index'), match: '/admin/school-years', Icon: SchoolYearsIcon },
                { label: 'Users', href: route('admin.users.index'), match: '/admin/users', Icon: UsersIcon },
                { label: 'Programs', href: route('admin.programs.index'), match: '/admin/programs', Icon: ProgramsIcon },
                { label: 'Teacher Assignment', href: route('admin.assignments.index'), match: '/admin/assignments', Icon: AssignmentsIcon },
                { label: 'Grading Monitor', href: route('admin.grading-monitor.index'), match: '/admin/grading-monitor', Icon: GradingMonitorIcon },
                { label: 'Activity Logs', href: route('admin.activity-logs.index'), match: '/admin/activity-logs', Icon: ActivityLogsIcon },
            ],
        });
    }

    if (role === 'coordinator_it' || role === 'coordinator_engineering') {
        sections.push({
            title: 'Coordination',
            items: [
                { label: 'Students', href: route('coordinator.students.index'), match: '/coordinator/students', Icon: StudentsIcon },
                { label: 'Evaluations', href: route('coordinator.enrollments.index'), match: '/coordinator/enrollments', Icon: EnrollmentsIcon },
                { label: 'Section Assignment', href: route('coordinator.sections.index'), match: '/coordinator/sections', Icon: SectionsIcon },
                { label: 'Grading Monitor', href: route('coordinator.grading-monitor.index'), match: '/coordinator/grading-monitor', Icon: GradingMonitorIcon },
                { label: 'Graduation', href: route('coordinator.graduation.index'), match: '/coordinator/graduation', Icon: GraduationIcon },
            ],
        });
    }

    if (role === 'teacher' || hasTeachingLoad) {
        sections.push({
            title: 'Teaching',
            items: [
                { label: 'Grades', href: route('teacher.grades.index'), match: '/teacher/grades', Icon: GradesIcon },
            ],
        });
    }

    // Student-facing academics.
    if (role === 'student') {
        sections.push({
            title: 'Academics',
            items: [
                { label: 'My Grades', href: route('student.grades.index'), match: '/student/grades', Icon: MyGradesIcon },
            ],
        });
    }

    // Document Submission & Verification — staff roles only (students never submit documents).
    const isStaff = ['admin', 'coordinator_it', 'coordinator_engineering', 'teacher'].includes(role);
    if (isStaff) {
        const documentItems = [
            { label: 'Documents', href: route('documents.index'), match: '/documents', exact: true, Icon: DocumentsIcon },
            { label: 'Submission Status', href: route('documents.status'), match: '/documents/status', Icon: SubmissionStatusIcon },
        ];

        if (role === 'admin') {
            documentItems.push({
                label: 'Verification',
                href: route('documents.verify'),
                match: '/documents/verify',
                Icon: VerifyIcon,
                badge: documentsPendingCount,
            });
        }

        sections.push({ title: 'Documents', items: documentItems });
    }

    return sections;
}

export default function AuthenticatedLayout({ header, children }) {
    const { auth, hasTeachingLoad = false, documentsPendingCount = 0 } = usePage().props;
    const user = auth.user;
    const role = user.role;

    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [confirm, setConfirm] = useState(null);

    function handleSignOut() {
        setConfirm({
            title: 'Sign Out',
            message: <>Are you sure you want to sign out?</>,
            confirmLabel: 'Sign Out',
            onConfirm: () => router.post(route('logout'), {}, {
                onFinish: () => setConfirm(null),
            }),
        });
    }

    useEffect(() => {
        function tick() {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour12: true }));
            setCurrentDate(now.toLocaleDateString('en-PH', {
                timeZone: 'Asia/Manila',
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }));
        }

        tick();
        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
    }, []);

    const navSections = buildNavSections(role, hasTeachingLoad, documentsPendingCount);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col bg-emerald-900 select-none print:hidden">
                <div className="shrink-0 border-b border-emerald-800 bg-emerald-950 px-5 py-6">
                    <div className="flex flex-col items-center text-center">
                        <img
                            src="/images/SPUP-final-logo.png"
                            alt="SPUP"
                            className="h-14 w-14 object-contain"
                        />
                        <div className="mt-3.5 min-w-0">
                            <p className="text-[12.5px] font-medium leading-snug text-white/95" style={{ fontFamily: 'OldEnglish' }}>
                                St. Paul University Philippines
                            </p>
                            <p className="mt-2.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-300 leading-tight">
                                School of Information Technology and Engineering
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-2 py-3 custom-sidebar-scrollbar">
                    {navSections.map(section => (
                        <div key={section.title ?? '_main'} className="mb-4">
                            {section.title && (
                                <p className="mb-1.5 mt-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-yellow-400 opacity-70">
                                    {section.title}
                                </p>
                            )}
                            {section.items.map(item => {
                                const isActive = item.exact
                                    ? currentPath === item.match
                                    : currentPath.startsWith(item.match);

                                return (
                                    <Link
                                        key={item.match}
                                        href={item.href}
                                        className={`group mb-0.5 flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                                            isActive
                                                ? 'bg-emerald-700 text-white'
                                                : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                                        }`}
                                    >
                                        {item.Icon && (
                                            <item.Icon
                                                className={`h-[18px] w-[18px] shrink-0 transition-all duration-200 ${
                                                    isActive
                                                        ? 'opacity-100'
                                                        : 'opacity-80 group-hover:opacity-100 group-hover:translate-x-[2px]'
                                                }`}
                                            />
                                        )}
                                        <span className={`transition-transform duration-200 ${isActive ? '' : 'group-hover:translate-x-[2px]'}`}>
                                            {item.label}
                                        </span>
                                        {item.badge > 0 && (
                                            <span className="ml-auto inline-flex min-w-[18px] items-center justify-center bg-yellow-400 px-1.5 text-[10px] font-bold text-emerald-950 transition-transform duration-200 group-hover:scale-105">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="shrink-0 border-t border-emerald-700 bg-emerald-950 px-5 py-4">
                    <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                    <p className="truncate text-[10px] text-emerald-400">{user.email}</p>
                    {hasTeachingLoad && role !== 'teacher' && (
                        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-yellow-400">+ Teaching Load</p>
                    )}
                    <button
                        onClick={handleSignOut}
                        className="mt-2.5 block w-full border border-emerald-700 bg-transparent px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-widest text-emerald-300 transition-all duration-200 hover:bg-emerald-800 hover:text-white"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm print:hidden">
                    <p className="text-base font-semibold text-gray-800">{header ?? 'Dashboard'}</p>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-700">{currentTime}</p>
                        <p className="text-xs text-gray-400">{currentDate} | Philippine Time</p>
                    </div>
                </header>

                <main className="flex-1">
                    {children}
                </main>
            </div>

            <ConfirmModal
                show={confirm !== null}
                title={confirm?.title}
                message={confirm?.message}
                confirmLabel={confirm?.confirmLabel}
                onConfirm={confirm?.onConfirm}
                onClose={() => setConfirm(null)}
            />
        </div>
    );
}
