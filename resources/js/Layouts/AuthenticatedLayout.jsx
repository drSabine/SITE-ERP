import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    DashboardIcon,
    SchoolYearsIcon,
    UsersIcon,
    ProgramsIcon,
    StudentsIcon,
    EnrollmentsIcon,
    AssignmentsIcon,
    GradesIcon,
} from '@/Components/ui/Icons';

const ROLE_LABEL = {
    admin: 'Administrator',
    coordinator: 'Program Coordinator',
    teacher: 'Teacher',
    student: 'Student',
};

function buildNavSections(role, hasTeachingLoad) {
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
            ],
        });
    }

    if (role === 'coordinator') {
        sections.push({
            title: 'Coordination',
            items: [
                { label: 'Students', href: route('coordinator.students.index'), match: '/coordinator/students', Icon: StudentsIcon },
                { label: 'Enrollments', href: route('coordinator.enrollments.index'), match: '/coordinator/enrollments', Icon: EnrollmentsIcon },
                { label: 'Assignments', href: route('coordinator.assignments.index'), match: '/coordinator/assignments', Icon: AssignmentsIcon },
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

    return sections;
}

export default function AuthenticatedLayout({ header, children }) {
    const { auth, hasTeachingLoad = false } = usePage().props;
    const user = auth.user;
    const role = user.role;

    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');

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

    const navSections = buildNavSections(role, hasTeachingLoad);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col bg-emerald-900">
                <div className="shrink-0 border-b border-emerald-700 bg-emerald-950 px-5 py-6">
                    <div className="flex flex-col items-center text-center">
                        <img
                            src="/images/SPUP-final-logo.png"
                            alt="SPUP"
                            className="h-14 w-14 object-contain"
                        />
                        <div className="mt-3 min-w-0">
                            <p className="text-[13px] font-medium leading-snug text-white" style={{ fontFamily: 'OldEnglish' }}>
                                St. Paul University Philippines
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-none tracking-[0.35em] text-emerald-300">
                                SITE
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-2 py-3">
                    {navSections.map(section => (
                        <div key={section.title ?? '_main'} className="mb-4">
                            {section.title && (
                                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-yellow-400 opacity-70">
                                    {section.title}
                                </p>
                            )}
                            {section.items.map(item => {
                                const isActive = currentPath.startsWith(item.match);

                                return (
                                    <Link
                                        key={item.match}
                                        href={item.href}
                                        className={`mb-0.5 flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-emerald-700 text-white'
                                                : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                                        }`}
                                    >
                                        {item.Icon && <item.Icon className="h-[18px] w-[18px] shrink-0 opacity-80" />}
                                        <span>{item.label}</span>
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
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="mt-2.5 block w-full border border-emerald-700 px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-800 hover:text-white"
                    >
                        Sign Out
                    </Link>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
                    <p className="text-base font-semibold text-gray-800">{header ?? 'Dashboard'}</p>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-700">{currentTime}</p>
                        <p className="text-xs text-gray-400">{currentDate} - Philippine Time</p>
                    </div>
                </header>

                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
