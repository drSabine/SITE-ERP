const variants = {
    active:    'bg-green-100 text-green-800',
    inactive:  'bg-yellow-100 text-yellow-800',
    finalized: 'bg-gray-200 text-gray-600',
    enrolled:  'bg-emerald-100 text-emerald-800',
    passed:    'bg-green-100 text-green-800',
    failed:    'bg-red-100 text-red-800',
    dropped:   'bg-red-100 text-red-800',
    inc:          'bg-orange-100 text-orange-800',
    credited:     'bg-teal-100 text-teal-800',
    not_enrolled: 'bg-amber-100 text-amber-700',
    pending:      'bg-amber-100 text-amber-700',
    verified:     'bg-emerald-100 text-emerald-800',
    rejected:     'bg-red-100 text-red-800',
};

const defaultLabels = {
    active:    'Active',
    inactive:  'Inactive',
    finalized: 'Finalized',
    enrolled:      'Enrolled',
    passed:    'Passed',
    failed:    'Failed',
    dropped:   'Dropped',
    inc:          'INC',
    credited:     'Credited',
    not_enrolled: 'Not Enrolled',
    pending:      'Pending',
    verified:     'Verified',
    rejected:     'Rejected',
};

export default function StatusBadge({ status, label }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${variants[status] ?? 'bg-gray-100 text-gray-600'}`}>
            {label ?? defaultLabels[status] ?? status}
        </span>
    );
}
