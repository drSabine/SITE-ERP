import { Link } from '@inertiajs/react';
import { getYearLabel } from '@/Components/Coordinator/Shared';
import GradebookCard from './GradebookCard';

const MAX_VISIBLE = 6;

function Tile({ label, value, accent = 'text-gray-900' }) {
    return (
        <div className="border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
        </div>
    );
}

export default function TeacherTeachingPanel({ teaching = {} }) {
    const { stats = {}, gradebooks = [] } = teaching;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Tile label="Sections Handled" value={stats.sections ?? 0} />
                <Tile label="Total Students" value={stats.totalStudents ?? 0} />
                <Tile label="Ungraded" value={stats.ungraded ?? 0} accent={(stats.ungraded ?? 0) > 0 ? 'text-amber-600' : 'text-gray-900'} />
                <Tile label="INC" value={stats.inc ?? 0} accent={(stats.inc ?? 0) > 0 ? 'text-amber-600' : 'text-gray-900'} />
            </div>

            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">My Gradebooks</h2>
                    {gradebooks.length > MAX_VISIBLE && (
                        <Link href={route('teacher.grades.index')} className="text-xs font-semibold uppercase tracking-widest text-emerald-700 hover:text-emerald-900">
                            See all ({gradebooks.length}) →
                        </Link>
                    )}
                </div>
                {gradebooks.length === 0 ? (
                    <div className="border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-400 shadow-sm">
                        No gradebooks for the active term.
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {gradebooks.slice(0, MAX_VISIBLE).map(book => (
                            <GradebookCard
                                key={book.id}
                                href={route('teacher.grades.show', book.id)}
                                code={book.course_code}
                                title={book.title}
                                sectionLabel={`${book.section ?? '-'} · ${book.program ?? '-'} ${getYearLabel(book.year_level)}`}
                                metrics={book.metrics}
                            />
                        ))}
                    </div>
                )}
                {gradebooks.length > MAX_VISIBLE && (
                    <div className="mt-3 text-center">
                        <Link href={route('teacher.grades.index')} className="inline-flex border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm hover:bg-gray-50">
                            See {gradebooks.length - MAX_VISIBLE} more
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
