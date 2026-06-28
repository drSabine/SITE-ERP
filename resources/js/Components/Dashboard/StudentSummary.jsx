import { Link } from '@inertiajs/react';
import { StatusBadge } from '@/Components/ui';
import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';
import { formatGrade, formatGwa } from '@/utils/grades';

function Tile({ label, value, accent = 'text-gray-900' }) {
    return (
        <div className="border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
        </div>
    );
}

export default function StudentSummary({ summary = {} }) {
    const { overallGwa, currentTerm, incTotal = 0, termCount = 0 } = summary;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Tile label="Overall GWA" value={formatGwa(overallGwa)} accent="text-emerald-700" />
                <Tile label="Current Term GWA" value={currentTerm ? formatGwa(currentTerm.gwa) : '—'} accent="text-emerald-700" />
                <Tile label="INC / Deficiencies" value={incTotal} accent={incTotal > 0 ? 'text-amber-600' : 'text-gray-900'} />
                <Tile label="Terms Recorded" value={termCount} />
            </div>

            <section className="border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Current Term</h2>
                        {currentTerm && (
                            <p className="mt-0.5 text-xs text-gray-400">
                                {getSemesterLabel(currentTerm.semester)} · {getYearLabel(currentTerm.year_level)}
                            </p>
                        )}
                    </div>
                    <Link href={route('student.grades.index')} className="text-xs font-semibold uppercase tracking-widest text-emerald-700 hover:text-emerald-900">
                        View All Grades →
                    </Link>
                </div>

                <div className="p-5">
                    {!currentTerm ? (
                        <p className="py-6 text-center text-sm text-gray-400">You are not enrolled in the active term.</p>
                    ) : currentTerm.courses.length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-400">No subjects loaded for this term yet.</p>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {currentTerm.courses.map(course => (
                                <div key={course.course_code} className="flex items-center justify-between gap-3 py-2 text-sm">
                                    <span className="min-w-0 truncate">
                                        <span className="font-mono text-xs font-semibold text-emerald-800">{course.course_code}</span>
                                        <span className="ml-2 text-gray-600">{course.title}</span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-3">
                                        <span className="tabular-nums font-semibold text-gray-900">{formatGrade(course)}</span>
                                        <StatusBadge status={course.status} />
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
