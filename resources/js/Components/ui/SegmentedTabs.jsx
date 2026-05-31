export default function SegmentedTabs({ options, value, onChange, grow = false }) {
    return (
        <div className="flex gap-0 border-b border-gray-200">
            {options.map(option => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`${grow ? 'flex-1' : ''} px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
                        value === option.value
                            ? 'border-b-2 border-emerald-600 bg-white text-emerald-700'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
