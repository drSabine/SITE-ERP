import { Link } from '@inertiajs/react';
import { StatusBadge } from '@/Components/ui';

/**
 * Reusable gradebook card (teacher dashboard + gradebook index).
 * metrics: { total_students, graded_count, pending_count, inc_count, failed_count, dropped_count, completion_rate }
 */
export default function GradebookCard({ href, code, title, sectionLabel, metrics = {} }) {
    const total = metrics.total_students ?? 0;
    const graded = metrics.graded_count ?? 0;
    const pending = metrics.pending_count ?? 0;
    const rate = metrics.completion_rate ?? 0;

    return (
        <Link href={href} className="group block border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-emerald-800">{code}</p>
                    <p className="truncate text-xs text-gray-500">{title}</p>
                </div>
                {pending > 0 && (
                    <span className="shrink-0 border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        {pending} ungraded
                    </span>
                )}
            </div>

            <p className="mt-1 text-xs text-gray-400">{sectionLabel}</p>

            <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                    <span>{graded}/{total} graded</span>
                    <span className="font-semibold text-gray-700">{rate}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100">
                    <div className="h-2 bg-emerald-600" style={{ width: `${rate}%` }} />
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
                {metrics.inc_count > 0 && <StatusBadge status="inc" label={`${metrics.inc_count} INC`} />}
                {metrics.failed_count > 0 && <StatusBadge status="failed" label={`${metrics.failed_count} Failed`} />}
                {metrics.dropped_count > 0 && <StatusBadge status="dropped" label={`${metrics.dropped_count} Drop`} />}
            </div>
        </Link>
    );
}
