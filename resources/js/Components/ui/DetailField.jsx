export default function DetailField({ label, value, className = '' }) {
    return (
        <div className={className}>
            <dt className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{value ?? '-'}</dd>
        </div>
    );
}
