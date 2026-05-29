/**
 * Reusable search bar form.
 *
 * value      - controlled input value
 * onChange   - input change handler (receives the event)
 * onSubmit   - form submit handler (receives the event)
 * onClear    - optional clear handler; shows "Clear" link when provided and active=true
 * active     - whether a search filter is currently applied (shows Clear link)
 * placeholder - input placeholder text
 */
export default function SearchBar({
    value,
    onChange,
    onSubmit,
    onClear,
    active = false,
    placeholder = 'Search...',
}) {
    return (
        <form onSubmit={onSubmit} className="flex items-center gap-2">
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-80 border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
            <button
                type="submit"
                className="border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-600 hover:bg-gray-50"
            >
                Search
            </button>
            {active && onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="text-xs text-gray-400 hover:text-gray-600"
                >
                    Clear
                </button>
            )}
        </form>
    );
}
