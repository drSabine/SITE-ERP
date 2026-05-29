import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    buildAdminSections,
    buildCoordinatorSections,
    buildTeachingSections,
    buildStudentSections,
} from '@/Components/Dashboard';

const ROLE_LABELS = {
    admin:       'Administrator',
    coordinator: 'Program Coordinator',
    teacher:     'Teacher',
    student:     'Student',
};

function WelcomeHeader({ user, activeTerm, hasTeachingLoad }) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    let roleLabel = ROLE_LABELS[user.role] ?? user.role;
    if (hasTeachingLoad && user.role !== 'teacher') roleLabel += ' and Teacher';
    const termLabel = activeTerm ? `${activeTerm.semester} - ${activeTerm.school_year?.name ?? ''}` : null;

    return (
        <div className="border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">{roleLabel}</p>
            <h1 className="mt-1 text-xl font-bold text-gray-900">{greeting}, {user.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
                {termLabel ? `Active term: ${termLabel}` : 'No active academic term.'}
            </p>
        </div>
    );
}

function ActionCard({ title, description, href, disabled = false }) {
    if (disabled) {
        return (
            <div className="border border-gray-200 bg-gray-50 p-5 opacity-50">
                <p className="text-sm font-semibold text-gray-700">{title}</p>
                {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
            </div>
        );
    }

    return (
        <Link href={href} className="block border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50">
            <p className="text-sm font-semibold text-gray-800">{title}</p>
            {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
        </Link>
    );
}

export default function Dashboard({
    activeTerm,
    hasTeachingLoad = false,
    studentCount,
    enrolledCount,
    incCount,
}) {
    const { auth } = usePage().props;
    const user = auth.user;
    const role = user.role;
    const hasActiveTerm = !!activeTerm;

    const showTeaching = role === 'teacher' || hasTeachingLoad;

    const sections = [
        ...(role === 'admin'       ? buildAdminSections() : []),
        ...(role === 'coordinator' ? buildCoordinatorSections() : []),
        ...(showTeaching           ? buildTeachingSections({ hasActiveTerm }) : []),
        ...(role === 'student'     ? buildStudentSections() : []),
    ];

    const statCards = [
        ...(role === 'admin' ? [
            { label: 'Total Students', value: studentCount ?? 0 },
            { label: 'Currently Enrolled', value: enrolledCount ?? 0 },
        ] : []),
        ...(role === 'coordinator' ? [
            { label: 'INC / Deficiency Count', value: incCount ?? 0 },
        ] : []),
    ];

    return (
        <AuthenticatedLayout header="Dashboard">
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="space-y-6">
                        <WelcomeHeader user={user} activeTerm={activeTerm} hasTeachingLoad={hasTeachingLoad} />

                        {statCards.length > 0 && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {statCards.map(stat => (
                                    <div key={stat.label} className="border border-gray-200 bg-white p-6 shadow-sm">
                                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                        <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sections.map(({ title, cols, cards }) => (
                            <div key={title}>
                                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">{title}</h2>
                                <div className={`grid gap-3 ${cols}`}>
                                    {cards.map(card => (
                                        <ActionCard key={card.href} {...card} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
