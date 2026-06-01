import { StatusBadge } from '@/Components/ui';
import { formatDate } from '@/utils/format';
import { SEMESTER_LABELS } from './utils';

export default function TermsPanel({ sy, terms, onActivate, onAddSummer }) {
    const hasSummer = terms.some(term => term.semester === 'summer');

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Academic Terms</p>
                {!hasSummer && sy.status !== 'finalized' && (
                    <button
                        onClick={onAddSummer}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                    >
                        + Add Summer Term
                    </button>
                )}
            </div>

            {terms.length === 0 && (
                <p className="text-sm text-gray-400">No terms found.</p>
            )}

            <div className="space-y-2">
                {terms.map(term => (
                    <div
                        key={term.id}
                        className="flex items-center justify-between border border-gray-200 bg-white px-4 py-3"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-800">
                                {SEMESTER_LABELS[term.semester]}
                            </span>
                            {term.is_active && <StatusBadge status="active" />}
                            {term.start_date && (
                                <span className="text-xs text-gray-400">
                                    {formatDate(term.start_date)} to {formatDate(term.end_date)}
                                </span>
                            )}
                        </div>

                        {sy.status !== 'finalized' && !term.is_active && (
                            <button
                                onClick={() => onActivate(term)}
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-800"
                            >
                                Set Active
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
