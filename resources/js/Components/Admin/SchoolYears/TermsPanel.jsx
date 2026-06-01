import { StatusBadge } from '@/Components/ui';
import { formatDate } from '@/utils/format';
import { SEMESTER_LABELS } from './utils';

export default function TermsPanel({ sy, terms, onActivate, onEditDates }) {
    return (
        <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Academic Terms</p>

            {terms.length === 0 && (
                <p className="text-sm text-gray-400">No terms found.</p>
            )}

            <div className="grid gap-3 md:grid-cols-3">
                {terms.map(term => (
                    <div
                        key={term.id}
                        className={`border px-4 py-3 ${
                            term.is_active
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {SEMESTER_LABELS[term.semester]}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    {term.start_date
                                        ? `${formatDate(term.start_date)} – ${formatDate(term.end_date)}`
                                        : 'No dates set'}
                                </p>
                            </div>
                            {term.is_active && <StatusBadge status="active" />}
                        </div>

                        {sy.status !== 'finalized' && (
                            <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                                {!term.is_active && (
                                    <button
                                        type="button"
                                        onClick={() => onActivate(term)}
                                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                                    >
                                        Set Active
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onEditDates(term)}
                                    className="text-xs font-medium text-gray-500 hover:text-gray-700"
                                >
                                    {term.start_date ? 'Edit Dates' : 'Set Dates'}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

